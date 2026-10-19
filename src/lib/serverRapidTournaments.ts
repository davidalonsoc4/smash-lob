import "server-only"
import { requireAuthenticatedAppUser, type AuthenticatedAppUser } from "@/lib/serverAuth"
import { validateUuid } from "@/lib/serverRequest"
import { getEffectiveRapidRounds } from "@/lib/rapidTournamentTiming"
const isMissingPlayerAccountColumn = (error: { code?: string; message?: string } | null) => Boolean(error && (error.code === "42703" || error.code === "PGRST204") && /user_id/i.test(error.message ?? ""))
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
export async function requireRapidTournamentAccess(tournamentId: unknown) {
  const id = validateUuid(tournamentId)
  if (!id) return { ok: false as const, status: 404, error: "tournament_not_found" }
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return auth
  const { data, error } = await auth.actor.supabase.from("rapid_tournaments")
    .select("id,created_by_user_id").eq("id", id).maybeSingle()
  if (error) return { ok: false as const, status: 500, error: "tournament_lookup_failed" }
  if (!data) return { ok: false as const, status: 404, error: "tournament_not_found" }
  if (data.created_by_user_id === auth.actor.user.id) return { ok: true as const, actor: auth.actor, tournamentId: id, role: "creator" as const }
  const participant = await auth.actor.supabase.from("rapid_tournament_players").select("id")
    .eq("tournament_id", id).eq("user_id", auth.actor.user.id).maybeSingle()
  if (participant.error && isMissingPlayerAccountColumn(participant.error)) return { ok: false as const, status: 404, error: "tournament_not_found" }
  if (participant.error) return { ok: false as const, status: 500, error: "tournament_lookup_failed" }
  if (!participant.data) return { ok: false as const, status: 404, error: "tournament_not_found" }
  return { ok: true as const, actor: auth.actor, tournamentId: id, role: "participant" as const }
}
export function mapTournamentData(
  actor: AuthenticatedAppUser,
  tournamentId: string,
  canManage = true,
) {
  return Promise.all([
    actor.supabase.from("rapid_tournaments").select("*").eq("id", tournamentId).single(),
    actor.supabase.from("rapid_tournament_players").select("id,slot,full_name,user_id").eq("tournament_id", tournamentId).order("slot"),
    actor.supabase.from("rapid_tournament_rounds").select("id,round_number,starts_at,ends_at").eq("tournament_id", tournamentId).order("round_number"),
    actor.supabase.from("rapid_tournament_matches").select("id,round_id,round_number,court_number,court_name,team_a_one_id,team_a_two_id,team_b_one_id,team_b_two_id,score_a,score_b").eq("tournament_id", tournamentId).order("round_number").order("court_number"),
  ]).then(async ([tournamentResult, initialPlayersResult, roundsResult, matchesResult]) => {
    const playersResult = initialPlayersResult.error && isMissingPlayerAccountColumn(initialPlayersResult.error) ? await actor.supabase.from("rapid_tournament_players").select("id,slot,full_name").eq("tournament_id", tournamentId).order("slot") : initialPlayersResult
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
          courtNames: [tournamentResult.data.court_one_name, tournamentResult.data.court_two_name, tournamentResult.data.court_three_name, tournamentResult.data.court_four_name].slice(0, tournamentResult.data.court_count),
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
            preparationMinutes: tournamentResult.data.preparation_minutes ?? 2,
            safetyMarginMinutes: tournamentResult.data.safety_margin_minutes - (tournamentResult.data.preparation_minutes ?? 2),
            scoringMode: tournamentResult.data.scoring_mode,
            rankingMode: tournamentResult.data.ranking_mode,
          },
        },
        players: (playersResult.data ?? []).map((player) => {
          const userId = "user_id" in player ? player.user_id : null
          return { id: player.id, slot: player.slot, name: player.full_name, ...(canManage ? { userId } : { hasAccount: Boolean(userId) }) }
        }),
        rounds: getEffectiveRapidRounds((roundsResult.data ?? []).map((round) => ({ id: round.id, round: round.round_number, startsAt: round.starts_at, endsAt: round.ends_at })), tournamentResult.data.started_at ?? tournamentResult.data.starts_at, {
          rounds: tournamentResult.data.round_count, roundMinutes: tournamentResult.data.round_minutes,
          transitionMinutes: tournamentResult.data.transition_minutes, preparationMinutes: tournamentResult.data.preparation_minutes ?? 2,
        }),
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
