import "server-only"

import { randomInt } from "node:crypto"

import {
  generateBalancedCalendar,
  generateManualCalendar,
  getNewPlayerIndexFromToken,
  getSeasonScheduleRoundCount,
  resolveManualCalendarDraft,
  type ManualCalendarMatchDraft,
  type SeasonScheduleMode,
} from "@/lib/calendar"
import {
  buildSeasonRegistrationFee,
  ensureSeasonRegistrationPlayers,
  normalizeSeasonRegistrationFee,
} from "@/lib/seasonRegistration"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import type { MatchData } from "@/context/MatchDataProvider"
import type {
  RoundWindowMode,
  SeasonRoundSettings,
  SeasonSnapshot,
} from "@/context/SeasonSettingsProvider"
import type {
  PlayerProfile,
  Season,
  SeasonPlayer,
  UserLeagueMembership,
  RosterMode,
} from "@/data/fakeData"
import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"
import type { ServerSeason } from "@/lib/serverSeasonAccess"

type SupabaseClient = ServerLeagueActor["supabase"]

export class SeasonMutationError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message?: string) {
    super(message ?? code)
    this.status = status
    this.code = code
  }
}

export function isSeasonMutationError(
  error: unknown
): error is SeasonMutationError {
  return error instanceof SeasonMutationError
}

type CreateServerSeasonInput = {
  leagueId: string
  activeSeasonId: string | null
  name: string
  playerIds: string[]
  appUserIds: string[]
  newPlayerNames: string[]
  roundWindowMode: RoundWindowMode
  seasonStartsAt: string | null
  scheduledStartAt: string | null
  preseasonSecretDaysBefore: number | null
  calendarVisibilityMode: SeasonRoundSettings["calendarVisibilityMode"]
  revealedThroughRound: number
  openingRoundEnabled: boolean
  openingRoundAt: string | null
  openingRoundLocation: string | null
  roundWindowDays: number | null
  requiresThreeSets: boolean
  mvpSystem: SeasonRoundSettings["mvpSystem"]
  resultConfirmationMode: SeasonRoundSettings["resultConfirmationMode"]
  manualMatches?: ManualCalendarMatchDraft[]
  scheduleMode: SeasonScheduleMode
  registrationFeeEnabled: boolean
  registrationFeeAmount: number
  registrationFeePurpose: string
  selfPlayerValue: string | null
  rosterMode: RosterMode
  playerCapacity: number
  calendarMode: "balanced" | "manual"
  availabilityRecommendationsEnabled: boolean
}

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

