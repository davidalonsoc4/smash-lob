import "server-only"

import { requireAuthenticatedAppUser, type AuthenticatedAppUser } from "@/lib/serverAuth"
import { validateUuid } from "@/lib/serverRequest"
import { getEffectiveRapidRounds } from "@/lib/rapidTournamentTiming"

export async function requireRapidTournamentCreator(tournamentId: unknown) {
  const id = validateUuid(tournamentId)
  if (!id) return { ok: false as const, status: 404, error: "tournament_not_found" }
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return auth
  const { data, error } = await auth.actor.supabase
    .from("rapid_tournaments")
    .select("id")
    .eq("id", id)
    .eq("created_by_user_id", auth.actor.user.id)
    .maybeSingle()
  if (error) return { ok: false as const, status: 500, error: "tournament_lookup_failed" }
  if (!data) return { ok: false as const, status: 404, error: "tournament_not_found" }
  return { ok: true as const, actor: auth.actor, tournamentId: id }
}

export function mapTournamentData(
  actor: AuthenticatedAppUser,
  tournamentId: string,
) {
  return Promise.all([
    actor.supabase.from("rapid_tournaments").select("*").eq("id", tournamentId).eq("created_by_user_id", actor.user.id).single(),
    actor.supabase.from("rapid_tournament_players").select("id,slot,full_name").eq("tournament_id", tournamentId).order("slot"),
    actor.supabase.from("rapid_tournament_rounds").select("id,round_number,starts_at,ends_at").eq("tournament_id", tournamentId).order("round_number"),
    actor.supabase.from("rapid_tournament_matches").select("id,round_id,round_number,court_number,court_name,team_a_one_id,team_a_two_id,team_b_one_id,team_b_two_id,score_a,score_b").eq("tournament_id", tournamentId).order("round_number").order("court_number"),
  ]).then(([tournamentResult, playersResult, roundsResult, matchesResult]) => {
    if (tournamentResult.error || playersResult.error || roundsResult.error || matchesResult.error || !tournamentResult.data) {
      return { data: null, error: "tournament_read_failed" as const }
    }
    const playerById = new Map((playersResult.data ?? []).map((player) => [player.id, player]))
    return {
      error: null,
      data: {
        tournament: {
          id: tournamentResult.data.id,
          name: tournamentResult.data.name,
          description: tournamentResult.data.description,
          startsAt: tournamentResult.data.starts_at,
          courtNames: [tournamentResult.data.court_one_name, tournamentResult.data.court_two_name],
          status: tournamentResult.data.status,
          createdByUserId: tournamentResult.data.created_by_user_id,
          createdAt: tournamentResult.data.created_at,
          startedAt: tournamentResult.data.started_at,
          finishedAt: tournamentResult.data.finished_at,
          configuration: {
            format: tournamentResult.data.format,
            players: tournamentResult.data.player_count,
            courts: tournamentResult.data.court_count,
            reservationMinutes: tournamentResult.data.reservation_minutes,
            rounds: tournamentResult.data.round_count,
            roundMinutes: tournamentResult.data.round_minutes,
            transitionMinutes: tournamentResult.data.transition_minutes,
            preparationMinutes: 2,
            safetyMarginMinutes: tournamentResult.data.safety_margin_minutes - 2,
            scoringMode: tournamentResult.data.scoring_mode,
            rankingMode: tournamentResult.data.ranking_mode,
          },
        },
        players: (playersResult.data ?? []).map((player) => ({ id: player.id, slot: player.slot, name: player.full_name })),
        rounds: getEffectiveRapidRounds((roundsResult.data ?? []).map((round) => ({ id: round.id, round: round.round_number, startsAt: round.starts_at, endsAt: round.ends_at })), tournamentResult.data.started_at ?? tournamentResult.data.starts_at),
        matches: (matchesResult.data ?? []).map((match) => ({
          id: match.id, round: match.round_number, court: match.court_number, courtName: match.court_name,
          teamA: [playerById.get(match.team_a_one_id)?.full_name ?? "", playerById.get(match.team_a_two_id)?.full_name ?? ""],
          teamB: [playerById.get(match.team_b_one_id)?.full_name ?? "", playerById.get(match.team_b_two_id)?.full_name ?? ""],
          teamAIds: [match.team_a_one_id, match.team_a_two_id], teamBIds: [match.team_b_one_id, match.team_b_two_id],
          scoreA: match.score_a, scoreB: match.score_b,
        })),
      },
    }
  })
}
