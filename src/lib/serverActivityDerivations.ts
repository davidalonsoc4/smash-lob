import "server-only"

import { getRoundMvpSelection, type MvpMatch } from "@/lib/mvp"
import { getMatchResultConfirmationState, normalizeResultConfirmationMode } from "@/lib/resultConfirmations"
import type { MatchResultConfirmation } from "@/lib/supabaseMatchConfirmations"
import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"

type SupabaseClient = ServerLeagueActor["supabase"]

type SeasonMatchRow = {
  id: string
  league_id: string
  season_id: string
  round: number
  status: string
  team_a: string[] | null
  team_b: string[] | null
  points_a: number | null
  points_b: number | null
  sets: { a: number; b: number }[] | null
  result_reported_by_player_id: string | null
  result_recorded_at: string | null
  result_locked: boolean | null
  ranking_counts: boolean | null
}

export type ServerSeasonActivityMatch = Omit<MvpMatch, "id"> & {
  id: string
  reporterPlayerId: string | null
  resultRecordedAt: string | null
  resultLocked: boolean
}

function toPlayerIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((playerId): playerId is string => typeof playerId === "string")
    : []
}

function mapSeasonMatch(row: SeasonMatchRow): ServerSeasonActivityMatch {
  return {
    id: row.id,
    leagueId: row.league_id,
    seasonId: row.season_id,
    round: row.round,
    status:
      row.status === "finished" ||
      row.status === "scheduled" ||
      row.status === "postponed"
        ? row.status
        : "scheduling",
    teamA: toPlayerIds(row.team_a),
    teamB: toPlayerIds(row.team_b),
    pointsA: row.points_a,
    pointsB: row.points_b,
    sets: Array.isArray(row.sets) ? row.sets : [],
    resultCounts: row.ranking_counts !== false,
    reporterPlayerId: row.result_reported_by_player_id,
    resultRecordedAt: row.result_recorded_at,
    resultLocked: Boolean(row.result_locked),
  }
}

export async function fetchServerSeasonActivityMatches({
  supabase,
  leagueId,
  seasonId,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
}) {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id,league_id,season_id,round,status,team_a,team_b,points_a,points_b,sets,result_reported_by_player_id,result_recorded_at,result_locked,ranking_counts"
    )
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)

  if (error) {
    throw error
  }

  return ((data ?? []) as SeasonMatchRow[]).map(mapSeasonMatch)
}

export async function fetchServerSeasonResultConfirmations({
  supabase,
  matchIds,
}: {
  supabase: SupabaseClient
  matchIds: string[]
}) {
  if (matchIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from("match_result_confirmations")
    .select("match_id,player_id,status,updated_at")
    .in("match_id", matchIds)

  if (error) {
    throw error
  }

  return (data ?? [])
    .filter(
      (row) =>
        typeof row.match_id === "string" &&
        typeof row.player_id === "string" &&
        (row.status === "confirmed" || row.status === "disputed") &&
        typeof row.updated_at === "string"
    )
    .map(
      (row) =>
        ({
          matchId: row.match_id,
          playerId: row.player_id,
          status: row.status,
          updatedAt: row.updated_at,
        }) satisfies MatchResultConfirmation
    )
}

export function applyServerResultCountState({
  matches,
  confirmations,
  resultConfirmationMode,
}: {
  matches: ServerSeasonActivityMatch[]
  confirmations: MatchResultConfirmation[]
  resultConfirmationMode: string | null | undefined
}) {
  const normalizedMode = normalizeResultConfirmationMode(resultConfirmationMode)

  return matches.map((match) => ({
    ...match,
    resultCounts:
      match.resultCounts !== false &&
      getMatchResultConfirmationState({
        matchId: match.id,
        participantIds: [...match.teamA, ...match.teamB],
        reporterPlayerId: match.reporterPlayerId,
        resultRecordedAt: match.resultRecordedAt,
        resultLocked: match.resultLocked,
        confirmations,
        mode: normalizedMode,
      }).countsForRanking,
  }))
}

export function getServerAutomaticRoundMvp({
  matches,
  leagueId,
  seasonId,
  round,
}: {
  matches: ServerSeasonActivityMatch[]
  leagueId: string
  seasonId: string
  round: number
}) {
  return getRoundMvpSelection({
    leagueId,
    seasonId,
    round,
    matches,
    mvpSystem: "automatic",
  })
}
