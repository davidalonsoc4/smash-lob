import "server-only"

import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"
import { calculateSeasonRanking } from "@/lib/ranking"
import { getSeasonMvpSelection, type MvpSystem, type MvpVote } from "@/lib/mvp"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import type { PlayerProfile, SeasonPlayer } from "@/data/fakeData"

type SupabaseClient = ServerLeagueActor["supabase"]

type SeasonAwards = {
  winnerPlayerIds: string[]
  winnerNames: string[]
  mvpPlayerIds: string[]
  mvpNames: string[]
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

export async function getServerSeasonAwards({
  supabase,
  leagueId,
  seasonId,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
}): Promise<SeasonAwards> {
  const [
    seasonPlayersResult,
    matchesResult,
    settingsResult,
    votesResult,
    manualMvpResult,
  ] = await Promise.all([
    supabase
      .from("season_players")
      .select(
        "season_id,player_id,status,joined_from_round,replaces_player_id,replaced_from_round,replaced_by_player_id",
      )
      .eq("season_id", seasonId),
    supabase
      .from("matches")
      .select(matchSelect)
      .eq("league_id", leagueId)
      .eq("season_id", seasonId),
    supabase
      .from("season_settings")
      .select("mvp_system")
      .eq("league_id", leagueId)
      .eq("season_id", seasonId)
      .maybeSingle(),
    supabase
      .from("mvp_votes")
      .select(
        "league_id,season_id,match_id,round,voter_player_id,selected_player_id,created_at",
      )
      .eq("league_id", leagueId)
      .eq("season_id", seasonId),
    supabase
      .from("mvp_manual_selections")
      .select("selected_player_id")
      .eq("league_id", leagueId)
      .eq("season_id", seasonId)
      .eq("scope", "season")
      .is("round", null)
      .maybeSingle(),
  ])

  if (
    seasonPlayersResult.error ||
    matchesResult.error ||
    settingsResult.error ||
    votesResult.error ||
    manualMvpResult.error
  ) {
    throw new Error("season_awards_lookup_failed")
  }

  const seasonPlayers: SeasonPlayer[] = (seasonPlayersResult.data ?? []).map(
    (row: Record<string, unknown>) => ({
      seasonId: String(row.season_id),
      playerId: String(row.player_id),
      status: row.status === "withdrawn" ? "withdrawn" : "active",
      joinedFromRound:
        typeof row.joined_from_round === "number"
          ? row.joined_from_round
          : null,
      replacesPlayerId:
        typeof row.replaces_player_id === "string"
          ? row.replaces_player_id
          : null,
      replacedFromRound:
        typeof row.replaced_from_round === "number"
          ? row.replaced_from_round
          : null,
      replacedByPlayerId:
        typeof row.replaced_by_player_id === "string"
          ? row.replaced_by_player_id
          : null,
    }),
  )
  const playerIds = Array.from(
    new Set(seasonPlayers.map((item) => item.playerId).filter(Boolean)),
  )

  if (playerIds.length === 0) {
    return {
      winnerPlayerIds: [],
      winnerNames: [],
      mvpPlayerIds: [],
      mvpNames: [],
    }
  }

  const { data: playerRows, error: playersError } = await supabase
    .from("players")
    .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
    .eq("league_id", leagueId)
    .in("id", playerIds)

  if (playersError) {
    throw new Error("season_awards_players_lookup_failed")
  }

  const playerProfiles: PlayerProfile[] = (playerRows ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    leagueId: String(row.league_id),
    slug: String(row.slug),
    displayName: String(row.display_name),
    avatarInitials: String(row.avatar_initials),
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
  }))
  const matches = (matchesResult.data ?? []).map((row: Record<string, unknown>) =>
    mapSupabaseMatch(row as Record<string, unknown>),
  )
  const ranking = calculateSeasonRanking({
    seasonId,
    playerProfiles,
    seasonPlayers,
    matches,
  })
  const leader = ranking[0]
  const winnerPlayerIds = leader
    ? ranking
        .filter(
          (player) =>
            player.points === leader.points &&
            player.gamesDiff === leader.gamesDiff &&
            player.gamesFor === leader.gamesFor,
        )
        .map((player) => player.id)
    : []
  const mvpSystem =
    settingsResult.data?.mvp_system === "none" ||
    settingsResult.data?.mvp_system === "voting"
      ? (settingsResult.data.mvp_system as MvpSystem)
      : "automatic"
  const votes: MvpVote[] = (votesResult.data ?? []).map((row: Record<string, unknown>) => ({
    leagueId: String(row.league_id),
    seasonId: String(row.season_id),
    matchId: typeof row.match_id === "string" ? row.match_id : null,
    round: Number(row.round),
    voterPlayerId: String(row.voter_player_id),
    selectedPlayerId: String(row.selected_player_id),
    createdAt: String(row.created_at),
  }))
  const manualMvpPlayerId =
    mvpSystem !== "none" &&
    typeof manualMvpResult.data?.selected_player_id === "string"
      ? manualMvpResult.data.selected_player_id
      : null
  const calculatedMvp = manualMvpPlayerId
    ? null
    : getSeasonMvpSelection({
        votes,
        leagueId,
        seasonId,
        matches,
        mvpSystem,
      })
  const mvpPlayerIds = manualMvpPlayerId
    ? [manualMvpPlayerId]
    : toStringArray(calculatedMvp?.playerIds)
  const nameByPlayerId = new Map(
    playerProfiles.map((player) => [player.id, player.displayName]),
  )

  return {
    winnerPlayerIds,
    winnerNames: winnerPlayerIds
      .map((playerId) => nameByPlayerId.get(playerId))
      .filter((name): name is string => Boolean(name)),
    mvpPlayerIds,
    mvpNames: mvpPlayerIds
      .map((playerId) => nameByPlayerId.get(playerId))
      .filter((name): name is string => Boolean(name)),
  }
}