function toSeasonStatus(status: unknown): "upcoming" | "active" | "finished" {
  if (status === "finished") {
    return "finished"
  }

  if (status === "upcoming") {
    return "upcoming"
  }

  return "active"
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

function hasArrayItems(value: unknown) {
  return Array.isArray(value) && value.length > 0
}

function hasBookingReservationItems(value: unknown) {
  if (hasArrayItems(value)) {
    return true
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const booking = value as Record<string, unknown>

  return (
    hasArrayItems(booking.reservations) ||
    hasArrayItems(booking.ballPurchases)
  )
}

function hasRecordedMatchResult(match: Record<string, unknown>) {
  return (
    (match.points_a !== null && match.points_a !== undefined) ||
    (match.points_b !== null && match.points_b !== undefined) ||
    hasArrayItems(match.sets) ||
    (typeof match.result_recorded_at === "string" && match.result_recorded_at.length > 0) ||
    (typeof match.result_reported_by_player_id === "string" &&
      match.result_reported_by_player_id.length > 0)
  )
}

function isPristineUpcomingMatch(
  match: Record<string, unknown>,
  openingRoundAt: string | null = null,
  openingRoundLocation: string | null = null,
) {
  const round = Number(match.round)
  const scheduledAt = typeof match.scheduled_at === "string" ? match.scheduled_at : null
  const openingScheduleAllowed =
    round === 1 && Boolean(openingRoundAt) && scheduledAt === openingRoundAt
  const openingLocationAllowed =
    openingScheduleAllowed &&
    (match.location === null ||
      (Boolean(openingRoundLocation) && match.location === openingRoundLocation))

  return (
    (match.status === "scheduling" || (openingScheduleAllowed && match.status === "scheduled")) &&
    match.points_a === null &&
    match.points_b === null &&
    !hasArrayItems(match.sets) &&
    (scheduledAt === null || openingScheduleAllowed) &&
    match.date_label === null &&
    (match.location === null || openingLocationAllowed) &&
    match.result_recorded_at === null &&
    match.result_reported_by_player_id === null &&
    !Boolean(match.result_locked) &&
    !Boolean(match.court_reserved) &&
    !hasBookingReservationItems(match.booking_reservations) &&
    !hasArrayItems(match.booking_transfers) &&
    match.booking_updated_at === null
  )
}

export async function assertLeaguePlayerIds({
  supabase,
  leagueId,
  playerIds,
}: {
  supabase: SupabaseClient
  leagueId: string
  playerIds: string[]
}) {
  const uniquePlayerIds = Array.from(new Set(playerIds))

  if (uniquePlayerIds.length === 0) {
    return uniquePlayerIds
  }

  const { data, error } = await supabase
    .from("players")
    .select("id")
    .eq("league_id", leagueId)
    .in("id", uniquePlayerIds)

  if (error) {
    throw new SeasonMutationError(500, "league_players_lookup_failed")
  }

  const availablePlayerIds = new Set(
    (data ?? [])
      .map((player) => player.id)
      .filter((playerId): playerId is string => typeof playerId === "string")
  )

  if (availablePlayerIds.size !== uniquePlayerIds.length) {
    throw new SeasonMutationError(400, "invalid_player_ids")
  }

  return uniquePlayerIds
}

async function getSeasonPlayerIds({
  supabase,
  seasonId,
}: {
  supabase: SupabaseClient
  seasonId: string
}) {
  const { data, error } = await supabase
    .from("season_players")
    .select("player_id")
    .eq("season_id", seasonId)

  if (error) {
    throw new SeasonMutationError(500, "season_players_lookup_failed")
  }

  return (data ?? [])
    .map((row) => row.player_id)
    .filter((playerId): playerId is string => typeof playerId === "string")
}

type EditableSeasonRoundSettings = Pick<
  SeasonRoundSettings,
  | "roundWindowMode"
  | "seasonStartsAt"
  | "scheduledStartAt"
  | "preseasonSecretDaysBefore"
  | "calendarVisibilityMode"
  | "revealedThroughRound"
  | "openingRoundEnabled"
  | "openingRoundAt"
  | "openingRoundLocation"
  | "roundWindowDays"
  | "requiresThreeSets"
  | "mvpSystem"
  | "resultConfirmationMode"
  | "manualActiveRound"
  | "manualCompletedRounds"
  | "registrationFee"
  | "allowPlayerIncidents"
  | "allowPlayerSubstitutions"
  | "availabilityRecommendationsEnabled"
>

export async function updateServerSeasonRoundSettings({
  supabase,
  leagueId,
  seasonId,
  settings,
  seasonStatus,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
  settings: EditableSeasonRoundSettings
  seasonStatus: "upcoming" | "active" | "finished"
}) {
  const seasonPlayerIds = await getSeasonPlayerIds({
    supabase,
    seasonId,
  })
  const registrationFee = ensureSeasonRegistrationPlayers({
    registrationFee: normalizeSeasonRegistrationFee(settings.registrationFee),
    playerIds: seasonPlayerIds,
  })
  const payload = {
    league_id: leagueId,
    season_id: seasonId,
    round_window_mode: settings.roundWindowMode,
    season_starts_at: settings.seasonStartsAt,
    scheduled_start_at: settings.scheduledStartAt,
    preseason_secret_days_before: settings.preseasonSecretDaysBefore ?? null,
    calendar_visibility_mode: settings.calendarVisibilityMode === "progressive" ? "progressive" : "full",
    revealed_through_round: Math.max(0, settings.revealedThroughRound ?? 0),
    opening_round_enabled: settings.openingRoundEnabled === true,
    opening_round_at: settings.openingRoundEnabled ? settings.openingRoundAt ?? null : null,
    opening_round_location: settings.openingRoundEnabled ? settings.openingRoundLocation ?? null : null,
    round_window_days: settings.roundWindowDays,
    requires_three_sets: settings.requiresThreeSets,
    mvp_system: settings.mvpSystem,
    result_confirmation_mode: settings.resultConfirmationMode,
    manual_active_round: settings.manualActiveRound,
    manual_completed_rounds: settings.manualCompletedRounds,
    registration_fee: registrationFee,
    allow_player_incidents: settings.allowPlayerIncidents,
    allow_player_substitutions: settings.allowPlayerSubstitutions,
    availability_recommendations_enabled: settings.availabilityRecommendationsEnabled,
  }

  const { data, error } = await supabase
    .from("season_settings")
    .update(payload)
    .eq("season_id", seasonId)
    .select("season_id")
    .maybeSingle()

  if (error) {
    throw new SeasonMutationError(500, "season_settings_update_failed")
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from("season_settings")
      .insert(payload)

    if (insertError) {
      throw new SeasonMutationError(500, "season_settings_create_failed")
    }
  }

  if (seasonStatus === "upcoming" && settings.openingRoundEnabled && settings.openingRoundAt) {
    const { error: openingScheduleError } = await supabase
      .from("matches")
      .update({
        scheduled_at: settings.openingRoundAt,
        date_label: null,
        location: settings.openingRoundLocation ?? null,
        status: "scheduled",
      })
      .eq("season_id", seasonId)
      .eq("round", 1)

    if (openingScheduleError) {
      throw new SeasonMutationError(500, "opening_round_schedule_sync_failed")
    }
  }
}

export async function finishServerActiveSeason({
  supabase,
  leagueId,
  season,
}: {
  supabase: SupabaseClient
  leagueId: string
  season: ServerSeason
}): Promise<SeasonSnapshot> {
  const { data: finishedSeason, error: seasonError } = await supabase
    .from("seasons")
    .update({
      status: "finished",
      completed_rounds: season.totalRounds,
    })
    .eq("id", season.id)
    .eq("league_id", leagueId)
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single()

  if (seasonError) {
    throw new SeasonMutationError(500, "season_finish_failed")
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: null })
    .eq("id", leagueId)

  if (leagueUpdateError) {
    throw new SeasonMutationError(500, "season_finish_league_update_failed")
  }

  return {
    seasons: [mapSeason(finishedSeason)],
    playerProfiles: [],
    seasonPlayers: [],
    seasonSettings: [],
    activeSeasonIds: {
      [leagueId]: "",
    },
  }
}

export async function reopenServerFinishedSeason({
  supabase,
  leagueId,
  seasonId,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
}): Promise<{ snapshot: SeasonSnapshot; matches: MatchData[] }> {
  const { error: finishOtherActiveError } = await supabase
    .from("seasons")
    .update({ status: "finished" })
    .eq("league_id", leagueId)
    .eq("status", "active")
    .neq("id", seasonId)

  if (finishOtherActiveError) {
    throw new SeasonMutationError(500, "season_reopen_finish_other_active_failed")
  }

  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .update({ status: "active" })
    .eq("id", seasonId)
    .eq("league_id", leagueId)
    .eq("status", "finished")
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single()

  if (seasonError) {
    throw new SeasonMutationError(500, "season_reopen_failed", seasonError.message)
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: seasonId })
    .eq("id", leagueId)

  if (leagueUpdateError) {
    throw new SeasonMutationError(
      500,
      "season_reopen_league_update_failed",
      leagueUpdateError.message,
    )
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .order("round", { ascending: true })

  if (matchesError) {
    throw new SeasonMutationError(
      500,
      "season_reopen_matches_lookup_failed",
      matchesError.message,
    )
  }

  return {
    snapshot: {
      seasons: [mapSeason(season)],
      playerProfiles: [],
      seasonPlayers: [],
      seasonSettings: [],
      activeSeasonIds: { [leagueId]: seasonId },
    },
    matches: (matches ?? []).map((match) =>
      mapSupabaseMatch(match as Record<string, unknown>),
    ),
  }
}

export async function prepareServerSelfRegistrationSeasonCalendar({
  supabase,
  leagueId,
  seasonId,
  actorUserId,
  actorIsSuperuser,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
  actorUserId: string
  actorIsSuperuser: boolean
}): Promise<{ prepared: boolean; matchCount: number }> {
  const { data: settingsRow, error: settingsLookupError } = await supabase
    .from("season_settings")
    .select("scheduled_start_at,roster_mode,player_capacity,schedule_mode,opening_round_enabled,opening_round_at,opening_round_location")
    .eq("season_id", seasonId)
    .eq("league_id", leagueId)
    .maybeSingle()

  if (settingsLookupError) {
    throw new SeasonMutationError(500, "season_settings_lookup_failed")
  }

  if (
    settingsRow?.roster_mode !== "self_registration" ||
    typeof settingsRow.scheduled_start_at !== "string"
  ) {
    return { prepared: false, matchCount: 0 }
  }

  const { data: seasonPlayerRows, error: seasonPlayersError } = await supabase
    .from("season_players")
    .select("player_id,status")
    .eq("season_id", seasonId)
    .eq("status", "active")

  if (seasonPlayersError) {
    throw new SeasonMutationError(500, "season_players_lookup_failed")
  }

  const playerIds = (seasonPlayerRows ?? [])
    .map((item) => item.player_id)
    .filter((playerId): playerId is string => typeof playerId === "string")
  const capacity = Number(settingsRow.player_capacity ?? 0)

  if (!capacity || playerIds.length !== capacity) {
    throw new SeasonMutationError(409, "roster_incomplete")
  }

  const scheduleMode: SeasonScheduleMode =
    settingsRow.schedule_mode === "double" ||
    settingsRow.schedule_mode === "extended"
      ? settingsRow.schedule_mode
      : "single"
  const generatedMatches = generateBalancedCalendar({
    leagueId,
    seasonId,
    playerIds,
    scheduleMode,
  })
  const { data, error } = await supabase.rpc(
    "server_prepare_self_registration_season_calendar",
    {
      p_actor_user_id: actorUserId,
      p_actor_is_superuser: actorIsSuperuser,
      p_league_id: leagueId,
      p_season_id: seasonId,
      p_matches: generatedMatches.map((match) => ({
        round: match.round,
        teamA: match.teamA,
        teamB: match.teamB,
      })),
    },
  )

  if (error) {
    const message = error.message ?? "season_calendar_prepare_failed"
    if (message.includes("roster_incomplete")) {
      throw new SeasonMutationError(409, "roster_incomplete")
    }
    if (message.includes("season_not_scheduled")) {
      throw new SeasonMutationError(409, "season_not_scheduled")
    }
    if (message.includes("season_prepare_not_allowed")) {
      throw new SeasonMutationError(409, "season_prepare_not_allowed")
    }
    if (message.includes("season_calendar_invalid")) {
      throw new SeasonMutationError(409, "season_calendar_invalid")
    }
    if (message.includes("forbidden")) {
      throw new SeasonMutationError(403, "forbidden")
    }
    throw new SeasonMutationError(500, "season_calendar_prepare_failed", message)
  }

  if (settingsRow.opening_round_enabled === true && typeof settingsRow.opening_round_at === "string") {
    const { error: openingScheduleError } = await supabase
      .from("matches")
      .update({
        scheduled_at: settingsRow.opening_round_at,
        date_label: null,
        location: typeof settingsRow.opening_round_location === "string" ? settingsRow.opening_round_location : null,
        status: "scheduled",
      })
      .eq("season_id", seasonId)
      .eq("round", 1)
    if (openingScheduleError) {
      throw new SeasonMutationError(500, "opening_round_schedule_sync_failed")
    }
  }

  const row = Array.isArray(data) ? data[0] : null

  return {
    prepared: Boolean(row?.prepared),
    matchCount: Number(row?.match_count ?? generatedMatches.length),
  }
}

export async function startServerExistingSeason({
  supabase,
  leagueId,
  seasonId,
  actorUserId,
  actorIsSuperuser,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
  actorUserId: string
  actorIsSuperuser: boolean
}): Promise<{ snapshot: SeasonSnapshot; matches: MatchData[] }> {
  const { data: settingsRow, error: settingsLookupError } = await supabase
    .from("season_settings")
    .select(
      "season_id,league_id,round_window_mode,season_starts_at,scheduled_start_at,preseason_secret_days_before,calendar_visibility_mode,revealed_through_round,opening_round_enabled,opening_round_at,opening_round_location,round_window_days,requires_three_sets,mvp_system,result_confirmation_mode,manual_active_round,manual_completed_rounds,registration_fee,roster_mode,player_capacity,registration_open,roster_completed_at,schedule_mode,calendar_mode,allow_player_incidents,allow_player_substitutions,availability_recommendations_enabled",
    )
    .eq("season_id", seasonId)
    .eq("league_id", leagueId)
    .maybeSingle()

  if (settingsLookupError) {
    throw new SeasonMutationError(500, "season_settings_lookup_failed")
  }

  if (settingsRow?.roster_mode === "self_registration") {
    const { data: seasonPlayerRows, error: seasonPlayersError } = await supabase
      .from("season_players")
      .select("player_id,status")
      .eq("season_id", seasonId)
      .eq("status", "active")

    if (seasonPlayersError) {
      throw new SeasonMutationError(500, "season_players_lookup_failed")
    }

    const playerIds = (seasonPlayerRows ?? [])
      .map((item) => item.player_id)
      .filter((playerId): playerId is string => typeof playerId === "string")
    const capacity = Number(settingsRow.player_capacity ?? 0)

    if (!capacity || playerIds.length !== capacity) {
      throw new SeasonMutationError(409, "roster_incomplete")
    }

    const scheduleMode: SeasonScheduleMode =
      settingsRow.schedule_mode === "double" ||
      settingsRow.schedule_mode === "extended"
        ? settingsRow.schedule_mode
        : "single"
    const generatedMatches = generateBalancedCalendar({
      leagueId,
      seasonId,
      playerIds,
      scheduleMode,
    })
    const { error: startError } = await supabase.rpc(
      "server_start_self_registration_season",
      {
        p_actor_user_id: actorUserId,
        p_actor_is_superuser: actorIsSuperuser,
        p_league_id: leagueId,
        p_season_id: seasonId,
        p_matches: generatedMatches.map((match) => ({
          round: match.round,
          teamA: match.teamA,
          teamB: match.teamB,
        })),
      },
    )

    if (startError) {
      const message = startError.message ?? "season_start_failed"
      if (message.includes("roster_incomplete")) {
        throw new SeasonMutationError(409, "roster_incomplete")
      }
      if (message.includes("registration_unsettled")) {
        throw new SeasonMutationError(409, "registration_unsettled")
      }
      if (message.includes("forbidden")) {
        throw new SeasonMutationError(403, "forbidden")
      }
      if (message.includes("season_calendar_invalid")) {
        throw new SeasonMutationError(409, "season_calendar_invalid")
      }
      throw new SeasonMutationError(500, "season_start_failed", message)
    }

    if (settingsRow.opening_round_enabled === true && typeof settingsRow.opening_round_at === "string") {
      const { error: openingScheduleError } = await supabase
        .from("matches")
        .update({ scheduled_at: settingsRow.opening_round_at, date_label: null, location: typeof settingsRow.opening_round_location === "string" ? settingsRow.opening_round_location : null, status: "scheduled" })
        .eq("season_id", seasonId)
        .eq("round", 1)
      if (openingScheduleError) {
        throw new SeasonMutationError(500, "opening_round_schedule_sync_failed")
      }
    }

    const [{ data: season, error: seasonError }, { data: matches, error: matchesError }] =
      await Promise.all([
        supabase
          .from("seasons")
          .select("id,league_id,name,status,total_rounds,completed_rounds")
          .eq("id", seasonId)
          .eq("league_id", leagueId)
          .single(),
        supabase
          .from("matches")
          .select(matchSelect)
          .eq("season_id", seasonId)
          .order("round", { ascending: true }),
      ])

    if (seasonError || matchesError) {
      throw new SeasonMutationError(500, "season_start_snapshot_failed")
    }

    const registrationFee = normalizeSeasonRegistrationFee(
      settingsRow.registration_fee,
    )
    const seasonSettings: SeasonRoundSettings = {
      leagueId,
      seasonId,
      roundWindowMode:
        settingsRow.round_window_mode === "fixed-days" ? "fixed-days" : "none",
      seasonStartsAt: settingsRow.season_starts_at,
      scheduledStartAt:
        typeof settingsRow.scheduled_start_at === "string"
          ? settingsRow.scheduled_start_at
          : null,
      preseasonSecretDaysBefore:
        typeof settingsRow.preseason_secret_days_before === "number"
          ? settingsRow.preseason_secret_days_before
          : null,
      calendarVisibilityMode:
        settingsRow.calendar_visibility_mode === "progressive" ? "progressive" : "full",
      revealedThroughRound:
        typeof settingsRow.revealed_through_round === "number"
          ? settingsRow.revealed_through_round
          : 0,
      openingRoundEnabled: settingsRow.opening_round_enabled === true,
      openingRoundAt:
        typeof settingsRow.opening_round_at === "string"
          ? settingsRow.opening_round_at
          : null,
      openingRoundLocation:
        typeof settingsRow.opening_round_location === "string"
          ? settingsRow.opening_round_location
          : null,
      roundWindowDays: settingsRow.round_window_days,
      requiresThreeSets: Boolean(settingsRow.requires_three_sets),
      mvpSystem:
        settingsRow.mvp_system === "none" ||
        settingsRow.mvp_system === "automatic_advanced" ||
        settingsRow.mvp_system === "voting"
          ? settingsRow.mvp_system
          : "automatic",
      resultConfirmationMode:
        settingsRow.result_confirmation_mode === "required" ||
        settingsRow.result_confirmation_mode === "none"
          ? settingsRow.result_confirmation_mode
          : "optional",
      manualActiveRound:
        typeof settingsRow.manual_active_round === "number"
          ? settingsRow.manual_active_round
          : null,
      manualCompletedRounds: Array.isArray(settingsRow.manual_completed_rounds)
        ? settingsRow.manual_completed_rounds.filter(
            (round): round is number => typeof round === "number",
          )
        : [],
      registrationFee,
      rosterMode: "self_registration",
      playerCapacity: capacity,
      registrationOpen: false,
      rosterCompletedAt:
        typeof settingsRow.roster_completed_at === "string"
          ? settingsRow.roster_completed_at
          : new Date().toISOString(),
      scheduleMode,
      calendarMode: "balanced",
      allowPlayerIncidents: settingsRow.allow_player_incidents !== false,
      allowPlayerSubstitutions: settingsRow.allow_player_substitutions !== false,
      availabilityRecommendationsEnabled:
        settingsRow.availability_recommendations_enabled === true,
    }

    return {
      snapshot: {
        seasons: [mapSeason(season)],
        playerProfiles: [],
        seasonPlayers: [],
        seasonSettings: [seasonSettings],
        activeSeasonIds: { [leagueId]: seasonId },
      },
      matches: (matches ?? []).map((match) =>
        mapSupabaseMatch(match as Record<string, unknown>),
      ),
    }
  }

  const { error: finishOtherActiveError } = await supabase
    .from("seasons")
    .update({ status: "finished" })
    .eq("league_id", leagueId)
    .eq("status", "active")
    .neq("id", seasonId)

  if (finishOtherActiveError) {
    throw new SeasonMutationError(500, "season_finish_other_active_failed")
  }

  const { data: season, error } = await supabase
    .from("seasons")
    .update({ status: "active" })
    .eq("id", seasonId)
    .eq("league_id", leagueId)
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single()

  if (error) {
    throw new SeasonMutationError(500, "season_start_failed")
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: seasonId })
    .eq("id", leagueId)

  if (leagueUpdateError) {
    throw new SeasonMutationError(500, "season_start_league_update_failed")
  }

  return {
    snapshot: {
      seasons: [mapSeason(season)],
      playerProfiles: [],
      seasonPlayers: [],
      seasonSettings: [],
      activeSeasonIds: { [leagueId]: seasonId },
    },
    matches: [],
  }
}

