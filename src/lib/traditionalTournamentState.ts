import { buildTraditionalDraw, resolveTraditionalTournament, type TraditionalConfiguration, type TraditionalMatch, type TraditionalPlan, type TraditionalResult, type TraditionalSource } from "./traditionalTournament"
import { validateTraditionalSchedule, type TraditionalScheduleEntry, type TraditionalScheduleOptions } from "./traditionalTournamentSchedule"
import type { FixedTournamentTeam } from "./fixedRapidTournament"

export type TraditionalStoredState = {
  draw: TraditionalPlan; results: TraditionalResult[]; schedule: TraditionalScheduleEntry[]
  tieOrders: Record<string, string[]>; revision: number
}
function invalid(): never { throw new Error("invalid_traditional_state") }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid()
  return value as Record<string, unknown>
}
function text(value: unknown) { if (typeof value !== "string" || !value || value.length > 100) invalid(); return value }
function texts(value: unknown) { if (!Array.isArray(value)) invalid(); return value.map(text) }
function array(value: unknown) { if (!Array.isArray(value)) invalid(); return value }
function integer(value: unknown) { if (typeof value !== "number" || !Number.isSafeInteger(value)) invalid(); return value }
function source(value: unknown): TraditionalSource {
  if (value === null) return null
  const item = record(value)
  if (item.kind === "team") return { kind: "team", teamId: text(item.teamId) }
  if (item.kind === "winner" || item.kind === "loser") return { kind: item.kind, matchId: text(item.matchId) }
  if (item.kind === "group") return { kind: "group", groupId: text(item.groupId), position: integer(item.position) }
  return invalid()
}

// Supabase JSON is untyped. Reconstruct the canonical bounded draw rather than
// passing a cast of persisted fields to the UI or accepting a client-side graph.
export function readTraditionalStoredState(value: unknown, options: TraditionalScheduleOptions): TraditionalStoredState {
  const row = record(value), stored = record(row.draw), revision = integer(row.revision)
  if (revision < 0) invalid()
  const teams: FixedTournamentTeam[] = array(stored.teams).map(value => {
    const team = record(value), ids = texts(team.playerIds)
    if (ids.length !== 2) invalid()
    return { id: text(team.id), playerIds: [ids[0], ids[1]] }
  })
  const groups = array(stored.groups).map(value => { const group = record(value); return { id: text(group.id), teamIds: texts(group.teamIds) } })
  const draw = buildTraditionalDraw({ teams, configuration: record(stored.configuration) as TraditionalConfiguration, seed: 0, manualOrder: texts(stored.seedOrder), ...(groups.length ? { manualGroups: groups.map(group => group.teamIds) } : {}) })
  const matches = array(stored.matches).map(value => {
    const match = record(value)
    return { id: text(match.id), stage: text(match.stage), round: integer(match.round), groupId: match.groupId === null ? null : text(match.groupId), a: source(match.a), b: source(match.b) }
  })
  if (JSON.stringify(matches) !== JSON.stringify(draw.matches) || JSON.stringify(groups) !== JSON.stringify(draw.groups)) invalid()
  const results: TraditionalResult[] = array(row.results).map(value => {
    const result = record(value)
    return { matchId: text(result.matchId), teamAId: text(result.teamAId), teamBId: text(result.teamBId), scoreA: integer(result.scoreA), scoreB: integer(result.scoreB) }
  })
  const schedule: TraditionalScheduleEntry[] = array(row.schedule).map(value => {
    const slot = record(value)
    return { matchId: text(slot.matchId), startsAt: text(slot.startsAt), endsAt: text(slot.endsAt), court: integer(slot.court) }
  })
  const tieOrders = Object.fromEntries(Object.entries(record(row.tie_orders)).map(([id, order]) => [id, texts(order)]))
  resolveTraditionalTournament(draw, results, tieOrders)
  validateTraditionalSchedule(draw, schedule, options)
  return { draw, results, schedule, tieOrders, revision }
}

export const traditionalMatchKey = (match: Pick<TraditionalMatch, "id">) => /^[a-z0-9-]{1,80}$/.test(match.id)
