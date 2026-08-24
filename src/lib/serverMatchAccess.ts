import "server-only"

import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import type { LeagueExperienceMode, LeagueMemberRole } from "@/data/fakeData"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import { isAuthorized } from "@/lib/authorizationPolicy"
import { getEffectiveRevealedThroughRound } from "@/lib/progressiveCalendar"

type MatchAccessOptions = {
  requireLeagueAccess?: boolean
  requireParticipant?: boolean
  requireAdmin?: boolean
  requireMutableSeason?: boolean
}

function toPlayerIds(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((playerId): playerId is string => typeof playerId === "string")
}

function normalizeRole(value: unknown): LeagueMemberRole {
  return value === "creator" || value === "admin" || value === "player"
    ? value
    : "player"
}

export async function getServerMatchActor(
  matchId: string,
  options: MatchAccessOptions = {}
): Promise<
  | {
      ok: true
      actor: {
        supabase: Extract<
          Awaited<ReturnType<typeof requireAuthenticatedAppUser>>,
          { ok: true }
        >["actor"]["supabase"]
        user: Extract<
          Awaited<ReturnType<typeof requireAuthenticatedAppUser>>,
          { ok: true }
        >["actor"]["user"]
        membership: {
          role: LeagueMemberRole
          playerId: string | null
          experienceMode: LeagueExperienceMode
        } | null
        isAdmin: boolean
        isSpectator: boolean
        participantPlayerId: string | null
        match: {
          id: string
          leagueId: string
          seasonId: string
          round: number
          status: "finished" | "scheduled" | "postponed" | "scheduling"
          scheduledAt: string | null
          dateLabel: string | null
          location: string | null
          teamA: string[]
          teamB: string[]
          participantIds: string[]
          pointsA: number | null
          pointsB: number | null
          sets: { a: number; b: number }[]
          reporterPlayerId: string | null
          resultRecordedAt: string | null
          resultLocked: boolean
          rankingCounts: boolean
          incidentType: ReturnType<typeof mapSupabaseMatch>["incidentType"]
          incidentStatus: ReturnType<typeof mapSupabaseMatch>["incidentStatus"]
          incidentReason: string | null
          incidentNotes: string | null
          incidentCreatedAt: string | null
          incidentResolvedAt: string | null
          resolutionType: ReturnType<typeof mapSupabaseMatch>["resolutionType"]
          courtBooking: ReturnType<typeof mapSupabaseMatch>["courtBooking"]
        }
      }
    }
  | {
      ok: false
      status: number
      error: string
    }
