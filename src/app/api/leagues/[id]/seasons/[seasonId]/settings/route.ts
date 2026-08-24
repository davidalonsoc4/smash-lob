import { NextResponse } from "next/server"
import { normalizeSeasonRegistrationFee } from "@/lib/seasonRegistration"
import {
  createScheduledLeagueLocationValue,
  getLeagueLocationIdentityKey,
  normalizeLeagueLocations,
  normalizeScheduleLocationValue,
} from "@/lib/leagueLocations"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import {
  isSeasonMutationError,
  updateServerSeasonRoundSettings,
} from "@/lib/serverSeasonMutations"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import type { SeasonRoundSettings } from "@/context/SeasonSettingsProvider"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdateSeasonSettingsBody = {
  roundWindowMode?: unknown
  seasonStartsAt?: unknown
  scheduledStartAt?: unknown
  preseasonSecretDaysBefore?: unknown
  calendarVisibilityMode?: unknown
  revealedThroughRound?: unknown
  openingRoundEnabled?: unknown
  openingRoundAt?: unknown
  openingRoundLocation?: unknown
  roundWindowDays?: unknown
  requiresThreeSets?: unknown
  mvpSystem?: unknown
  resultConfirmationMode?: unknown
  manualActiveRound?: unknown
  manualCompletedRounds?: unknown
  registrationFee?: unknown
  allowPlayerIncidents?: unknown
  allowPlayerSubstitutions?: unknown
  availabilityRecommendationsEnabled?: unknown
}

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function parseRoundWindowMode(value: unknown): SeasonRoundSettings["roundWindowMode"] | null {
  return value === "none" || value === "fixed-days" ? value : null
}

function parseCalendarVisibilityMode(
  value: unknown,
): SeasonRoundSettings["calendarVisibilityMode"] | null {
  return value === "full" || value === "progressive" ? value : null
}

function parseNonNegativeInteger(value: unknown) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

function parseMvpSystem(value: unknown): SeasonRoundSettings["mvpSystem"] | null {
  return value === "none" ||
    value === "automatic" ||
    value === "automatic_advanced" ||
    value === "voting"
    ? value
    : null
}

function parseResultConfirmationMode(
  value: unknown
): SeasonRoundSettings["resultConfirmationMode"] | null {
  return value === "required" || value === "optional" || value === "none"
    ? value
    : null
}

function parseOptionalDateOnly(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const cleanValue = cleanString(value)

  return dateOnlyPattern.test(cleanValue) ? cleanValue : null
}


function parseOptionalScheduledStart(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const cleanValue = cleanString(value)
  const date = new Date(cleanValue)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function parseOpeningRoundLocation(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string") return undefined
  const location = normalizeScheduleLocationValue(value)
  return location ? createScheduledLeagueLocationValue(location, null) : undefined
}

function parseOptionalPositiveInteger(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null
  }

  return numberValue
}

function parseOptionalPreseasonSecretDays(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 90 ? parsed : undefined
}

function parseManualCompletedRounds(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  const rounds = value
    .map((round) => Number(round))
    .filter((round) => Number.isInteger(round) && round > 0)
    .sort((firstRound, secondRound) => firstRound - secondRound)

  if (rounds.length !== value.length || new Set(rounds).size !== rounds.length) {
    return null
  }

  return rounds
}

