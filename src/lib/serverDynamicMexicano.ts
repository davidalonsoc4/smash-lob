import "server-only"
import { generateDynamicMexicanoRound, type MexicanoMatch } from "@/lib/dynamicMexicano"
import type { AuthenticatedAppUser } from "@/lib/serverAuth"
import { fixedTeamsFromPlayers, generateFixedRapidRound } from "@/lib/fixedRapidTournament"

export async function generateAndPersistMexicanoRound(actor: AuthenticatedAppUser, tournamentId: string, creatorUserId: string) {
  const [tournamentResult, playersResult, matchesResult] = await Promise.all([
    actor.supabase.from("rapid_tournaments").select("*").eq("id", tournamentId).single(),
    actor.supabase.from("rapid_tournament_players").select("*").eq("tournament_id", tournamentId).order("slot"),
    actor.supabase.from("rapid_tournament_matches").select("round_number,court_number,team_a_one_id,team_a_two_id,team_b_one_id,team_b_two_id,score_a,score_b").eq("tournament_id", tournamentId).order("round_number").order("court_number"),
  ])
  if (tournamentResult.error || playersResult.error || matchesResult.error || !tournamentResult.data) return { ok: false as const, status: 500, error: "tournament_read_failed" }
  const tournament = tournamentResult.data
  if (tournament.format !== "dynamic_mexicano" || tournament.status === "finished") return { ok: false as const, status: 409, error: "dynamic_round_locked" }
  const history: MexicanoMatch[] = (matchesResult.data ?? []).map((match) => ({
    round: match.round_number, court: match.court_number,
    teamAIds: [match.team_a_one_id, match.team_a_two_id], teamBIds: [match.team_b_one_id, match.team_b_two_id],
    scoreA: match.score_a, scoreB: match.score_b,
  }))
  const generatedRound = history.reduce((maximum, match) => Math.max(maximum, match.round), 0), nextRound = generatedRound + 1
  if (nextRound > tournament.round_count) return { ok: false as const, status: 409, error: "dynamic_tournament_complete" }
  if (generatedRound > 0 && history.some((match) => match.round === generatedRound && (match.scoreA === null || match.scoreB === null))) return { ok: false as const, status: 409, error: "previous_round_incomplete" }
  if (nextRound === 1 && tournament.status !== "draft" || nextRound > 1 && tournament.status !== "in_progress") return { ok: false as const, status: 409, error: "dynamic_round_locked" }
  let generated
  try { generated = tournament.pairing === "fixed" ? generateFixedRapidRound({
    teams: fixedTeamsFromPlayers((playersResult.data ?? []).map(player => ({ id: player.id, pairNumber: player.pair_number }))),
    history, courts: tournament.court_count, round: nextRound, seed: tournament.generation_seed, format: "dynamic_mexicano",
  }) : generateDynamicMexicanoRound({
    players: (playersResult.data ?? []).map((player) => ({ id: player.id, name: player.full_name })), history,
    courts: tournament.court_count, round: nextRound, seed: tournament.generation_seed,
  }) } catch { return { ok: false as const, status: 409, error: "invalid_tournament_schedule" } }
  const { data, error } = await actor.supabase.rpc("generate_dynamic_mexicano_round", {
    p_tournament_id: tournamentId, p_creator_user_id: creatorUserId, p_round_number: nextRound,
    p_matches: generated.matches.map((match) => ({ court_number: match.court, team_a: match.teamAIds, team_b: match.teamBIds })),
  })
  if (error) return { ok: false as const, status: 500, error: "dynamic_round_generation_failed" }
  if (data !== true) return { ok: false as const, status: 409, error: "dynamic_round_locked" }
  return { ok: true as const, round: nextRound }
}
