import "server-only"
import { randomInt } from "node:crypto"
import type { AuthenticatedAppUser } from "./serverAuth"
import { buildTraditionalDraw, resolveTraditionalTournament } from "./traditionalTournament"
import { buildTraditionalSchedule, type TraditionalScheduleEntry, type TraditionalScheduleOptions } from "./traditionalTournamentSchedule"
import { readTraditionalStoredState, traditionalMatchKey } from "./traditionalTournamentState"
import { parseTournamentPoints } from "./tournamentResult"

export type TraditionalCommand = {
  action?: unknown; revision?: unknown; matchId?: unknown; scoreA?: unknown; scoreB?: unknown
  seededTeamIds?: unknown; manualOrder?: unknown; manualGroups?: unknown; schedule?: unknown; tieOrders?: unknown
}
export function isTraditionalTournamentFormat(format: unknown) { return format === "knockout" || format === "groups" || format === "groups_knockout" }
const strings = (value: unknown) => {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.some(id => typeof id !== "string")) throw new Error("invalid_manual_draw")
  return value as string[]
}
const invalid = (error: string, status = 400) => ({ ok: false as const, error, status })

export async function readTraditionalTournament(actor: AuthenticatedAppUser, tournamentId: string, options: TraditionalScheduleOptions) {
  const result = await actor.supabase.from("traditional_tournament_state").select("draw,results,schedule,tie_orders,revision").eq("tournament_id", tournamentId).maybeSingle()
  if (result.error || !result.data) return { data: null, error: "traditional_tournament_read_failed" }
  try { return { data: readTraditionalStoredState(result.data, options), error: null } }
  catch { return { data: null, error: "traditional_tournament_state_invalid" } }
}

// Authentication/creator checks remain at the route; SQL rechecks actor,
// suspension, state and the exact revision while locking the tournament.
export async function executeTraditionalTournamentCommand(actor: AuthenticatedAppUser, tournamentId: string, body: TraditionalCommand) {
  const tournament = await actor.supabase.from("rapid_tournaments").select("tournament_mode,starts_at,court_count,round_minutes,transition_minutes,status").eq("id", tournamentId).single()
  if (tournament.error || !tournament.data) return invalid("tournament_read_failed", 500)
  const config = tournament.data
  if (config.tournament_mode !== "traditional") return invalid("traditional_tournament_not_found", 404)
  const options = { startsAt: config.starts_at, courts: config.court_count, matchMinutes: config.round_minutes, transitionMinutes: config.transition_minutes }
  const stored = await readTraditionalTournament(actor, tournamentId, options)
  if (!stored.data) return invalid(stored.error!, 500)
  if (!Number.isSafeInteger(body.revision) || body.revision !== stored.data.revision) return invalid("traditional_tournament_changed_refresh", 409)
  const action = body.action
  if (typeof action !== "string" || !["draw","start","result","schedule","ties","finish"].includes(action)) return invalid("invalid_traditional_action")
  if (config.status === "finished" || ["draw","start"].includes(action) && config.status !== "draft" || ["result","ties","finish"].includes(action) && config.status !== "in_progress") return invalid("traditional_tournament_action_locked", 409)
  let { draw, results, schedule, tieOrders } = stored.data
  try {
    if (action === "draw") {
      const manualGroups = body.manualGroups === undefined ? undefined : Array.isArray(body.manualGroups) ? body.manualGroups.map(value => strings(value)!) : (() => { throw new Error("invalid_manual_groups") })()
      draw = buildTraditionalDraw({ teams: draw.teams, configuration: draw.configuration, seed: randomInt(1,2147483647), seededTeamIds: strings(body.seededTeamIds), manualOrder: strings(body.manualOrder), manualGroups })
      schedule = schedule.length ? buildTraditionalSchedule(draw, options) : []; tieOrders = {}
    }
    if (action === "result") {
      const score = parseTournamentPoints(body.scoreA, body.scoreB)
      if (!score || typeof body.matchId !== "string" || !traditionalMatchKey({ id: body.matchId })) return invalid("invalid_traditional_result")
      const current = resolveTraditionalTournament(draw, results, tieOrders).matches.find(match => match.id === body.matchId)
      if (!current || !["ready","completed"].includes(current.state) || !current.teamAId || !current.teamBId) return invalid("traditional_match_not_ready", 409)
      if (current.stage !== "group" && score.a === score.b) return invalid("traditional_knockout_requires_winner")
      results = [...results.filter(result => result.matchId !== current.id), { matchId: current.id, teamAId: current.teamAId, teamBId: current.teamBId, scoreA: score.a, scoreB: score.b }]
    }
    if (action === "schedule") {
      if (!Array.isArray(body.schedule)) return invalid("invalid_traditional_schedule")
      schedule = body.schedule as TraditionalScheduleEntry[]
    }
    if (action === "ties") {
      if (!body.tieOrders || typeof body.tieOrders !== "object" || Array.isArray(body.tieOrders)) return invalid("invalid_group_tie_order")
      tieOrders = body.tieOrders as Record<string, string[]>
    }
    const state = readTraditionalStoredState({ draw,results,schedule,tie_orders:tieOrders,revision:stored.data.revision }, options)
    if(action==="schedule"&&results.some(result=>{
      const before=stored.data.schedule.find(slot=>slot.matchId===result.matchId),after=state.schedule.find(slot=>slot.matchId===result.matchId)
      return before?.startsAt!==after?.startsAt||before?.endsAt!==after?.endsAt||before?.court!==after?.court
    }))return invalid("played_traditional_schedule_locked",409)
    if (action === "finish" && !resolveTraditionalTournament(draw, results, tieOrders).complete) return invalid("traditional_tournament_incomplete", 409)
    const saved = await actor.supabase.rpc("update_traditional_tournament", {
      p_tournament_id: tournamentId, p_actor_user_id: actor.user.id, p_expected_revision: body.revision, p_action: action,
      p_draw: action === "draw" ? state.draw : null, p_results: action === "result" ? state.results : null,
      p_schedule: ["draw","schedule"].includes(action) ? state.schedule : null, p_tie_orders: ["draw","ties"].includes(action) ? state.tieOrders : null,
    })
    if (saved.error) return invalid("traditional_tournament_save_failed", 500)
    if (!Number.isSafeInteger(saved.data) || saved.data < 0) return invalid("traditional_tournament_changed_refresh", 409)
    return { ok: true as const, revision: saved.data }
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid_traditional_action"
    return invalid(code === "played_traditional_match_changed" ? code : "invalid_traditional_configuration_or_calendar", code === "played_traditional_match_changed" ? 409 : 400)
  }
}
