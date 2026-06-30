import { supabase } from "@/lib/supabase"
import {
  generateBalancedCalendar,
  generateManualCalendar,
  resolveManualCalendarDraft,
  type ManualCalendarMatchDraft,
} from "@/lib/calendar"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import type {
  RoundWindowMode,
  SeasonRoundSettings,
  SeasonSnapshot,
} from "@/context/SeasonSettingsProvider"
import type { PlayerProfile, Season, SeasonPlayer } from "@/data/fakeData"
import type { MatchData } from "@/context/MatchDataProvider"

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "JG"
  )
}

function slug(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "jugador"
  )
}

function toSeasonStatus(status: unknown): "active" | "finished" {
  return status === "finished" ? "finished" : "active"
}

function mapSeason(row: {
  id: string
  league_id: string
  name: string
  status: unknown
  total_rounds: number
  completed_rounds: number
}): Season {
  return {
    id: row.id,
    leagueId: row.league_id,
    name: row.name,
    status: toSeasonStatus(row.status),
    totalRounds: row.total_rounds,
    completedRounds: row.completed_rounds,
  }
}

function mapPlayer(row: {
  id: string
  league_id: string
  slug: string
  display_name: string
  avatar_initials: string
  avatar_url?: string | null
}): PlayerProfile {
  return {
    id: row.id,
    leagueId: row.league_id,
    slug: row.slug,
    displayName: row.display_name,
    avatarInitials: row.avatar_initials,
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
  }
}

export async function updateSupabaseSeasonRoundSettings(
  settings: SeasonRoundSettings
) {
  const payload = {
    league_id: settings.leagueId,
    season_id: settings.seasonId,
    round_window_mode: settings.roundWindowMode,
    season_starts_at: settings.seasonStartsAt,
    round_window_days: settings.roundWindowDays,
    requires_three_sets: settings.requiresThreeSets,
  }

  const { data, error } = await supabase
    .from("season_settings")
    .update(payload)
    .eq("season_id", settings.seasonId)
    .select("season_id")
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return
  }

  const { error: insertError } = await supabase
    .from("season_settings")
    .insert(payload)

  if (insertError) {
    throw insertError
  }
}

export async function finishSupabaseActiveSeason({
  leagueId,
  seasonId,
}: {
  leagueId: string
  seasonId: string
}): Promise<SeasonSnapshot> {
  const { data: season, error } = await supabase
    .from("seasons")
    .update({ status: "finished" })
    .eq("id", seasonId)
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single()

  if (error) {
    throw error
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: null })
    .eq("id", leagueId)

  if (leagueUpdateError) {
    throw leagueUpdateError
  }

  return {
    seasons: [mapSeason(season)],
    playerProfiles: [],
    seasonPlayers: [],
    seasonSettings: [],
    activeSeasonIds: {
      [leagueId]: "",
    },
  }
}