export async function deleteServerSeason({
  supabase,
  leagueId,
  seasonId,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
}): Promise<SeasonSnapshot> {
  const { error: matchesError } = await supabase
    .from("matches")
    .delete()
    .eq("season_id", seasonId)

  if (matchesError) {
    throw new SeasonMutationError(500, "season_delete_matches_failed")
  }

  const { error: seasonPlayersError } = await supabase
    .from("season_players")
    .delete()
    .eq("season_id", seasonId)

  if (seasonPlayersError) {
    throw new SeasonMutationError(500, "season_delete_players_failed")
  }

  const { error: settingsError } = await supabase
    .from("season_settings")
    .delete()
    .eq("season_id", seasonId)

  if (settingsError) {
    throw new SeasonMutationError(500, "season_delete_settings_failed")
  }

  const { error: seasonError } = await supabase
    .from("seasons")
    .delete()
    .eq("id", seasonId)
    .eq("league_id", leagueId)

  if (seasonError) {
    throw new SeasonMutationError(500, "season_delete_failed")
  }

  const { data: fallbackSeason, error: fallbackError } = await supabase
    .from("seasons")
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .eq("league_id", leagueId)
    .limit(1)
    .maybeSingle()

  if (fallbackError) {
    throw new SeasonMutationError(500, "season_fallback_lookup_failed")
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: fallbackSeason?.id ?? null })
    .eq("id", leagueId)

  if (leagueUpdateError) {
    throw new SeasonMutationError(500, "season_delete_league_update_failed")
  }

  return {
    seasons: fallbackSeason ? [mapSeason(fallbackSeason)] : [],
    playerProfiles: [],
    seasonPlayers: [],
    seasonSettings: [],
    activeSeasonIds: {
      [leagueId]: fallbackSeason?.id ?? "",
    },
  }
}

