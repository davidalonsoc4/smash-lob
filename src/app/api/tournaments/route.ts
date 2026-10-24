import { NextResponse } from "next/server"
import { randomInt } from "node:crypto"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { normalizeBoundedText, parseJsonBody, validateIsoDateTime } from "@/lib/serverRequest"
import { buildRapidRounds, buildRapidScheduleChecks, generateBalancedAmericanaFixtures, getRapidPreparationMax, getRapidRoundCount, RAPID_TOURNAMENT_SLOTS, shuffleTournamentEntries, validateRapidTournamentConfiguration, validateTournamentParticipants } from "@/lib/rapidTournament"
import { validateUuid } from "@/lib/serverRequest"
import { getRapidTournamentSelectablePeople } from "@/lib/serverRapidTournamentPeople"
import { getServerLeagueViewer } from "@/lib/serverLeagueAccess"
import { getTournamentLeagueRoster } from "@/lib/serverTournamentLeagueRoster"
import { planRapidTournament } from "@/lib/tournamentConfiguration"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const isMissingAccountLinkSchema = (error: { code?: string; message?: string } | null) => Boolean(error && (error.code === "42703" || error.code === "PGRST204") && /user_id/i.test(error.message ?? ""))
const isMissingFlexibleCreateRpc = (error: { code?: string; message?: string } | null) => Boolean(error && (error.code === "PGRST202" || error.code === "42883") && /create_rapid_tournament_flexible/i.test(error.message ?? ""))
type CreateTournamentBody = { name?: unknown; description?: unknown; startsAt?: unknown; courtNames?: unknown; players?: unknown; playerUserIds?: unknown; playerCount?: unknown; reservationMinutes?: unknown; preparationMinutes?: unknown; format?: unknown; duplicateOf?: unknown; source?: { leagueId?: unknown; seasonId?: unknown; playerIds?: unknown } | null }
export async function GET(request: Request) {
  const rateLimited = await enforceRequestRateLimit({ request, scope: "rapid_tournaments_list", limit: 120, windowMs: 60_000 })
  if (rateLimited) return rateLimited
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: { "Cache-Control": "no-store" } })
  const { data: participantRows, error: participantError } = await auth.actor.supabase.from("rapid_tournament_players")
    .select("tournament_id").eq("user_id", auth.actor.user.id)
  if (participantError && !isMissingAccountLinkSchema(participantError)) return NextResponse.json({ error: "tournaments_read_failed" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  const participantIds = [...new Set((participantRows ?? []).map((row) => row.tournament_id))]
  let query = auth.actor.supabase
    .from("rapid_tournaments")
    .select("id,name,description,starts_at,status,created_at,finished_at,created_by_user_id,source_league_id,source_season_id")
  query = participantIds.length
    ? query.or(`created_by_user_id.eq.${auth.actor.user.id},id.in.(${participantIds.join(",")})`)
    : query.eq("created_by_user_id", auth.actor.user.id)
  const { data, error } = await query.order("starts_at", { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: "tournaments_read_failed" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  return NextResponse.json({ tournaments: (data ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description, startsAt: item.starts_at, status: item.status, createdAt: item.created_at, finishedAt: item.finished_at, sourceLeagueId: item.source_league_id, sourceSeasonId: item.source_season_id, role: item.created_by_user_id === auth.actor.user.id ? "creator" : "participant" })) }, { headers: { "Cache-Control": "no-store" } })
}
export async function POST(request: Request) {
  const rateLimited = await enforceRequestRateLimit({ request, scope: "rapid_tournaments_create", limit: 10, windowMs: 60 * 60_000 })
  if (rateLimited) return rateLimited
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await parseJsonBody<CreateTournamentBody>(request)
  const name = normalizeBoundedText(body?.name, 100)
  const description = normalizeBoundedText(body?.description, 1000)
  const startsAt = validateIsoDateTime(body?.startsAt)
  const playerCount = typeof body?.playerCount === "number" ? body.playerCount : Array.isArray(body?.players) ? body.players.length : 0
  const reservationMinutes = typeof body?.reservationMinutes === "number" ? body.reservationMinutes : 120
  const roundCount = getRapidRoundCount(reservationMinutes)
  const preparationMinutes = typeof body?.preparationMinutes === "number" ? body.preparationMinutes : 2
  const format = body?.format === "dynamic_mexicano" ? "dynamic_mexicano" : body?.format === undefined || body.format === "balanced_americana" ? "balanced_americana" : null
  const configurationValidation = validateRapidTournamentConfiguration(playerCount, Array.isArray(body?.courtNames) ? body.courtNames.length : 0, reservationMinutes)
  const courtNames = Array.isArray(body?.courtNames) ? body.courtNames.map((item) => normalizeBoundedText(item, 80)) : []
  const participants = validateTournamentParticipants(body?.players, playerCount)
  const playerUserIds = Array.isArray(body?.playerUserIds) ? body.playerUserIds : Array(playerCount).fill(null)
  if (!body || !name || !startsAt || !format || !configurationValidation.ok || courtNames.some((court) => !court) || !participants.ok || playerUserIds.length !== playerCount || playerUserIds.some((id) => id !== null && !validateUuid(id)) || !Number.isSafeInteger(preparationMinutes) || preparationMinutes < 0 || preparationMinutes > getRapidPreparationMax(reservationMinutes)) {
    return NextResponse.json({ error: !participants.ok ? participants.error : !configurationValidation.ok ? configurationValidation.error : "invalid_tournament_details" }, { status: 400 })
  }
  const accountIds = playerUserIds.map((id) => typeof id === "string" ? validateUuid(id) : null), linkedIds = accountIds.filter((id): id is string => Boolean(id))
  if (new Set(linkedIds).size !== linkedIds.length) return NextResponse.json({ error: "duplicate_player_accounts" }, { status: 400 })
  if (body.duplicateOf !== undefined) {
    if (body.source) return NextResponse.json({ error: "invalid_tournament_source" }, { status: 400 })
    const copied = await requireRapidTournamentCreator(body.duplicateOf)
    if (!copied.ok) return NextResponse.json({ error: copied.error }, { status: copied.status })
  }
  const sourceLeagueId = validateUuid(body?.source?.leagueId), sourceSeasonId = validateUuid(body?.source?.seasonId)
  const sourcePlayerIds = Array.isArray(body?.source?.playerIds) ? body.source.playerIds.map((id) => validateUuid(id)) : []; let canonicalNames = participants.ok ? participants.names : []
  if (Boolean(sourceLeagueId) !== Boolean(sourceSeasonId) || (body?.source && (!sourceLeagueId || !sourceSeasonId || sourcePlayerIds.length > playerCount || sourcePlayerIds.some((id) => !id) || new Set(sourcePlayerIds).size !== sourcePlayerIds.length))) return NextResponse.json({ error: "invalid_tournament_source" }, { status: 400 })
  if (sourceLeagueId && sourceSeasonId) {
    const access = await getServerLeagueViewer(sourceLeagueId, { requireAdmin: true })
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const source = await getTournamentLeagueRoster(access.actor.supabase, sourceLeagueId, sourceSeasonId)
    if (source.error || !source.players) return NextResponse.json({ error: source.error ?? "tournament_source_lookup_failed" }, { status: source.error === "tournament_source_not_found" ? 404 : 500 })
    const rosterById = new Map(source.players.map((player) => [player.playerId, player])), selectedRoster = sourcePlayerIds.map((id) => id ? rosterById.get(id) : null)
    if (selectedRoster.some((person) => !person) || selectedRoster.some((person, index) => (person?.userId ?? null) !== accountIds[index])) return NextResponse.json({ error: "invalid_tournament_source_players" }, { status: 400 })
    const validation = validateTournamentParticipants([...selectedRoster.map((person) => person!.displayName), ...participants.names.slice(sourcePlayerIds.length)], playerCount)
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 }); canonicalNames = validation.names
  }
  if (linkedIds.length && !sourceLeagueId) {
    const available = await getRapidTournamentSelectablePeople(auth.actor.supabase, auth.actor.user.id)
    if (available.error || !available.people) return NextResponse.json({ error: "tournament_people_lookup_failed" }, { status: 500 })
    const peopleById = new Map(available.people.map((person) => [person.userId, person.displayName]))
    if (linkedIds.some((id) => !peopleById.has(id))) return NextResponse.json({ error: "invalid_tournament_player_account" }, { status: 400 })
    canonicalNames = participants.names.map((personName, index) => accountIds[index] ? peopleById.get(accountIds[index]!)! : personName)
    const canonicalValidation = validateTournamentParticipants(canonicalNames, playerCount)
    if (!canonicalValidation.ok) return NextResponse.json({ error: canonicalValidation.error }, { status: 400 })
    canonicalNames = canonicalValidation.names
  }
  const entries = canonicalNames.map((playerName, index) => ({ name: playerName, userId: accountIds[index] }))
  const shuffled = format === "balanced_americana" ? shuffleTournamentEntries(entries) : entries
  const configuration = { players: playerCount, courts: courtNames.length, reservationMinutes, rounds: roundCount, roundMinutes: 16, transitionMinutes: 3, preparationMinutes }
  const plan = planRapidTournament({ ...configuration, pairing: "rotating" })
  if (!plan.ok) return NextResponse.json({ error: plan.error }, { status: 400 })
  const rounds = buildRapidRounds(new Date(Date.parse(startsAt) + preparationMinutes * 60_000), configuration)
  const fixtures = format === "balanced_americana" ? generateBalancedAmericanaFixtures(playerCount, courtNames.length, roundCount) : []
  if (format === "balanced_americana") {
    const schedule = buildRapidScheduleChecks(RAPID_TOURNAMENT_SLOTS.slice(0, playerCount).map((id, index) => ({ id, name: shuffled[index].name })), fixtures.map((match) => ({ round: match.round, court: match.court, teamAIds: match.teamA, teamBIds: match.teamB })), configuration)
    if (!schedule.passed) return NextResponse.json({ error: "tournament_schedule_validation_failed" }, { status: 422 })
  }
  const commonParameters = {
    p_creator_user_id: auth.actor.user.id, p_name: name, p_description: description, p_starts_at: startsAt,
    p_court_names: courtNames, p_player_names: shuffled.map((entry) => entry.name), p_player_user_ids: shuffled.map((entry) => entry.userId),
    p_reservation_minutes: reservationMinutes, p_preparation_minutes: preparationMinutes, p_round_count: roundCount,
    p_rounds: rounds.map((round) => ({ round_number: round.round, starts_at: round.startsAt, ends_at: round.endsAt })),
  }
  const result = format === "dynamic_mexicano"
    ? await auth.actor.supabase.rpc("create_dynamic_mexicano_tournament", { ...commonParameters, p_generation_seed: randomInt(1, 2_147_483_647) })
    : await auth.actor.supabase.rpc("create_rapid_tournament_flexible", { ...commonParameters, p_matches: fixtures.map((match) => ({ round_number: match.round, court_number: match.court, team_a: match.teamA, team_b: match.teamB })) })
  const { data, error } = result
  if (isMissingFlexibleCreateRpc(error) || error && format === "dynamic_mexicano" && ["PGRST202", "42883", "42703"].includes(error.code ?? "")) {
    return NextResponse.json({ error: "tournament_account_access_not_ready" }, { status: 503 })
  }
  if (error || typeof data !== "string") {
    console.error("[rapidTournaments] create failed", { code: error?.code ?? null })
    return NextResponse.json({ error: "tournament_create_failed" }, { status: 500 })
  }
  if (sourceLeagueId && sourceSeasonId) {
    const { error: sourceLinkError } = await auth.actor.supabase.from("rapid_tournaments").update({ source_league_id: sourceLeagueId, source_season_id: sourceSeasonId }).eq("id", data).eq("created_by_user_id", auth.actor.user.id)
    if (sourceLinkError) {
      await auth.actor.supabase.from("rapid_tournaments").delete().eq("id", data).eq("created_by_user_id", auth.actor.user.id)
      console.error("[rapidTournaments] source link failed", { code: sourceLinkError.code ?? null })
      return NextResponse.json({ error: "tournament_source_link_failed" }, { status: 500 })
    }
  }
  return NextResponse.json({ id: data }, { status: 201, headers: { "Cache-Control": "no-store" } })
}
