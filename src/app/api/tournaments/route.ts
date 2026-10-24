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
import { getRecommendedRapidRounds, planRapidTournament } from "@/lib/tournamentConfiguration"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"
import { normalizeStoredImageUrl } from "@/lib/serverImageValidation"
import { fixedTeamsFromPlayers, generateFixedAmericanaFixtures } from "@/lib/fixedRapidTournament"
import { buildTraditionalDraw, type TraditionalFormat, type TraditionalPlan } from "@/lib/traditionalTournament"
import { buildTraditionalSchedule, type TraditionalScheduleEntry } from "@/lib/traditionalTournamentSchedule"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const isMissingAccountLinkSchema = (error: { code?: string; message?: string } | null) => Boolean(error && (error.code === "42703" || error.code === "PGRST204") && /user_id/i.test(error.message ?? ""))
const isMissingFlexibleCreateRpc = (error: { code?: string; message?: string } | null) => Boolean(error && (error.code === "PGRST202" || error.code === "42883") && /create_rapid_tournament_flexible/i.test(error.message ?? ""))
type CreateTournamentBody = { name?: unknown; description?: unknown; startsAt?: unknown; courtNames?: unknown; players?: unknown; playerUserIds?: unknown; playerCount?: unknown; reservationMinutes?: unknown; preparationMinutes?: unknown; roundCount?: unknown; roundMinutes?: unknown; transitionMinutes?: unknown; breakMinutes?: unknown; breakEveryRounds?: unknown; logoUrl?: unknown; accentColor?: unknown; format?: unknown; pairing?: unknown; pairNumbers?: unknown; duplicateOf?: unknown; traditional?: {groupCount?:number;qualifiersPerGroup?:number;thirdPlace?:boolean;consolation?:boolean;seededTeamIds?:string[];manualOrder?:string[];manualGroups?:string[][];scheduleMode?:"automatic"|"manual"}; source?: { leagueId?: unknown; seasonId?: unknown; playerIds?: unknown } | null }
const numericOption = (value: unknown, fallback: number) => value === undefined ? fallback : typeof value === "number" ? value : NaN
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
  const playerCount = numericOption(body?.playerCount, Array.isArray(body?.players) ? body.players.length : 0)
  const reservationMinutes = numericOption(body?.reservationMinutes, 120)
  const roundMinutes = numericOption(body?.roundMinutes, 16), transitionMinutes = numericOption(body?.transitionMinutes, 3)
  const traditionalFormat = body?.format === "knockout" || body?.format === "groups" || body?.format === "groups_knockout" ? body.format : null
  const preparationMinutes = traditionalFormat ? 0 : numericOption(body?.preparationMinutes, 2)
  const breakMinutes = numericOption(body?.breakMinutes,0), breakEveryRounds = numericOption(body?.breakEveryRounds,0)
  const roundCount = numericOption(body?.roundCount, breakMinutes > 0 ? getRecommendedRapidRounds(reservationMinutes,roundMinutes,transitionMinutes,preparationMinutes,{breakMinutes,breakEveryRounds}) : getRapidRoundCount(reservationMinutes))
  const format = traditionalFormat ?? (body?.format === "dynamic_mexicano" ? "dynamic_mexicano" : body?.format === undefined || body.format === "balanced_americana" ? "balanced_americana" : null)
  const pairing = body?.pairing === "fixed" ? "fixed" : body?.pairing === undefined || body.pairing === "rotating" ? "rotating" : null
  const extended = Boolean(traditionalFormat) || pairing === "fixed" || body?.breakMinutes !== undefined || body?.breakEveryRounds !== undefined || body?.roundCount !== undefined || body?.roundMinutes !== undefined || body?.transitionMinutes !== undefined || body?.logoUrl !== undefined || body?.accentColor !== undefined || playerCount < 8 || playerCount > 16
  const configuration = { players: playerCount, courts: Array.isArray(body?.courtNames) ? body.courtNames.length : 0, reservationMinutes, rounds: roundCount, roundMinutes, transitionMinutes, preparationMinutes, breakMinutes, breakEveryRounds }
  const configurationValidation = traditionalFormat ? {ok:true as const} : extended ? planRapidTournament({ ...configuration, pairing: pairing ?? "rotating" }) : validateRapidTournamentConfiguration(playerCount, configuration.courts, reservationMinutes)
  const logoUrl = typeof body?.logoUrl === "string" ? normalizeStoredImageUrl(body.logoUrl) : null
  const accentColor = typeof body?.accentColor === "string" && /^#[0-9a-f]{6}$/i.test(body.accentColor) ? body.accentColor : null
  const courtNames = Array.isArray(body?.courtNames) ? body.courtNames.map((item) => normalizeBoundedText(item, 80)) : []
  const participants = validateTournamentParticipants(body?.players, playerCount)
  const playerUserIds = Array.isArray(body?.playerUserIds) ? body.playerUserIds : Array(Number.isInteger(playerCount) && playerCount >= 4 && playerCount <= 24 ? playerCount : 0).fill(null)
  if (!body || !name || !startsAt || !format || !pairing || (extended && Date.parse(startsAt) <= Date.now()) || !configurationValidation.ok || configuration.courts > 4 || reservationMinutes < 30 || reservationMinutes > 1440 || roundMinutes > 120 || transitionMinutes > 30 || courtNames.some((court) => !court) || !participants.ok || playerUserIds.length !== playerCount || playerUserIds.some((id) => id !== null && !validateUuid(id)) || !Number.isSafeInteger(preparationMinutes) || preparationMinutes < 0 || (!extended && preparationMinutes > getRapidPreparationMax(reservationMinutes)) || (body.logoUrl != null && !logoUrl) || (body.accentColor != null && !accentColor)) {
    return NextResponse.json({ error: !participants.ok ? participants.error : !configurationValidation.ok ? configurationValidation.error : "invalid_tournament_details" }, { status: 400 })
  }
  const pairNumbers: number[] = Array.isArray(body.pairNumbers) ? body.pairNumbers : []
  if (traditionalFormat && (pairing !== "fixed" || courtNames.length<1 || !Number.isSafeInteger(roundMinutes) || roundMinutes < 1 || !Number.isSafeInteger(transitionMinutes) || transitionMinutes < 0)) return NextResponse.json({error:"invalid_traditional_configuration"},{status:400})
  if (pairing === "fixed") {
    try { if (pairNumbers.length !== playerCount) throw new Error("invalid_fixed_teams"); fixedTeamsFromPlayers(pairNumbers.map((pairNumber,index) => ({ id: RAPID_TOURNAMENT_SLOTS[index], pairNumber }))) }
    catch { return NextResponse.json({ error: "invalid_fixed_teams" }, { status: 400 }) }
  }
  const accountIds = playerUserIds.map((id) => typeof id === "string" ? validateUuid(id) : null), linkedIds = accountIds.filter((id): id is string => Boolean(id))
  if (new Set(linkedIds).size !== linkedIds.length) return NextResponse.json({ error: "duplicate_player_accounts" }, { status: 400 })
  const copyPeople: Array<{ userId: string; displayName: string }> = []
  if (body.duplicateOf !== undefined) {
    if (body.source) return NextResponse.json({ error: "invalid_tournament_source" }, { status: 400 })
    const copied = await requireRapidTournamentCreator(body.duplicateOf)
    if (!copied.ok) return NextResponse.json({ error: copied.error }, { status: copied.status })
    if (extended && linkedIds.length) {
      const roster = await auth.actor.supabase.from("rapid_tournament_players").select("user_id,full_name").eq("tournament_id", copied.tournamentId)
      if (roster.error) return NextResponse.json({ error: "tournament_read_failed" }, { status: 500 })
      for (const player of roster.data ?? []) if (player.user_id) copyPeople.push({ userId: player.user_id, displayName: player.full_name })
    }
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
  const accountOffset = sourceLeagueId ? sourcePlayerIds.length : 0
  const additionalLinkedIds = accountIds.slice(accountOffset).filter((id): id is string => Boolean(id))
  if (additionalLinkedIds.length) {
    const available = await getRapidTournamentSelectablePeople(auth.actor.supabase, auth.actor.user.id)
    if (available.error || !available.people) return NextResponse.json({ error: "tournament_people_lookup_failed" }, { status: 500 })
    const peopleById = new Map([...copyPeople, ...available.people].map((person) => [person.userId, person.displayName]))
    if (additionalLinkedIds.some((id) => !peopleById.has(id))) return NextResponse.json({ error: "invalid_tournament_player_account" }, { status: 400 })
    canonicalNames = canonicalNames.map((personName, index) => index >= accountOffset && accountIds[index] ? peopleById.get(accountIds[index]!)! : personName)
    const canonicalValidation = validateTournamentParticipants(canonicalNames, playerCount)
    if (!canonicalValidation.ok) return NextResponse.json({ error: canonicalValidation.error }, { status: 400 })
    canonicalNames = canonicalValidation.names
  }
  const entries = canonicalNames.map((playerName, index) => ({ name: playerName, userId: accountIds[index], pairNumber: pairNumbers[index] }))
  let traditionalPlan: TraditionalPlan | null = null, traditionalSchedule: TraditionalScheduleEntry[] = []
  if (traditionalFormat) {
    const settings = body.traditional
    if (!settings || typeof settings !== "object" || Array.isArray(settings) || settings.scheduleMode !== undefined && settings.scheduleMode !== "automatic" && settings.scheduleMode !== "manual") return NextResponse.json({error:"invalid_traditional_configuration"},{status:400})
    try {
      traditionalPlan = buildTraditionalDraw({ teams:fixedTeamsFromPlayers(entries.map((entry,index)=>({id:RAPID_TOURNAMENT_SLOTS[index],pairNumber:entry.pairNumber}))),
        configuration:{format:traditionalFormat as TraditionalFormat,groupCount:settings.groupCount ?? (traditionalFormat==="knockout"?0:2),qualifiersPerGroup:settings.qualifiersPerGroup ?? (traditionalFormat==="groups_knockout"?1:0),thirdPlace:settings.thirdPlace ?? false,consolation:settings.consolation ?? false},
        seed:randomInt(1,2147483647),seededTeamIds:settings.seededTeamIds,manualOrder:settings.manualOrder,manualGroups:settings.manualGroups })
      if (settings.scheduleMode!=="manual") traditionalSchedule=buildTraditionalSchedule(traditionalPlan,{startsAt,courts:courtNames.length,matchMinutes:roundMinutes,transitionMinutes})
    } catch { return NextResponse.json({error:"invalid_traditional_configuration_or_draw"},{status:400}) }
  }
  const shuffled = format === "balanced_americana" && pairing === "rotating" ? shuffleTournamentEntries(entries) : entries
  const plan = traditionalPlan ? {ok:true as const} : planRapidTournament({ ...configuration, pairing })
  if (!plan.ok) return NextResponse.json({ error: plan.error }, { status: 400 })
  const rounds = traditionalPlan ? [] : buildRapidRounds(new Date(Date.parse(startsAt) + preparationMinutes * 60_000), configuration)
  const seed = randomInt(1,2_147_483_647)
  const fixtures = format !== "balanced_americana" ? [] : pairing === "fixed"
    ? generateFixedAmericanaFixtures(fixedTeamsFromPlayers(entries.map((entry,index) => ({ id: RAPID_TOURNAMENT_SLOTS[index], pairNumber: entry.pairNumber }))), courtNames.length, roundCount, seed).map(match => ({ round: match.round, court: match.court, teamA: match.teamAIds, teamB: match.teamBIds }))
    : generateBalancedAmericanaFixtures(playerCount, courtNames.length, roundCount)
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
  const result = traditionalPlan ? await auth.actor.supabase.rpc("create_traditional_tournament",{
    p_creator_user_id:auth.actor.user.id,p_name:name,p_description:description,p_starts_at:startsAt,p_court_names:courtNames,
    p_player_names:canonicalNames,p_player_user_ids:accountIds,p_player_pair_numbers:pairNumbers,p_draw:traditionalPlan,p_schedule:traditionalSchedule,
    p_match_minutes:roundMinutes,p_transition_minutes:transitionMinutes,p_duplicate_of:validateUuid(body.duplicateOf),p_source_league_id:sourceLeagueId,p_source_season_id:sourceSeasonId,p_logo_url:logoUrl,p_accent_color:accentColor,
  }) : extended ? await auth.actor.supabase.rpc(breakMinutes > 0 ? "create_planned_rapid_tournament" : pairing === "fixed" ? "create_fixed_rapid_tournament" : "create_configurable_rapid_tournament", {
    p_creator_user_id: auth.actor.user.id, p_name: name, p_description: description, p_starts_at: startsAt,
    p_court_names: courtNames, p_player_names: shuffled.map(entry => entry.name), p_player_user_ids: shuffled.map(entry => entry.userId),
    p_configuration: { ...configuration, format, pairing, generationSeed: seed },
    ...(pairing === "fixed" || breakMinutes > 0 ? { p_player_pair_numbers: pairing === "fixed" ? entries.map(entry => entry.pairNumber) : null } : {}),
    p_matches: fixtures.map(match => ({ round_number: match.round, court_number: match.court, team_a: match.teamA, team_b: match.teamB })),
    p_duplicate_of: validateUuid(body.duplicateOf), p_source_league_id: sourceLeagueId, p_source_season_id: sourceSeasonId,
    p_logo_url: logoUrl, p_accent_color: accentColor,
  }) : format === "dynamic_mexicano"
    ? await auth.actor.supabase.rpc("create_dynamic_mexicano_tournament", { ...commonParameters, p_generation_seed: randomInt(1, 2_147_483_647) })
    : await auth.actor.supabase.rpc("create_rapid_tournament_flexible", { ...commonParameters, p_matches: fixtures.map((match) => ({ round_number: match.round, court_number: match.court, team_a: match.teamA, team_b: match.teamB })) })
  const { data, error } = result
  if (isMissingFlexibleCreateRpc(error) || error && (extended || format === "dynamic_mexicano") && ["PGRST202", "42883", "42703"].includes(error.code ?? "")) {
    return NextResponse.json({ error: "tournament_account_access_not_ready" }, { status: 503 })
  }
  if (error || typeof data !== "string") {
    console.error("[rapidTournaments] create failed", { code: error?.code ?? null })
    return NextResponse.json({ error: "tournament_create_failed" }, { status: 500 })
  }
  if (!extended && sourceLeagueId && sourceSeasonId) {
    const { error: sourceLinkError } = await auth.actor.supabase.from("rapid_tournaments").update({ source_league_id: sourceLeagueId, source_season_id: sourceSeasonId }).eq("id", data).eq("created_by_user_id", auth.actor.user.id)
    if (sourceLinkError) {
      await auth.actor.supabase.from("rapid_tournaments").delete().eq("id", data).eq("created_by_user_id", auth.actor.user.id)
      console.error("[rapidTournaments] source link failed", { code: sourceLinkError.code ?? null })
      return NextResponse.json({ error: "tournament_source_link_failed" }, { status: 500 })
    }
  }
  return NextResponse.json({ id: data }, { status: 201, headers: { "Cache-Control": "no-store" } })
}