> {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return authResult
  }

  const { supabase, user } = authResult.actor
  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("id", matchId)
    .maybeSingle()

  if (matchError) {
    return { ok: false, status: 500, error: "match_lookup_failed" }
  }

  if (!matchRow) {
    return { ok: false, status: 404, error: "match_not_found" }
  }

  const mappedMatch = mapSupabaseMatch(matchRow as Record<string, unknown>)

  const [membershipResult, spectatorResult] = await Promise.all([
    supabase
      .from("league_memberships")
      .select("role,player_id,experience_mode")
      .eq("league_id", matchRow.league_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("league_spectators")
      .select("league_id")
      .eq("league_id", matchRow.league_id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  if (membershipResult.error || spectatorResult.error) {
    return { ok: false, status: 500, error: "match_access_lookup_failed" }
  }

  const membership = membershipResult.data
    ? {
        role: normalizeRole(membershipResult.data.role),
        playerId:
          typeof membershipResult.data.player_id === "string"
            ? membershipResult.data.player_id
            : null,
        experienceMode:
          membershipResult.data.experience_mode === "player" ||
          membershipResult.data.experience_mode === "player_experience"
            ? membershipResult.data.experience_mode
            : "admin",
      }
    : null
  const isSpectator = Boolean(spectatorResult.data)
  const participantIds = Array.from(
    new Set([...toPlayerIds(matchRow.team_a), ...toPlayerIds(matchRow.team_b)])
  )
  const participantPlayerId =
    membership?.playerId && participantIds.includes(membership.playerId)
      ? membership.playerId
      : null
  const authorizationContext = {
    authenticated: true,
    isSuperuser: user.isSuperuser,
    membershipRole: membership?.role ?? null,
    isSpectator,
    isParticipant: Boolean(participantPlayerId),
  }
  const actualIsAdmin = isAuthorized(authorizationContext, "league:admin")
  const experienceMode = membership?.experienceMode ?? "admin"
  const canUseAdminTools = actualIsAdmin &&
    (!membership || experienceMode !== "player")
  const isAdmin = actualIsAdmin &&
    (!membership || experienceMode === "admin")

  if (
    options.requireLeagueAccess &&
    !isAuthorized(authorizationContext, "league:access")
  ) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  if (options.requireAdmin && !canUseAdminTools) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  if (
    options.requireParticipant &&
    !isAuthorized(authorizationContext, "match:participant")
  ) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  if ((!user.isSuperuser || !isAdmin) && (options.requireMutableSeason || !isAdmin)) {
    const [{ data: seasonRow, error: seasonError }, { data: seasonSettings, error: settingsError }] = await Promise.all([
      supabase
        .from("seasons")
        .select("status,total_rounds")
        .eq("id", mappedMatch.seasonId)
        .eq("league_id", mappedMatch.leagueId)
        .maybeSingle(),
      supabase
        .from("season_settings")
        .select("scheduled_start_at,calendar_visibility_mode,revealed_through_round,round_window_mode,season_starts_at,round_window_days,opening_round_enabled,opening_round_at")
        .eq("season_id", mappedMatch.seasonId)
        .eq("league_id", mappedMatch.leagueId)
        .maybeSingle(),
    ])
    if (seasonError || settingsError) return { ok: false, status: 500, error: "season_lookup_failed" }
    if (!seasonRow) return { ok: false, status: 404, error: "season_not_found" }
    if (options.requireMutableSeason && seasonRow.status === "finished") {
      return { ok: false, status: 409, error: "season_finished_read_only" }
    }

    if (
      !options.requireAdmin &&
      !isAdmin &&
      seasonSettings?.calendar_visibility_mode === "progressive"
    ) {
      const { data: seasonMatches, error: seasonMatchesError } = await supabase
        .from("matches")
        .select(matchSelect)
        .eq("season_id", mappedMatch.seasonId)
      if (seasonMatchesError) {
        return { ok: false, status: 500, error: "season_matches_lookup_failed" }
      }
      const settings = {
        leagueId: mappedMatch.leagueId,
        seasonId: mappedMatch.seasonId,
        roundWindowMode: seasonSettings.round_window_mode === "fixed-days" ? "fixed-days" as const : "none" as const,
        seasonStartsAt: typeof seasonSettings.season_starts_at === "string" ? seasonSettings.season_starts_at : null,
        scheduledStartAt: typeof seasonSettings.scheduled_start_at === "string" ? seasonSettings.scheduled_start_at : null,
        preseasonSecretDaysBefore: null,
        calendarVisibilityMode: "progressive" as const,
        revealedThroughRound: typeof seasonSettings.revealed_through_round === "number" ? seasonSettings.revealed_through_round : 0,
        openingRoundEnabled: seasonSettings.opening_round_enabled === true,
        openingRoundAt: typeof seasonSettings.opening_round_at === "string" ? seasonSettings.opening_round_at : null,
        roundWindowDays: typeof seasonSettings.round_window_days === "number" ? seasonSettings.round_window_days : null,
        requiresThreeSets: true,
        mvpSystem: "automatic" as const,
        resultConfirmationMode: "optional" as const,
        manualActiveRound: null,
        manualCompletedRounds: [],
        registrationFee: { enabled: false, amount: 0, purpose: "", payments: [], expenses: [] },
        rosterMode: "fixed" as const,
        playerCapacity: null,
        registrationOpen: false,
        rosterCompletedAt: null,
        scheduleMode: "single" as const,
        calendarMode: "balanced" as const,
        allowPlayerIncidents: true,
        allowPlayerSubstitutions: true,
        availabilityRecommendationsEnabled: false,
      }
      const revealedThrough = getEffectiveRevealedThroughRound({
        seasonStatus: seasonRow.status === "finished" ? "finished" : seasonRow.status === "active" ? "active" : "upcoming",
        totalRounds: Number(seasonRow.total_rounds) || 0,
        settings,
        matches: (seasonMatches ?? []).map((row) => mapSupabaseMatch(row as Record<string, unknown>)),
      })
      if (mappedMatch.round > revealedThrough) {
        return { ok: false, status: 404, error: "match_not_revealed" }
      }
    }

    if (seasonRow.status === "upcoming" && !isAdmin && !options.requireAdmin) {
      const scheduledStartAt =
        typeof seasonSettings?.scheduled_start_at === "string"
          ? seasonSettings.scheduled_start_at
          : null
      const isFuture = scheduledStartAt
        ? new Date(scheduledStartAt).getTime() > Date.now()
        : true
      return {
        ok: false,
        status: 409,
        error: isFuture ? "season_not_started" : "season_start_pending",
      }
    }
  }

  return {
    ok: true,
    actor: {
      supabase,
      user,
      membership,
      isAdmin,
      isSpectator,
      participantPlayerId,
      match: {
        id: mappedMatch.id,
        leagueId: mappedMatch.leagueId,
        seasonId: mappedMatch.seasonId,
        round: mappedMatch.round,
        status: mappedMatch.status,
        scheduledAt: mappedMatch.scheduledAt,
        dateLabel: mappedMatch.dateLabel,
        location: mappedMatch.location,
        teamA: mappedMatch.teamA,
        teamB: mappedMatch.teamB,
        participantIds,
        pointsA: mappedMatch.pointsA,
        pointsB: mappedMatch.pointsB,
        sets: mappedMatch.sets,
        reporterPlayerId: mappedMatch.resultReportedByPlayerId,
        resultRecordedAt: mappedMatch.resultRecordedAt,
        resultLocked: mappedMatch.resultLocked,
        rankingCounts: mappedMatch.rankingCounts,
        incidentType: mappedMatch.incidentType,
        incidentStatus: mappedMatch.incidentStatus,
        incidentReason: mappedMatch.incidentReason,
        incidentNotes: mappedMatch.incidentNotes,
        incidentCreatedAt: mappedMatch.incidentCreatedAt,
        incidentResolvedAt: mappedMatch.incidentResolvedAt,
        resolutionType: mappedMatch.resolutionType,
        courtBooking: mappedMatch.courtBooking,
      },
    },
  }
}
