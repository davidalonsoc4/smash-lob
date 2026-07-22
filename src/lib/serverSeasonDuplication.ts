import "server-only"

import { generateBalancedCalendar, getSeasonScheduleRoundCount } from "@/lib/calendar"
import type { MatchData } from "@/context/MatchDataProvider"
import type {
  SeasonRoundSettings,
  SeasonSnapshot,
} from "@/context/SeasonSettingsProvider"
import type { PlayerProfile, Season, SeasonPlayer } from "@/data/fakeData"
import { buildSeasonRegistrationFee, normalizeSeasonRegistrationFee } from "@/lib/seasonRegistration"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"

export class SeasonDuplicationError extends Error {
  status: number
  code: string

  constructor(status: number, code: string) {
    super(code)
    this.status = status
    this.code = code
  }
}

type SeasonRow = {
  id: string
  league_id: string
  name: string
  status: string
  total_rounds: number
  completed_rounds: number
}

type SettingsRow = {
  season_id: string
  league_id: string
  round_window_mode: "none" | "fixed-days"
  season_starts_at: string | null
  round_window_days: number | null
  requires_three_sets: boolean
  mvp_system: "none" | "automatic" | "voting"
  result_confirmation_mode: "required" | "optional" | "none"
  registration_fee: unknown
  schedule_mode: "single" | "double" | "extended"
}

type PlayerRow = {
  id: string
  league_id: string
  slug: string
  display_name: string
  avatar_initials: string
  avatar_url: string | null
  user_id: string | null
}

function mapSeason(row: SeasonRow): Season {
  return {
    id: row.id,
    leagueId: row.league_id,
    name: row.name,
    status:
      row.status === "finished"
        ? "finished"
        : row.status === "upcoming"
          ? "upcoming"
          : "active",
    totalRounds: row.total_rounds,
    completedRounds: row.completed_rounds,
  }
}

function mapPlayer(row: PlayerRow): PlayerProfile {
  return {
    id: row.id,
    leagueId: row.league_id,
    slug: row.slug,
    displayName: row.display_name,
    avatarInitials: row.avatar_initials,
    avatarUrl: row.avatar_url,
    userId: row.user_id,
  }
}

async function cleanupDuplicatedSeason({
  supabase,
  seasonId,
}: {
  supabase: ServerLeagueActor["supabase"]
  seasonId: string
}) {
  await supabase.from("seasons").delete().eq("id", seasonId)
}

