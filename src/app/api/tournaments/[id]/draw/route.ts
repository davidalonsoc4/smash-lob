import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { generateBalancedAmericanaFixtures, shuffleTournamentEntries, validateTournamentParticipants } from "@/lib/rapidTournament"
import { requireRapidTournamentCreator } from "@/lib/serverRapidTournaments"
import { randomInt } from "node:crypto"
import { fixedTeamsFromPlayers, generateFixedAmericanaFixtures } from "@/lib/fixedRapidTournament"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_draw", limit: 30, windowMs: 60_000 })
  if (limited) return limited
  const { id } = await params
  const access = await requireRapidTournamentCreator(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const { data: tournament, error: tournamentError } = await access.actor.supabase.from("rapid_tournaments").select("*").eq("id", access.tournamentId).maybeSingle()
  if (tournamentError || !tournament) return NextResponse.json({ error: "tournament_read_failed" }, { status: 500 })
  if (tournament.status !== "draft" || tournament.format !== "balanced_americana") return NextResponse.json({ error: "tournament_draw_locked" }, { status: 409 })
  const { data: players, error: playersError } = await access.actor.supabase.from("rapid_tournament_players").select("*").eq("tournament_id", access.tournamentId).order("slot")
  const validated = validateTournamentParticipants(players?.map((player) => player.full_name), tournament.player_count)
  if (playersError || !validated.ok) return NextResponse.json({ error: "tournament_players_read_failed" }, { status: 500 })
  if (tournament.pairing === "fixed") {
    let fixtures
    try { fixtures = generateFixedAmericanaFixtures(fixedTeamsFromPlayers(players!.map(player => ({ id: player.id, pairNumber: player.pair_number }))), tournament.court_count, tournament.round_count, randomInt(1,2_147_483_647)) }
    catch { return NextResponse.json({ error: "invalid_tournament_schedule" }, { status: 409 }) }
    const { data, error } = await access.actor.supabase.rpc("redraw_configurable_rapid_tournament", {
      p_tournament_id: access.tournamentId, p_creator_user_id: access.actor.user.id,
      p_matches: fixtures.map(match => ({ round_number: match.round, court_number: match.court, team_a: match.teamAIds, team_b: match.teamBIds })),
    })
    if (error) return NextResponse.json({ error: "tournament_draw_failed" }, { status: 500 })
    return NextResponse.json(data === true ? { ok: true } : { error: "tournament_draw_locked" }, { status: data === true ? 200 : 409, headers: { "Cache-Control": "no-store" } })
  }
  const shuffled = shuffleTournamentEntries(validated.names.map((name, index) => ({ name, userId: (players![index].user_id as string | null | undefined) ?? null })))
  const fixtures = generateBalancedAmericanaFixtures(tournament.player_count, tournament.court_count, tournament.round_count)
  if (tournament.configuration_version === 2) {
    const identities = shuffleTournamentEntries(players!.map(player => player.id as string))
    const { data, error } = await access.actor.supabase.rpc("redraw_configurable_rapid_tournament", {
      p_tournament_id: access.tournamentId, p_creator_user_id: access.actor.user.id,
      p_matches: fixtures.map(match => ({ round_number: match.round, court_number: match.court,
        team_a: match.teamA.map(slot => identities[slot.charCodeAt(0) - 65]), team_b: match.teamB.map(slot => identities[slot.charCodeAt(0) - 65]) })),
    })
    if (error) return NextResponse.json({ error: "tournament_draw_failed" }, { status: 500 })
    return NextResponse.json(data === true ? { ok: true } : { error: "tournament_draw_locked" }, { status: data === true ? 200 : 409, headers: { "Cache-Control": "no-store" } })
  }
  const { data, error } = await access.actor.supabase.rpc("reroll_rapid_tournament_flexible", {
    p_tournament_id: access.tournamentId,
    p_creator_user_id: access.actor.user.id,
    p_player_names: shuffled.map((player) => player.name),
    p_player_user_ids: shuffled.map((player) => player.userId),
    p_matches: fixtures.map((match) => ({ round_number: match.round, court_number: match.court, team_a: match.teamA, team_b: match.teamB })),
  })
  if (error) return NextResponse.json({ error: "tournament_draw_failed" }, { status: 500 })
  if (data !== true) return NextResponse.json({ error: "tournament_draw_locked" }, { status: 409 })
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