export async function deleteServerRoundMatches({
  supabase,
  seasonId,
  round,
}: {
  supabase: SupabaseClient
  seasonId: string
  round: number
}) {
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("season_id", seasonId)
    .eq("round", round)

  if (error) {
    throw new SeasonMutationError(500, "season_round_delete_failed")
  }
}

export async function updateServerSeasonRoundOrder({
  supabase,
  seasonId,
  roundOrder,
}: {
  supabase: SupabaseClient
  seasonId: string
  roundOrder: number[]
}) {
  const nextRoundByCurrentRound = new Map(
    roundOrder.map((round, index) => [round, index + 1])
  )
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id,round")
    .eq("season_id", seasonId)

  if (error) {
    throw new SeasonMutationError(500, "season_round_order_lookup_failed")
  }

  const updates = (matches ?? [])
    .map((match) => ({
      id: match.id,
      round: nextRoundByCurrentRound.get(match.round),
    }))
    .filter(
      (match): match is { id: string; round: number } =>
        typeof match.id === "string" && typeof match.round === "number"
    )

  for (const match of updates) {
    const { error: updateError } = await supabase
      .from("matches")
      .update({ round: match.round })
      .eq("id", match.id)

    if (updateError) {
      throw new SeasonMutationError(500, "season_round_order_update_failed")
    }
  }
}