export async function startSupabaseSeason({
  leagueId,
  activeSeasonId,
  name,
  playerIds,
  newPlayerNames,
  roundWindowMode,
  seasonStartsAt,
  roundWindowDays,
  requiresThreeSets,
  manualMatches,
}: {
  leagueId: string
  activeSeasonId: string
  name: string
  playerIds: string[]
  newPlayerNames: string[]
  roundWindowMode: RoundWindowMode
  seasonStartsAt: string | null
  roundWindowDays: number | null
  requiresThreeSets: boolean
  manualMatches?: ManualCalendarMatchDraft[]
}): Promise<{
  matches: MatchData[]
  seasonSnapshot: SeasonSnapshot
}> {
  const uniquePlayerIds = Array.from(new Set(playerIds))
  const cleanNewPlayerNames = newPlayerNames
    .map((playerName) => playerName.trim())
    .filter(Boolean)
  const totalPlayers = uniquePlayerIds.length + cleanNewPlayerNames.length

  const { data: finishedSeason, error: finishError } = activeSeasonId
    ? await supabase
        .from("seasons")
        .update({ status: "finished" })
        .eq("id", activeSeasonId)
        .select("id,league_id,name,status,total_rounds,completed_rounds")
        .maybeSingle()
    : { data: null, error: null }

  if (finishError) {
    throw finishError
  }

  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .insert({
      league_id: leagueId,
      name,
      status: "active",
      total_rounds: Math.max(totalPlayers - 1, 1),
      completed_rounds: 0,
    })
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single()

  if (seasonError) {
    throw seasonError
  }

  const { data: newPlayers, error: playersError } =
    cleanNewPlayerNames.length > 0
      ? await supabase
          .from("players")
          .insert(
            cleanNewPlayerNames.map((playerName, index) => ({
              league_id: leagueId,
              slug: `${slug(playerName)}-${Date.now()}-${index + 1}`,
              display_name: playerName,
              avatar_initials: initials(playerName),
            }))
          )
          .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
      : { data: [], error: null }

  if (playersError) {
    throw playersError
  }

  const finalPlayerIds = [
    ...uniquePlayerIds,
    ...(newPlayers ?? []).map((player) => player.id),
  ]

  if (finalPlayerIds.length > 0) {
    const { error: seasonPlayersError } = await supabase
      .from("season_players")
      .insert(
        finalPlayerIds.map((playerId) => ({
          season_id: season.id,
          player_id: playerId,
        }))
      )

    if (seasonPlayersError) {
      throw seasonPlayersError
    }
  }

  const resolvedManualMatches = manualMatches
    ? resolveManualCalendarDraft({
        matches: manualMatches,
        newPlayerIds: (newPlayers ?? []).map((player) => player.id),
      })
    : []
  const seasonMatches =
    resolvedManualMatches.length > 0
      ? generateManualCalendar({
          leagueId,
          seasonId: season.id,
          matches: resolvedManualMatches,
        })
      : generateBalancedCalendar({
          leagueId,
          seasonId: season.id,
          playerIds: finalPlayerIds,
        })

  const { data: matchesData, error: matchesError } =
    seasonMatches.length > 0
      ? await supabase
          .from("matches")
          .insert(
            seasonMatches.map((match) => ({
              league_id: match.leagueId,
              season_id: match.seasonId,
              round: match.round,
              status: match.status,
              team_a: match.teamA,
              team_b: match.teamB,
              points_a: match.pointsA,
              points_b: match.pointsB,
              sets: match.sets,
              scheduled_at: match.scheduledAt,
              date_label: match.dateLabel,
              location: match.location,
              result_recorded_at: match.resultRecordedAt,
            }))
          )
          .select(matchSelect)
      : { data: [], error: null }

  if (matchesError) {
    throw matchesError
  }

  const { error: settingsError } = await supabase
    .from("season_settings")
    .insert({
      season_id: season.id,
      league_id: leagueId,
      round_window_mode: roundWindowMode,
      season_starts_at: seasonStartsAt,
      round_window_days: roundWindowDays,
      requires_three_sets: requiresThreeSets,
    })

  if (settingsError) {
    throw settingsError
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: season.id })
    .eq("id", leagueId)

  if (leagueUpdateError) {
    throw leagueUpdateError
  }

  const seasons: Season[] = [
    ...(finishedSeason ? [mapSeason(finishedSeason)] : []),
    mapSeason(season),
  ]
  const playerProfiles = (newPlayers ?? []).map(mapPlayer)
  const seasonPlayers: SeasonPlayer[] = finalPlayerIds.map((playerId) => ({
    seasonId: season.id,
    playerId,
  }))
  const seasonSettings: SeasonRoundSettings[] = [
    {
      leagueId,
      seasonId: season.id,
      roundWindowMode,
      seasonStartsAt,
      roundWindowDays,
      requiresThreeSets,
    },
  ]

  return {
    matches: (matchesData ?? []).map((match) => mapSupabaseMatch(match)),
    seasonSnapshot: {
      seasons,
      playerProfiles,
      seasonPlayers,
      seasonSettings,
      activeSeasonIds: {
        [leagueId]: season.id,
      },
    },
  }
}