export async function duplicateServerSeason({
  actor,
  leagueId,
  sourceSeasonId,
  name,
}: {
  actor: ServerLeagueActor
  leagueId: string
  sourceSeasonId: string
  name: string
}): Promise<{
  snapshot: SeasonSnapshot
  matches: MatchData[]
  sourceSeason: Season
  duplicatedSeason: Season
}> {
  const { supabase } = actor
  const [sourceResult, settingsResult, existingUpcomingResult] = await Promise.all([
    supabase
      .from("seasons")
      .select("id,league_id,name,status,total_rounds,completed_rounds")
      .eq("id", sourceSeasonId)
      .eq("league_id", leagueId)
      .maybeSingle(),
    supabase
      .from("season_settings")
      .select(
        "season_id,league_id,round_window_mode,season_starts_at,round_window_days,requires_three_sets,mvp_system,result_confirmation_mode,registration_fee,schedule_mode",
      )
      .eq("season_id", sourceSeasonId)
      .eq("league_id", leagueId)
      .maybeSingle(),
    supabase
      .from("seasons")
      .select("id")
      .eq("league_id", leagueId)
      .eq("status", "upcoming")
      .limit(1),
  ])

  if (sourceResult.error || settingsResult.error || existingUpcomingResult.error) {
    throw new SeasonDuplicationError(500, "season_duplicate_lookup_failed")
  }

  if (!sourceResult.data || !settingsResult.data) {
    throw new SeasonDuplicationError(404, "season_not_found")
  }

  const sourceSeason = sourceResult.data as SeasonRow
  const sourceSettings = settingsResult.data as SettingsRow

  if (sourceSeason.status !== "finished") {
    throw new SeasonDuplicationError(409, "season_must_be_finished")
  }

  if ((existingUpcomingResult.data ?? []).length > 0) {
    throw new SeasonDuplicationError(409, "upcoming_season_already_exists")
  }

  const { data: sourceSeasonPlayers, error: playersError } = await supabase
    .from("season_players")
    .select("player_id,status")
    .eq("season_id", sourceSeasonId)

  if (playersError) {
    throw new SeasonDuplicationError(500, "season_players_lookup_failed")
  }

  const sourcePlayerRows = (sourceSeasonPlayers ?? []) as {
    player_id: unknown
    status?: unknown
  }[]
  const playerIds: string[] = Array.from(
    new Set(
      sourcePlayerRows
        .filter((item) =>
          !("status" in item) ||
          item.status === null ||
          item.status === undefined ||
          item.status === "active",
        )
        .map((item) =>
          typeof item.player_id === "string" ? item.player_id : null,
        )
        .filter((playerId): playerId is string => Boolean(playerId)),
    ),
  )

  if (playerIds.length < 4 || playerIds.length % 4 !== 0) {
    throw new SeasonDuplicationError(409, "season_player_count_invalid")
  }

  const { data: playerRows, error: playerRowsError } = await supabase
    .from("players")
    .select("id,league_id,slug,display_name,avatar_initials,avatar_url,user_id")
    .eq("league_id", leagueId)
    .in("id", playerIds)

  if (playerRowsError || (playerRows ?? []).length !== playerIds.length) {
    throw new SeasonDuplicationError(500, "season_duplicate_player_profiles_failed")
  }

  const scheduleMode =
    sourceSettings.schedule_mode === "double" ||
    sourceSettings.schedule_mode === "extended"
      ? sourceSettings.schedule_mode
      : "single"
  const totalRounds = getSeasonScheduleRoundCount({
    playerCount: playerIds.length,
    mode: scheduleMode,
  })
  const { data: createdSeason, error: seasonCreateError } = await supabase
    .from("seasons")
    .insert({
      league_id: leagueId,
      name,
      status: "upcoming",
      total_rounds: totalRounds,
      completed_rounds: 0,
    })
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single()

  if (seasonCreateError || !createdSeason) {
    throw new SeasonDuplicationError(500, "season_duplicate_create_failed")
  }

  const duplicatedSeason = createdSeason as SeasonRow
  const sourceFee = normalizeSeasonRegistrationFee(sourceSettings.registration_fee)
  const registrationFee = buildSeasonRegistrationFee({
    enabled: sourceFee.enabled,
    amount: sourceFee.amount,
    purpose: sourceFee.purpose,
    playerIds,
  })

  const { error: seasonPlayersError } = await supabase
    .from("season_players")
    .insert(
      playerIds.map((playerId) => ({
        season_id: duplicatedSeason.id,
        player_id: playerId,
        status: "active",
      })),
    )

  if (seasonPlayersError) {
    await cleanupDuplicatedSeason({ supabase, seasonId: duplicatedSeason.id })
    throw new SeasonDuplicationError(500, "season_duplicate_players_failed")
  }

  const newMatches = generateBalancedCalendar({
    leagueId,
    seasonId: duplicatedSeason.id,
    playerIds,
    scheduleMode,
  })
  const { data: createdMatches, error: matchesError } = await supabase
    .from("matches")
    .insert(
      newMatches.map((match) => ({
        league_id: match.leagueId,
        season_id: match.seasonId,
        round: match.round,
        status: match.status,
        team_a: match.teamA,
        team_b: match.teamB,
        points_a: null,
        points_b: null,
        sets: [],
        scheduled_at: null,
        date_label: null,
        location: null,
        result_recorded_at: null,
        result_reported_by_player_id: null,
        result_locked: false,
        ranking_counts: true,
      })),
    )
    .select(matchSelect)

  if (matchesError) {
    await cleanupDuplicatedSeason({ supabase, seasonId: duplicatedSeason.id })
    throw new SeasonDuplicationError(500, "season_duplicate_matches_failed")
  }

  const settings: SeasonRoundSettings = {
    leagueId,
    seasonId: duplicatedSeason.id,
    roundWindowMode:
      sourceSettings.round_window_mode === "fixed-days" ? "fixed-days" : "none",
    seasonStartsAt: null,
    roundWindowDays: sourceSettings.round_window_days,
    requiresThreeSets: sourceSettings.requires_three_sets,
    mvpSystem:
      sourceSettings.mvp_system === "none" || sourceSettings.mvp_system === "voting"
        ? sourceSettings.mvp_system
        : "automatic",
    resultConfirmationMode:
      sourceSettings.result_confirmation_mode === "required" ||
      sourceSettings.result_confirmation_mode === "none"
        ? sourceSettings.result_confirmation_mode
        : "optional",
    manualActiveRound: null,
    manualCompletedRounds: [],
    registrationFee,
    rosterMode: "fixed",
    playerCapacity: playerIds.length,
    registrationOpen: false,
    rosterCompletedAt: new Date().toISOString(),
    scheduleMode,
    calendarMode: "balanced",
  }

  const { error: settingsCreateError } = await supabase
    .from("season_settings")
    .insert({
      season_id: settings.seasonId,
      league_id: settings.leagueId,
      round_window_mode: settings.roundWindowMode,
      season_starts_at: null,
      round_window_days: settings.roundWindowDays,
      requires_three_sets: settings.requiresThreeSets,
      mvp_system: settings.mvpSystem,
      result_confirmation_mode: settings.resultConfirmationMode,
      manual_active_round: null,
      manual_completed_rounds: [],
      registration_fee: registrationFee,
      roster_mode: "fixed",
      player_capacity: playerIds.length,
      registration_open: false,
      roster_completed_at: settings.rosterCompletedAt,
      schedule_mode: scheduleMode,
      calendar_mode: "balanced",
    })

  if (settingsCreateError) {
    await cleanupDuplicatedSeason({ supabase, seasonId: duplicatedSeason.id })
    throw new SeasonDuplicationError(500, "season_duplicate_settings_failed")
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: duplicatedSeason.id })
    .eq("id", leagueId)

  if (leagueUpdateError) {
    await cleanupDuplicatedSeason({ supabase, seasonId: duplicatedSeason.id })
    throw new SeasonDuplicationError(500, "season_duplicate_league_update_failed")
  }

  const snapshot: SeasonSnapshot = {
    seasons: [mapSeason(sourceSeason), mapSeason(duplicatedSeason)],
    playerProfiles: ((playerRows ?? []) as PlayerRow[]).map(mapPlayer),
    seasonPlayers: playerIds.map(
      (playerId): SeasonPlayer => ({
        seasonId: duplicatedSeason.id,
        playerId,
        status: "active",
      }),
    ),
    seasonSettings: [settings],
    activeSeasonIds: { [leagueId]: duplicatedSeason.id },
  }

  return {
    snapshot,
    matches: (createdMatches ?? []).map((match) =>
      mapSupabaseMatch(match as Record<string, unknown>),
    ),
    sourceSeason: mapSeason(sourceSeason),
    duplicatedSeason: mapSeason(duplicatedSeason),
  }
}