export async function replaceServerUpcomingSeasonBalancedCalendar({
  supabase,
  season,
  playerIds,
  scheduleMode,
  reroll = false,
}: {
  supabase: SupabaseClient
  season: ServerSeason
  playerIds: string[]
  scheduleMode: SeasonScheduleMode
  reroll?: boolean
}): Promise<MatchData[]> {
  const expectedRoundCount = getSeasonScheduleRoundCount({
    playerCount: playerIds.length,
    mode: scheduleMode,
  })
  if (!reroll && season.status !== "upcoming") {
    throw new SeasonMutationError(
      409,
      "season_calendar_repair_not_allowed",
      "Solo se puede reparar el calendario antes de comenzar la temporada."
    )
  }

  if (season.totalRounds !== expectedRoundCount) {
    throw new SeasonMutationError(
      409,
      "season_calendar_repair_round_count_mismatch",
      "La longitud actual de la temporada no coincide con el calendario que se quiere regenerar."
    )
  }

  const { data: calendarSettings, error: calendarSettingsError } = await supabase
    .from("season_settings")
    .select("opening_round_enabled,opening_round_at,opening_round_location")
    .eq("season_id", season.id)
    .maybeSingle()

  if (calendarSettingsError) {
    throw new SeasonMutationError(500, "season_calendar_repair_settings_lookup_failed")
  }

  const openingRoundAt =
    calendarSettings?.opening_round_enabled === true &&
    typeof calendarSettings.opening_round_at === "string"
      ? calendarSettings.opening_round_at
      : null
  const openingRoundLocation =
    openingRoundAt && typeof calendarSettings?.opening_round_location === "string"
      ? calendarSettings.opening_round_location
      : null

  const { data: existingMatches, error: matchesError } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("season_id", season.id)

  if (matchesError) {
    throw new SeasonMutationError(500, "season_calendar_repair_lookup_failed")
  }

  const baseGeneratedMatches = generateBalancedCalendar({
    leagueId: season.leagueId,
    seasonId: season.id,
    playerIds,
    scheduleMode,
  })

  const calendarSignature = (
    matches: Array<{ round: number; teamA: string[]; teamB: string[] }>,
  ) =>
    matches
      .map((match) => {
        const teams = [
          [...match.teamA].sort().join("+"),
          [...match.teamB].sort().join("+"),
        ].sort()
        return `${match.round}:${teams.join("|")}`
      })
      .sort((left, right) => left.localeCompare(right))
      .join(";")

  const currentSignature = calendarSignature(
    (existingMatches ?? []).map((match) => ({
      round: Number(match.round),
      teamA: Array.isArray(match.team_a) ? match.team_a.map(String) : [],
      teamB: Array.isArray(match.team_b) ? match.team_b.map(String) : [],
    })),
  )

  let generatedMatches = baseGeneratedMatches
  if (reroll && playerIds.length > 1) {
    for (let attempt = 0; attempt < 32; attempt += 1) {
      const shuffledPlayerIds = [...playerIds]
      for (let index = shuffledPlayerIds.length - 1; index > 0; index -= 1) {
        const swapIndex = randomInt(index + 1)
        ;[shuffledPlayerIds[index], shuffledPlayerIds[swapIndex]] = [
          shuffledPlayerIds[swapIndex],
          shuffledPlayerIds[index],
        ]
      }
      const candidate = generateBalancedCalendar({
        leagueId: season.leagueId,
        seasonId: season.id,
        playerIds: shuffledPlayerIds,
        scheduleMode,
      })
      if (calendarSignature(candidate) !== currentSignature) {
        generatedMatches = candidate
        break
      }
    }
  }

  if (reroll && calendarSignature(generatedMatches) === currentSignature) {
    throw new SeasonMutationError(
      409,
      "season_calendar_reroll_no_alternative",
      "No se ha encontrado un calendario equilibrado diferente. No se ha modificado el calendario actual.",
    )
  }

  if ((existingMatches ?? []).length !== generatedMatches.length) {
    throw new SeasonMutationError(
      409,
      "season_calendar_repair_match_count_mismatch",
      "El numero actual de partidos no coincide con el calendario equilibrado esperado."
    )
  }

  const hasRecordedResults = (existingMatches ?? []).some((match) =>
    hasRecordedMatchResult(match as Record<string, unknown>),
  )

  if (reroll && hasRecordedResults) {
    throw new SeasonMutationError(
      409,
      "season_calendar_reroll_has_results",
      "No se puede hacer REROLL porque ya hay resultados registrados en esta temporada.",
    )
  }

  if (
    !reroll &&
    (existingMatches ?? []).some(
      (match) => !isPristineUpcomingMatch(match as Record<string, unknown>, openingRoundAt, openingRoundLocation)
    )
  ) {
    throw new SeasonMutationError(
      409,
      "season_calendar_repair_dirty_matches",
      "Hay partidos ya programados o modificados. No se ha reemplazado el calendario para evitar perder datos."
    )
  }

  const sortedExistingMatches = [...(existingMatches ?? [])].sort(
    (firstMatch, secondMatch) => {
      const roundDifference =
        Number(firstMatch.round) - Number(secondMatch.round)

      return roundDifference !== 0
        ? roundDifference
        : String(firstMatch.id).localeCompare(String(secondMatch.id))
    }
  )
  const sortedGeneratedMatches = [...generatedMatches].sort(
    (firstMatch, secondMatch) =>
      firstMatch.round - secondMatch.round ||
      firstMatch.id.localeCompare(secondMatch.id)
  )

  const payload = sortedGeneratedMatches.map((match, index) => ({
    id: sortedExistingMatches[index].id,
    league_id: season.leagueId,
    season_id: season.id,
    round: match.round,
    team_a: match.teamA,
    team_b: match.teamB,
    status: openingRoundAt && match.round === 1 ? "scheduled" : "scheduling",
    scheduled_at: openingRoundAt && match.round === 1 ? openingRoundAt : null,
    date_label: null,
    location: openingRoundAt && match.round === 1 ? openingRoundLocation : null,
  }))

  if (reroll) {
    const { error: rerollError } = await supabase.rpc(
      "reroll_season_calendar_matches",
      {
        p_season_id: season.id,
        p_matches: payload,
      },
    )

    if (rerollError) {
      if (rerollError.message.includes("season_calendar_reroll_has_results")) {
        throw new SeasonMutationError(
          409,
          "season_calendar_reroll_has_results",
          "No se puede hacer REROLL porque ya hay resultados registrados en esta temporada.",
        )
      }
      throw new SeasonMutationError(500, "season_calendar_reroll_update_failed")
    }

    const { data: rerolledMatches, error: rerolledMatchesError } = await supabase
      .from("matches")
      .select(matchSelect)
      .eq("season_id", season.id)

    if (rerolledMatchesError) {
      throw new SeasonMutationError(500, "season_calendar_reroll_lookup_failed")
    }

    return (rerolledMatches ?? []).map((match) =>
      mapSupabaseMatch(match as Record<string, unknown>)
    )
  }

  const { data: updatedMatches, error: updateError } = await supabase
    .from("matches")
    .upsert(payload, { onConflict: "id" })
    .select(matchSelect)

  if (updateError) {
    throw new SeasonMutationError(500, "season_calendar_repair_update_failed")
  }

  return (updatedMatches ?? []).map((match) =>
    mapSupabaseMatch(match as Record<string, unknown>)
  )
}

