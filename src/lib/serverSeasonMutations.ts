import "server-only"

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
  newPlayerNames: string[]
  roundWindowMode: RoundWindowMode
  seasonStartsAt: string | null
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

function isPristineUpcomingMatch(match: Record<string, unknown>) {
  return (
    match.status === "scheduling" &&
    match.points_a === null &&
    match.points_b === null &&
    !hasArrayItems(match.sets) &&
    match.scheduled_at === null &&
    match.date_label === null &&
    match.location === null &&
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

export async function updateServerSeasonRoundSettings({
  supabase,
  leagueId,
  seasonId,
  settings,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
  settings: SeasonRoundSettings
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
    round_window_days: settings.roundWindowDays,
    requires_three_sets: settings.requiresThreeSets,
    mvp_system: settings.mvpSystem,
    result_confirmation_mode: settings.resultConfirmationMode,
    manual_active_round: settings.manualActiveRound,
    manual_completed_rounds: settings.manualCompletedRounds,
    registration_fee: registrationFee,
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

export async function startServerExistingSeason({
  supabase,
  leagueId,
  seasonId,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
}): Promise<SeasonSnapshot> {
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
    seasons: [mapSeason(season)],
    playerProfiles: [],
    seasonPlayers: [],
    seasonSettings: [],
    activeSeasonIds: {
      [leagueId]: seasonId,
    },
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
}: {
  supabase: SupabaseClient
  season: ServerSeason
  playerIds: string[]
  scheduleMode: SeasonScheduleMode
}): Promise<MatchData[]> {
  const expectedRoundCount = getSeasonScheduleRoundCount({
    playerCount: playerIds.length,
    mode: scheduleMode,
  })
  const generatedMatches = generateBalancedCalendar({
    leagueId: season.leagueId,
    seasonId: season.id,
    playerIds,
    scheduleMode,
  })

  if (season.status !== "upcoming") {
    throw new SeasonMutationError(
      409,
      "season_calendar_repair_not_allowed",
      "Solo se puede regenerar el calendario antes de comenzar la temporada."
    )
  }

  if (season.totalRounds !== expectedRoundCount) {
    throw new SeasonMutationError(
      409,
      "season_calendar_repair_round_count_mismatch",
      "La longitud actual de la temporada no coincide con el calendario que se quiere regenerar."
    )
  }

  const { data: existingMatches, error: matchesError } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("season_id", season.id)

  if (matchesError) {
    throw new SeasonMutationError(500, "season_calendar_repair_lookup_failed")
  }

  if ((existingMatches ?? []).length !== generatedMatches.length) {
    throw new SeasonMutationError(
      409,
      "season_calendar_repair_match_count_mismatch",
      "El numero actual de partidos no coincide con el calendario equilibrado esperado."
    )
  }

  if (
    (existingMatches ?? []).some(
      (match) => !isPristineUpcomingMatch(match as Record<string, unknown>)
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
    status: "scheduling",
  }))

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
    newPlayerNames,
    roundWindowMode,
    seasonStartsAt,
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
  } = input
  const { supabase, user, membership } = actor
  const uniquePlayerIds = await assertLeaguePlayerIds({
    supabase,
    leagueId,
    playerIds,
  })
  const cleanNewPlayerNames = newPlayerNames
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

  const totalPlayers = uniquePlayerIds.length + cleanNewPlayerNames.length
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
              avatar_url:
                selectedNewPlayerIndex === index ? user.avatarUrl ?? null : null,
            }))
          )
          .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
      : { data: [], error: null }

  if (playersError) {
    throw new SeasonMutationError(500, "season_players_create_failed")
  }

  const finalPlayerIds = [
    ...uniquePlayerIds,
    ...(newPlayers ?? []).map((player) => player.id),
  ]
  const selectedSelfPlayerId = !user.isSuperuser && selfPlayerValue
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

  if (selectedSelfPlayerId && !user.isSuperuser) {
    if (user.avatarUrl) {
      const { error: avatarError } = await supabase
        .from("players")
        .update({ avatar_url: user.avatarUrl })
        .eq("id", selectedSelfPlayerId)
        .is("avatar_url", null)

      if (avatarError) {
        throw new SeasonMutationError(500, "season_player_avatar_update_failed")
      }
    }

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

  let registrationRecipientPlayerId =
    selectedSelfPlayerId && linkedMembershipRole === "creator"
      ? selectedSelfPlayerId
      : null
  const { data: leagueOwner, error: leagueOwnerError } = await supabase
    .from("leagues")
    .select("created_by_user_id")
    .eq("id", leagueId)
    .maybeSingle()

  if (leagueOwnerError) {
    throw new SeasonMutationError(500, "season_league_owner_lookup_failed")
  }

  if (leagueOwner?.created_by_user_id) {
    const { data: creatorMembership, error: creatorMembershipError } =
      await supabase
        .from("league_memberships")
        .select("player_id")
        .eq("league_id", leagueId)
        .eq("user_id", leagueOwner.created_by_user_id)
        .maybeSingle()

    if (creatorMembershipError) {
      throw new SeasonMutationError(500, "season_creator_membership_lookup_failed")
    }

    if (
      creatorMembership?.player_id &&
      finalPlayerIds.includes(creatorMembership.player_id)
    ) {
      registrationRecipientPlayerId = creatorMembership.player_id
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
              result_reported_by_player_id: match.resultReportedByPlayerId,
              result_locked: match.resultLocked,
            }))
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
    paidPlayerIds: registrationRecipientPlayerId
      ? [registrationRecipientPlayerId]
      : [],
  })
  const { error: settingsError } = await supabase
    .from("season_settings")
    .insert({
      season_id: season.id,
      league_id: leagueId,
      round_window_mode: roundWindowMode,
      season_starts_at: seasonStartsAt,
      round_window_days: roundWindowDays,
      requires_three_sets: requiresThreeSets,
      mvp_system: mvpSystem,
      result_confirmation_mode: resultConfirmationMode,
      manual_active_round: null,
      manual_completed_rounds: [],
      registration_fee: registrationFee,
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
      mvpSystem,
      resultConfirmationMode,
      manualActiveRound: null,
      manualCompletedRounds: [],
      registrationFee,
    },
  ]
  const linkedMembership: UserLeagueMembership | null =
    user.isSuperuser || !selectedSelfPlayerId
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