function parseRegistrationFee(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  return normalizeSeasonRegistrationFee(value)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  const { id: leagueId, seasonId } = await params

  if (!validateUuid(leagueId) || !validateUuid(seasonId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerSeasonAdmin(leagueId, seasonId, { requireMutable: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<UpdateSeasonSettingsBody>(request)
  const roundWindowMode = parseRoundWindowMode(body?.roundWindowMode)
  const seasonStartsAt =
    roundWindowMode === "fixed-days"
      ? parseOptionalDateOnly(body?.seasonStartsAt)
      : null
  const scheduledStartAt = parseOptionalScheduledStart(body?.scheduledStartAt)
  const preseasonSecretDaysBefore = parseOptionalPreseasonSecretDays(body?.preseasonSecretDaysBefore)
  const calendarVisibilityMode = parseCalendarVisibilityMode(body?.calendarVisibilityMode)
  const revealedThroughRound = parseNonNegativeInteger(body?.revealedThroughRound)
  const openingRoundEnabled = body?.openingRoundEnabled === true
  const openingRoundAt = parseOptionalScheduledStart(body?.openingRoundAt)
  const openingRoundLocation = parseOpeningRoundLocation(body?.openingRoundLocation)
  const roundWindowDays =
    roundWindowMode === "fixed-days"
      ? parseOptionalPositiveInteger(body?.roundWindowDays)
      : null
  const requiresThreeSets =
    typeof body?.requiresThreeSets === "boolean" ? body.requiresThreeSets : null
  const mvpSystem = parseMvpSystem(body?.mvpSystem)
  const resultConfirmationMode = parseResultConfirmationMode(
    body?.resultConfirmationMode
  )
  const manualActiveRound = parseOptionalPositiveInteger(body?.manualActiveRound)
  const manualCompletedRounds = parseManualCompletedRounds(body?.manualCompletedRounds)
  const registrationFee = parseRegistrationFee(body?.registrationFee)
  const allowPlayerIncidents =
    typeof body?.allowPlayerIncidents === "boolean"
      ? body.allowPlayerIncidents
      : null
  const allowPlayerSubstitutions =
    typeof body?.allowPlayerSubstitutions === "boolean"
      ? body.allowPlayerSubstitutions
      : null
  const availabilityRecommendationsEnabled =
    typeof body?.availabilityRecommendationsEnabled === "boolean"
      ? body.availabilityRecommendationsEnabled
      : null

  if (
    !roundWindowMode ||
    requiresThreeSets === null ||
    scheduledStartAt === undefined ||
    preseasonSecretDaysBefore === undefined ||
    !calendarVisibilityMode ||
    revealedThroughRound === null ||
    openingRoundAt === undefined ||
    openingRoundLocation === undefined ||
    !mvpSystem ||
    !resultConfirmationMode ||
    !manualCompletedRounds ||
    !registrationFee ||
    allowPlayerIncidents === null ||
    allowPlayerSubstitutions === null ||
    availabilityRecommendationsEnabled === null
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const effectiveOpeningRoundAt =
    openingRoundEnabled && scheduledStartAt ? scheduledStartAt : openingRoundAt

  if (
    scheduledStartAt &&
    (access.season.status !== "upcoming" || new Date(scheduledStartAt).getTime() <= Date.now())
  ) {
    return NextResponse.json({ error: "scheduled_start_must_be_future" }, { status: 400 })
  }

  if (openingRoundEnabled && (!effectiveOpeningRoundAt || !openingRoundLocation)) {
    return NextResponse.json({ error: "opening_round_requires_datetime_and_location" }, { status: 400 })
  }

  if (openingRoundLocation) {
    const { data: leagueRow, error: leagueError } = await access.actor.supabase
      .from("leagues")
      .select("locations")
      .eq("id", leagueId)
      .maybeSingle()
    if (leagueError) {
      return NextResponse.json({ error: "league_locations_lookup_failed" }, { status: 500 })
    }
    const requestedLocation = normalizeScheduleLocationValue(openingRoundLocation)
    const leagueLocations = normalizeLeagueLocations(leagueRow?.locations)
    const belongsToLeague = Boolean(
      requestedLocation &&
        leagueLocations.some(
          (location) =>
            getLeagueLocationIdentityKey(location) === getLeagueLocationIdentityKey(requestedLocation),
        ),
    )
    if (!belongsToLeague) {
      return NextResponse.json({ error: "opening_round_location_invalid" }, { status: 400 })
    }
  }


  if (
    roundWindowMode === "fixed-days" &&
    (!seasonStartsAt || roundWindowDays === null)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (access.season.status !== "upcoming") {
    const { data: currentSettings, error: currentSettingsError } =
      await access.actor.supabase
        .from("season_settings")
        .select("registration_fee,opening_round_enabled,opening_round_at,opening_round_location")
        .eq("season_id", seasonId)
        .maybeSingle()

    if (currentSettingsError) {
      return NextResponse.json(
        { error: "season_settings_lookup_failed" },
        { status: 500 },
      )
    }

    const currentRegistrationFee = normalizeSeasonRegistrationFee(
      currentSettings?.registration_fee,
    )

    if (currentRegistrationFee.enabled !== registrationFee.enabled) {
      return NextResponse.json(
        { error: "registration_state_locked_after_start" },
        { status: 409 },
      )
    }

    const currentOpeningEnabled = currentSettings?.opening_round_enabled === true
    const currentOpeningAt =
      typeof currentSettings?.opening_round_at === "string"
        ? new Date(currentSettings.opening_round_at).toISOString()
        : null
    const currentOpeningLocation =
      typeof currentSettings?.opening_round_location === "string"
        ? currentSettings.opening_round_location
        : null
    if (
      currentOpeningEnabled !== openingRoundEnabled ||
      currentOpeningAt !== (openingRoundEnabled ? effectiveOpeningRoundAt : null) ||
      currentOpeningLocation !== (openingRoundEnabled ? openingRoundLocation : null)
    ) {
      return NextResponse.json(
        { error: "opening_round_locked_after_start" },
        { status: 409 },
      )
    }
  }

  if (
    (manualActiveRound !== null && manualActiveRound > access.season.totalRounds) ||
    revealedThroughRound > access.season.totalRounds ||
    manualCompletedRounds.some((round) => round > access.season.totalRounds) ||
    (manualActiveRound !== null && manualCompletedRounds.includes(manualActiveRound))
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  try {
    await updateServerSeasonRoundSettings({
      supabase: access.actor.supabase,
      leagueId,
      seasonId,
      settings: {
        roundWindowMode,
        seasonStartsAt,
        scheduledStartAt,
        preseasonSecretDaysBefore: scheduledStartAt ? preseasonSecretDaysBefore : null,
        calendarVisibilityMode,
        revealedThroughRound,
        openingRoundEnabled,
        openingRoundAt: openingRoundEnabled ? effectiveOpeningRoundAt : null,
        openingRoundLocation: openingRoundEnabled ? openingRoundLocation : null,
        roundWindowDays,
        requiresThreeSets,
        mvpSystem,
        resultConfirmationMode,
        manualActiveRound,
        manualCompletedRounds,
        registrationFee,
        allowPlayerIncidents,
        allowPlayerSubstitutions,
        availabilityRecommendationsEnabled,
      },
      seasonStatus: access.season.status,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (isSeasonMutationError(error)) {
      return NextResponse.json({ error: error.code }, { status: error.status })
    }

    return NextResponse.json(
      { error: "season_settings_update_failed" },
      { status: 500 }
    )
  }
}