export async function createServerSeason({
  actor,
  input,
}: {
  actor: ServerLeagueActor
  input: CreateServerSeasonInput
}): Promise<{
  matches: MatchData[]
  seasonSnapshot: SeasonSnapshot
  linkedMembership: UserLeagueMembership | null
}> {
  const {
    leagueId,
    activeSeasonId,
    name,
    playerIds,
    appUserIds,
    newPlayerNames,
    roundWindowMode,
    seasonStartsAt,
    scheduledStartAt,
    preseasonSecretDaysBefore,
    calendarVisibilityMode,
    revealedThroughRound,
    openingRoundEnabled,
    openingRoundAt,
    openingRoundLocation,
    roundWindowDays,
    requiresThreeSets,
    mvpSystem,
    resultConfirmationMode,
    manualMatches,
    scheduleMode,
    registrationFeeEnabled,
    registrationFeeAmount,
    registrationFeePurpose,
    selfPlayerValue,
    rosterMode,
    playerCapacity,
    calendarMode,
    availabilityRecommendationsEnabled,
  } = input
  const { supabase, user, membership } = actor
  const isSelfRegistration = rosterMode === "self_registration"
  const { count: existingSeasonCount, error: seasonCountError } = await supabase
    .from("seasons")
    .select("id", { count: "exact", head: true })
    .eq("league_id", leagueId)
  if (seasonCountError) {
    throw new SeasonMutationError(500, "season_count_lookup_failed")
  }
  const isFirstLeagueSeason = (existingSeasonCount ?? 0) === 0
  const shouldAutoEnrollCreator =
    isSelfRegistration && isFirstLeagueSeason && playerIds.length === 0
  const selfRegistrationProfileName = shouldAutoEnrollCreator
    ? [user.firstName, user.lastName]
        .filter((value): value is string => Boolean(value?.trim()))
        .join(" ")
        .trim()
    : ""

  if (
    shouldAutoEnrollCreator &&
    (!user.profileCompletedAt ||
      !user.firstName?.trim() ||
      !user.lastName?.trim() ||
      !selfRegistrationProfileName)
  ) {
    throw new SeasonMutationError(409, "profile_incomplete")
  }

  const uniquePlayerIds = await assertLeaguePlayerIds({
    supabase,
    leagueId,
    playerIds,
  })
  const cleanAppUserIds = isSelfRegistration ? [] : Array.from(new Set(appUserIds))
  if (cleanAppUserIds.includes(user.id)) {
    throw new SeasonMutationError(400, "invalid_app_user_ids")
  }
  const cleanNewPlayerNames = isSelfRegistration
    ? []
    : newPlayerNames
        .map((playerName) => playerName.trim())
        .filter(Boolean)
  const selectedNewPlayerIndex = selfPlayerValue
    ? getNewPlayerIndexFromToken(selfPlayerValue)
    : null

  const shouldFinishCurrentSeason = Boolean(activeSeasonId)

  if (shouldFinishCurrentSeason) {
    const { data: currentSeason, error: currentSeasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("id", activeSeasonId)
      .eq("league_id", leagueId)
      .maybeSingle()

    if (currentSeasonError) {
      throw new SeasonMutationError(500, "season_finish_lookup_failed")
    }

    if (!currentSeason) {
      throw new SeasonMutationError(404, "season_not_found")
    }
  }

  const totalPlayers = isSelfRegistration
    ? playerCapacity
    : uniquePlayerIds.length + cleanAppUserIds.length + cleanNewPlayerNames.length
  const { data: finishedSeason, error: finishError } = shouldFinishCurrentSeason
    ? await supabase
        .from("seasons")
        .update({ status: "finished" })
        .eq("id", activeSeasonId)
        .select("id,league_id,name,status,total_rounds,completed_rounds")
        .maybeSingle()
    : { data: null, error: null }

  if (finishError) {
    throw new SeasonMutationError(500, "season_finish_failed")
  }

  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .insert({
      league_id: leagueId,
      name,
      status: "upcoming",
      total_rounds: getSeasonScheduleRoundCount({
        playerCount: totalPlayers,
        mode: scheduleMode,
      }),
      completed_rounds: 0,
    })
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single()

  if (seasonError) {
    throw new SeasonMutationError(500, "season_create_failed")
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
              avatar_url: null,
            }))
          )
          .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
      : { data: [], error: null }

  if (playersError) {
    throw new SeasonMutationError(500, "season_players_create_failed")
  }

  let selfRegistrationPlayer: {
    id: string
    league_id: string
    slug: string
    display_name: string
    avatar_initials: string
    avatar_url?: string | null
  } | null = null

  if (shouldAutoEnrollCreator) {
    const profileName = selfRegistrationProfileName

    if (membership?.playerId) {
      const { data: existingPlayer, error: existingPlayerError } = await supabase
        .from("players")
        .update({
          display_name: profileName,
          avatar_initials: initials(profileName),
        })
        .eq("id", membership.playerId)
        .eq("league_id", leagueId)
        .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
        .single()

      if (existingPlayerError) {
        throw new SeasonMutationError(500, "season_creator_player_update_failed")
      }

      selfRegistrationPlayer = existingPlayer
    } else {
      const { data: createdPlayer, error: createdPlayerError } = await supabase
        .from("players")
        .insert({
          league_id: leagueId,
          slug: `${slug(profileName)}-${Date.now()}`,
          display_name: profileName,
          avatar_initials: initials(profileName),
          avatar_url: null,
        })
        .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
        .single()

      if (createdPlayerError) {
        throw new SeasonMutationError(500, "season_creator_player_create_failed")
      }

      const { error: creatorMembershipError } = await supabase
        .from("league_memberships")
        .upsert(
          {
            user_id: user.id,
            league_id: leagueId,
            player_id: createdPlayer.id,
            role: membership?.role ?? "creator",
          },
          { onConflict: "user_id,league_id" },
        )

      if (creatorMembershipError) {
        throw new SeasonMutationError(500, "season_creator_membership_update_failed")
      }

      selfRegistrationPlayer = createdPlayer
    }
  }

  const appLinkedPlayers: Array<{
    id: string
    league_id: string
    slug: string
    display_name: string
    avatar_initials: string
    avatar_url?: string | null
  }> = []

  if (cleanAppUserIds.length > 0) {
    const [appUsersResult, appMembershipsResult] = await Promise.all([
      supabase
        .from("app_users")
        .select("id,display_name,first_name,last_name,avatar_url,profile_completed_at")
        .in("id", cleanAppUserIds),
      supabase
        .from("league_memberships")
        .select("user_id,player_id,role")
        .eq("league_id", leagueId)
        .in("user_id", cleanAppUserIds),
    ])

    if (appUsersResult.error || appMembershipsResult.error) {
      throw new SeasonMutationError(500, "season_app_users_lookup_failed")
    }

    const userById = new Map((appUsersResult.data ?? []).map((item) => [item.id, item]))
    const membershipByUserId = new Map(
      (appMembershipsResult.data ?? []).map((item) => [item.user_id, item]),
    )

    if (userById.size !== cleanAppUserIds.length) {
      throw new SeasonMutationError(400, "invalid_app_user_ids")
    }

    for (const [index, appUserId] of cleanAppUserIds.entries()) {
      const appUser = userById.get(appUserId)
      if (!appUser || !appUser.profile_completed_at) {
        throw new SeasonMutationError(400, "invalid_app_user_ids")
      }

      const existingMembership = membershipByUserId.get(appUserId)
      if (existingMembership?.player_id) {
        if (uniquePlayerIds.includes(existingMembership.player_id)) {
          throw new SeasonMutationError(409, "duplicate_season_player")
        }
        const { data: existingPlayer, error: existingPlayerError } = await supabase
          .from("players")
          .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
          .eq("id", existingMembership.player_id)
          .eq("league_id", leagueId)
          .single()
        if (existingPlayerError) {
          throw new SeasonMutationError(500, "season_app_player_lookup_failed")
        }
        appLinkedPlayers.push(existingPlayer)
        continue
      }

      const displayName =
        (typeof appUser.display_name === "string" && appUser.display_name.trim()) ||
        [appUser.first_name, appUser.last_name]
          .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
          .join(" ") ||
        "Jugador"
      const { data: createdPlayer, error: createdPlayerError } = await supabase
        .from("players")
        .insert({
          league_id: leagueId,
          slug: `${slug(displayName)}-${Date.now()}-app-${index + 1}`,
          display_name: displayName,
          avatar_initials: initials(displayName),
          avatar_url: typeof appUser.avatar_url === "string" ? appUser.avatar_url : null,
        })
        .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
        .single()
      if (createdPlayerError) {
        throw new SeasonMutationError(500, "season_app_player_create_failed")
      }

      const { error: appMembershipError } = await supabase
        .from("league_memberships")
        .upsert(
          {
            user_id: appUserId,
            league_id: leagueId,
            player_id: createdPlayer.id,
            role: existingMembership?.role ?? "player",
          },
          { onConflict: "user_id,league_id" },
        )
      if (appMembershipError) {
        throw new SeasonMutationError(500, "season_app_membership_link_failed")
      }
      appLinkedPlayers.push(createdPlayer)
    }
  }

  const finalPlayerIds = isSelfRegistration
    ? shouldAutoEnrollCreator && selfRegistrationPlayer
      ? [selfRegistrationPlayer.id]
      : uniquePlayerIds
    : [
        ...uniquePlayerIds,
        ...(newPlayers ?? []).map((player) => player.id),
        ...appLinkedPlayers.map((player) => player.id),
      ]
  const selectedSelfPlayerId = isSelfRegistration
    ? selfRegistrationPlayer?.id ?? null
    : !user.isSuperuser && selfPlayerValue
      ? selectedNewPlayerIndex === null
        ? selfPlayerValue
        : ((newPlayers ?? [])[selectedNewPlayerIndex]?.id ?? null)
      : null
  const linkedMembershipRole: UserLeagueMembership["role"] =
    membership?.role ?? "creator"

  if (
    selectedSelfPlayerId &&
    membership?.playerId &&
    membership.playerId !== selectedSelfPlayerId
  ) {
    throw new SeasonMutationError(409, "self_player_reassignment_not_allowed")
  }

  if (selectedSelfPlayerId && !finalPlayerIds.includes(selectedSelfPlayerId)) {
    throw new SeasonMutationError(400, "invalid_self_player")
  }

  if (selectedSelfPlayerId) {
    const { error: membershipError } = await supabase
      .from("league_memberships")
      .upsert(
        {
          user_id: user.id,
          league_id: leagueId,
          player_id: selectedSelfPlayerId,
          role: linkedMembershipRole,
        },
        { onConflict: "user_id,league_id" }
      )

    if (membershipError) {
      throw new SeasonMutationError(500, "season_membership_link_failed")
    }
  }


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
      throw new SeasonMutationError(500, "season_players_link_failed")
    }
  }

  const resolvedManualMatches = !isSelfRegistration && manualMatches
    ? resolveManualCalendarDraft({
        matches: manualMatches,
        newPlayerIds: [
          ...(newPlayers ?? []).map((player) => player.id),
          ...appLinkedPlayers.map((player) => player.id),
        ],
      })
    : []
  const seasonMatches = isSelfRegistration
    ? []
    : resolvedManualMatches.length > 0
      ? generateManualCalendar({
          leagueId,
          seasonId: season.id,
          matches: resolvedManualMatches,
          scheduleMode,
        })
      : generateBalancedCalendar({
          leagueId,
          seasonId: season.id,
          playerIds: finalPlayerIds,
          scheduleMode,
        })

  const { data: matchesData, error: matchesError } =
    seasonMatches.length > 0
      ? await supabase
          .from("matches")
          .insert(
            seasonMatches.map((match) => {
              const useOpeningSchedule =
                openingRoundEnabled && Boolean(openingRoundAt) && match.round === 1
              return {
              league_id: match.leagueId,
              season_id: match.seasonId,
              round: match.round,
              status: useOpeningSchedule ? "scheduled" : match.status,
              team_a: match.teamA,
              team_b: match.teamB,
              points_a: match.pointsA,
              points_b: match.pointsB,
              sets: match.sets,
              scheduled_at: useOpeningSchedule ? openingRoundAt : match.scheduledAt,
              date_label: useOpeningSchedule ? null : match.dateLabel,
              location: useOpeningSchedule ? openingRoundLocation : match.location,
              result_recorded_at: match.resultRecordedAt,
              result_reported_by_player_id: match.resultReportedByPlayerId,
              result_locked: match.resultLocked,
              }
            })
          )
          .select(matchSelect)
      : { data: [], error: null }

  if (matchesError) {
    throw new SeasonMutationError(500, "season_matches_create_failed")
  }

  const registrationFee = buildSeasonRegistrationFee({
    enabled: registrationFeeEnabled,
    amount: registrationFeeAmount,
    purpose: registrationFeePurpose,
    playerIds: finalPlayerIds,
    paidPlayerIds: [],
  })
  const { error: settingsError } = await supabase
    .from("season_settings")
    .insert({
      season_id: season.id,
      league_id: leagueId,
      round_window_mode: roundWindowMode,
      season_starts_at: seasonStartsAt,
      scheduled_start_at: scheduledStartAt,
      preseason_secret_days_before: scheduledStartAt ? preseasonSecretDaysBefore : null,
      calendar_visibility_mode: calendarVisibilityMode === "progressive" ? "progressive" : "full",
      revealed_through_round: Math.max(0, revealedThroughRound),
      opening_round_enabled: openingRoundEnabled,
      opening_round_at: openingRoundEnabled ? openingRoundAt : null,
      opening_round_location: openingRoundEnabled ? openingRoundLocation : null,
      round_window_days: roundWindowDays,
      requires_three_sets: requiresThreeSets,
      mvp_system: mvpSystem,
      result_confirmation_mode: resultConfirmationMode,
      manual_active_round: null,
      manual_completed_rounds: [],
      registration_fee: registrationFee,
      roster_mode: rosterMode,
      player_capacity: playerCapacity,
      registration_open:
        isSelfRegistration && finalPlayerIds.length < playerCapacity,
      roster_completed_at:
        isSelfRegistration && finalPlayerIds.length >= playerCapacity
          ? new Date().toISOString()
          : rosterMode === "fixed"
            ? new Date().toISOString()
            : null,
      schedule_mode: scheduleMode,
      calendar_mode: calendarMode,
      allow_player_incidents: true,
      allow_player_substitutions: true,
      availability_recommendations_enabled: availabilityRecommendationsEnabled,
    })

  if (settingsError) {
    throw new SeasonMutationError(500, "season_settings_create_failed")
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: season.id })
    .eq("id", leagueId)

  if (leagueUpdateError) {
    throw new SeasonMutationError(500, "season_league_update_failed")
  }

  const seasons: Season[] = [
    ...(finishedSeason ? [mapSeason(finishedSeason)] : []),
    mapSeason(season),
  ]
  const playerProfiles = [
    ...(newPlayers ?? []).map(mapPlayer),
    ...appLinkedPlayers.map(mapPlayer),
    ...(selfRegistrationPlayer ? [mapPlayer(selfRegistrationPlayer)] : []),
  ]
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
      scheduledStartAt,
      preseasonSecretDaysBefore: scheduledStartAt ? preseasonSecretDaysBefore : null,
      calendarVisibilityMode: calendarVisibilityMode === "progressive" ? "progressive" : "full",
      revealedThroughRound: Math.max(0, revealedThroughRound),
      openingRoundEnabled,
      openingRoundAt: openingRoundEnabled ? openingRoundAt : null,
      openingRoundLocation: openingRoundEnabled ? openingRoundLocation : null,
      roundWindowDays,
      requiresThreeSets,
      mvpSystem,
      resultConfirmationMode,
      manualActiveRound: null,
      manualCompletedRounds: [],
      registrationFee,
      rosterMode,
      playerCapacity,
      registrationOpen:
        isSelfRegistration && finalPlayerIds.length < playerCapacity,
      rosterCompletedAt:
        isSelfRegistration && finalPlayerIds.length >= playerCapacity
          ? new Date().toISOString()
          : rosterMode === "fixed"
            ? new Date().toISOString()
            : null,
      scheduleMode,
      calendarMode,
      allowPlayerIncidents: true,
      allowPlayerSubstitutions: true,
      availabilityRecommendationsEnabled,
    },
  ]
  const linkedMembership: UserLeagueMembership | null =
    !selectedSelfPlayerId
      ? null
      : {
          userId: user.email,
          leagueId,
          playerId: selectedSelfPlayerId,
          role: linkedMembershipRole,
        }

  return {
    matches: (matchesData ?? []).map((match) =>
      mapSupabaseMatch(match as Record<string, unknown>)
    ),
    linkedMembership,
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
