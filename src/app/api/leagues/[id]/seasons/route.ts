import { NextResponse } from "next/server"
import type { ManualCalendarMatchDraft, SeasonScheduleMode } from "@/lib/calendar"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import {
  createServerSeason,
  isSeasonMutationError,
} from "@/lib/serverSeasonMutations"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import type { RoundWindowMode, SeasonRoundSettings } from "@/context/SeasonSettingsProvider"
import type { RosterMode } from "@/data/fakeData"
import {
  createScheduledLeagueLocationValue,
  getLeagueLocationIdentityKey,
  normalizeLeagueLocations,
  normalizeScheduleLocationValue,
} from "@/lib/leagueLocations"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreateSeasonBody = {
  activeSeasonId?: unknown
  name?: unknown
  playerIds?: unknown
  newPlayerNames?: unknown
  appUserIds?: unknown
  roundWindowMode?: unknown
  seasonStartsAt?: unknown
  scheduledStartAt?: unknown
  preseasonSecretDaysBefore?: unknown
  calendarVisibilityMode?: unknown
  openingRoundEnabled?: unknown
  openingRoundAt?: unknown
  openingRoundLocation?: unknown
  roundWindowDays?: unknown
  requiresThreeSets?: unknown
  mvpSystem?: unknown
  resultConfirmationMode?: unknown
  manualMatches?: unknown
  scheduleMode?: unknown
  registrationFeeEnabled?: unknown
  registrationFeeAmount?: unknown
  registrationFeePurpose?: unknown
  selfPlayerValue?: unknown
  rosterMode?: unknown
  playerCapacity?: unknown
  calendarMode?: unknown
  availabilityRecommendationsEnabled?: unknown
}

const allowedPlayerCounts = new Set([8, 12, 16])
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function parseUuidArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  const items = value
    .map((item) => validateUuid(item))
    .filter((item): item is string => Boolean(item))

  if (items.length !== value.length || new Set(items).size !== items.length) {
    return null
  }

  return items
}

function parseNewPlayerNames(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  const items = value.map((item) => cleanString(item))

  if (items.some((item) => !item)) {
    return null
  }

  return items
}

function parseRoundWindowMode(value: unknown): RoundWindowMode | null {
  return value === "none" || value === "fixed-days" ? value : null
}


function parseRosterMode(value: unknown): RosterMode | null {
  return value === "fixed" || value === "self_registration" ? value : null
}

function parseCalendarMode(value: unknown): "balanced" | "manual" | null {
  return value === "balanced" || value === "manual" ? value : null
}

function parseCalendarVisibilityMode(
  value: unknown,
): SeasonRoundSettings["calendarVisibilityMode"] | null {
  return value === "full" || value === "progressive" ? value : null
}

function parseScheduleMode(value: unknown): SeasonScheduleMode | null {
  return value === "single" || value === "double" || value === "extended"
    ? value
    : null
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
  if (value === null || value === undefined) {
    return null
  }

  const cleanValue = cleanString(value)

  return dateOnlyPattern.test(cleanValue) ? cleanValue : null
}


function parseOptionalScheduledStart(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const cleanValue = cleanString(value)
  const date = new Date(cleanValue)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function parseOpeningRoundLocation(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string") return undefined
  const location = normalizeScheduleLocationValue(value)
  return location ? createScheduledLeagueLocationValue(location, null) : undefined
}

function parseOptionalPositiveInteger(value: unknown) {
  if (value === null || value === undefined) {
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

function parseOptionalPositiveNumber(value: unknown) {
  if (value === null || value === undefined) {
    return 0
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return null
  }

  return numberValue
}

function parseSelfPlayerValue({
  value,
  validPlayerValues,
}: {
  value: unknown
  validPlayerValues: Set<string>
}) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const cleanValue = cleanString(value)

  return validPlayerValues.has(cleanValue) ? cleanValue : null
}

function parseManualMatches({
  value,
  validPlayerValues,
}: {
  value: unknown
  validPlayerValues: Set<string>
}): ManualCalendarMatchDraft[] | undefined | null {
  if (value === undefined) {
    return undefined
  }

  if (!Array.isArray(value)) {
    return null
  }

  const matches = value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null
      }

      const record = item as Record<string, unknown>
      const round = Number(record.round)
      const teamA = Array.isArray(record.teamA) ? record.teamA : null
      const teamB = Array.isArray(record.teamB) ? record.teamB : null

      if (
        !Number.isInteger(round) ||
        round <= 0 ||
        !teamA ||
        !teamB ||
        teamA.length !== 2 ||
        teamB.length !== 2
      ) {
        return null
      }

      const cleanTeamA = teamA.map((playerId) => cleanString(playerId))
      const cleanTeamB = teamB.map((playerId) => cleanString(playerId))
      const participants = [...cleanTeamA, ...cleanTeamB]

      if (
        participants.some((playerId) => !validPlayerValues.has(playerId)) ||
        new Set(participants).size !== participants.length
      ) {
        return null
      }

      return {
        round,
        teamA: cleanTeamA,
        teamB: cleanTeamB,
      }
    })
    .filter((match): match is ManualCalendarMatchDraft => Boolean(match))

  return matches.length === value.length ? matches : null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params

  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<CreateSeasonBody>(request)
  const name = cleanString(body?.name)
  const playerIds = parseUuidArray(body?.playerIds)
  const newPlayerNames = parseNewPlayerNames(body?.newPlayerNames)
  const appUserIds = parseUuidArray(body?.appUserIds ?? [])
  const roundWindowMode = parseRoundWindowMode(body?.roundWindowMode)
  const scheduleMode = parseScheduleMode(body?.scheduleMode) ?? "single"
  const rosterMode = parseRosterMode(body?.rosterMode) ?? "fixed"
  const calendarMode = parseCalendarMode(body?.calendarMode) ?? "balanced"
  const calendarVisibilityMode = parseCalendarVisibilityMode(body?.calendarVisibilityMode) ?? "full"
  const openingRoundEnabled = body?.openingRoundEnabled === true
  const openingRoundAt = parseOptionalScheduledStart(body?.openingRoundAt)
  const openingRoundLocation = parseOpeningRoundLocation(body?.openingRoundLocation)
  const playerCapacity = Number(body?.playerCapacity)
  const availabilityRecommendationsEnabled =
    typeof body?.availabilityRecommendationsEnabled === "boolean"
      ? body.availabilityRecommendationsEnabled
      : false
  const mvpSystem = parseMvpSystem(body?.mvpSystem)
  const resultConfirmationMode = parseResultConfirmationMode(
    body?.resultConfirmationMode
  )
  const activeSeasonId =
    body?.activeSeasonId === null || body?.activeSeasonId === undefined
      ? null
      : validateUuid(body?.activeSeasonId)
  const requiresThreeSets =
    typeof body?.requiresThreeSets === "boolean" ? body.requiresThreeSets : null
  const registrationFeeEnabled =
    typeof body?.registrationFeeEnabled === "boolean"
      ? body.registrationFeeEnabled
      : false
  const seasonStartsAt =
    roundWindowMode === "fixed-days"
      ? parseOptionalDateOnly(body?.seasonStartsAt)
      : null
  const scheduledStartAt = parseOptionalScheduledStart(body?.scheduledStartAt)
  const preseasonSecretDaysBefore = parseOptionalPreseasonSecretDays(body?.preseasonSecretDaysBefore)
  const roundWindowDays =
    roundWindowMode === "fixed-days"
      ? parseOptionalPositiveInteger(body?.roundWindowDays)
      : null
  const registrationFeeAmount = registrationFeeEnabled
    ? parseOptionalPositiveNumber(body?.registrationFeeAmount)
    : 0
  const registrationFeePurpose = registrationFeeEnabled
    ? cleanString(body?.registrationFeePurpose)
    : ""

  if (
    !name ||
    !playerIds ||
    !newPlayerNames ||
    !appUserIds ||
    !roundWindowMode ||
    !mvpSystem ||
    !resultConfirmationMode ||
    activeSeasonId === undefined ||
    requiresThreeSets === null ||
    scheduledStartAt === undefined ||
    preseasonSecretDaysBefore === undefined ||
    openingRoundAt === undefined ||
    openingRoundLocation === undefined ||
    !allowedPlayerCounts.has(playerCapacity) ||
    (rosterMode === "self_registration" && calendarMode !== "balanced")
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const effectiveOpeningRoundAt =
    openingRoundEnabled && scheduledStartAt ? scheduledStartAt : openingRoundAt

  if (scheduledStartAt && new Date(scheduledStartAt).getTime() <= Date.now()) {
    return NextResponse.json({ error: "scheduled_start_must_be_future" }, { status: 400 })
  }

  if (openingRoundEnabled && (!effectiveOpeningRoundAt || !openingRoundLocation || new Date(effectiveOpeningRoundAt).getTime() <= Date.now())) {
    return NextResponse.json({ error: "opening_round_must_have_future_datetime_and_location" }, { status: 400 })
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
      requestedLocation && leagueLocations.some(
        (location) => getLeagueLocationIdentityKey(location) === getLeagueLocationIdentityKey(requestedLocation),
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

  if (
    registrationFeeAmount === null ||
    (registrationFeeEnabled && !registrationFeePurpose)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const totalPlayers =
    rosterMode === "self_registration"
      ? playerCapacity
      : playerIds.length + appUserIds.length + newPlayerNames.length

  if (
    !allowedPlayerCounts.has(totalPlayers) ||
    (rosterMode === "self_registration" &&
      (newPlayerNames.length > 0 || appUserIds.length > 0 || playerIds.length > playerCapacity))
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const validPlayerValues = new Set<string>([
    ...playerIds,
    ...Array.from({ length: appUserIds.length + newPlayerNames.length }, (_, index) =>
      `__new_player__${index}`,
    ),
  ])
  const validSelfPlayerValues = new Set<string>([
    ...playerIds,
    ...Array.from({ length: newPlayerNames.length }, (_, index) => `__new_player__${index}`),
  ])
  const selfPlayerValue = parseSelfPlayerValue({
    value: body?.selfPlayerValue,
    validPlayerValues: validSelfPlayerValues,
  })
  const manualMatches = parseManualMatches({
    value: body?.manualMatches,
    validPlayerValues,
  })

  if (
    (body && "selfPlayerValue" in body && body.selfPlayerValue && !selfPlayerValue) ||
    manualMatches === null
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  try {
    const result = await createServerSeason({
      actor: access.actor,
      input: {
        leagueId,
        activeSeasonId,
        name,
        playerIds,
        appUserIds,
        newPlayerNames,
        roundWindowMode,
        seasonStartsAt,
        scheduledStartAt,
        preseasonSecretDaysBefore: scheduledStartAt ? preseasonSecretDaysBefore : null,
        calendarVisibilityMode,
        revealedThroughRound: 0,
        openingRoundEnabled,
        openingRoundAt: openingRoundEnabled ? effectiveOpeningRoundAt : null,
        openingRoundLocation: openingRoundEnabled ? openingRoundLocation : null,
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
      },
    })

    const createdSeasonId = result.seasonSnapshot.activeSeasonIds[leagueId] || null

    await recordServerActorActivity({
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: access.actor.membership,
      leagueId,
      seasonId: createdSeasonId,
      type: "season_created",
      title: "Nueva temporada creada",
      description: `${totalPlayers} jugadores · ${result.matches.length} partidos.`,
      metadata: {
        playerCount: totalPlayers,
        existingPlayerIds: playerIds,
        appUserIds,
        newPlayerNames,
        roundWindowMode,
        scheduledStartAt,
        preseasonSecretDaysBefore: scheduledStartAt ? preseasonSecretDaysBefore : null,
        calendarVisibilityMode,
        openingRoundEnabled,
        openingRoundAt: openingRoundEnabled ? effectiveOpeningRoundAt : null,
        openingRoundLocation: openingRoundEnabled ? openingRoundLocation : null,
        scheduleMode,
        totalRounds:
          result.seasonSnapshot.seasons.find((season) => season.id === createdSeasonId)
            ?.totalRounds ?? null,
        mvpSystem,
        resultConfirmationMode,
        registrationFeeEnabled,
        registrationFeeAmount: registrationFeeEnabled ? registrationFeeAmount : 0,
        registrationFeePurpose: registrationFeeEnabled
          ? registrationFeePurpose
          : "",
        rosterMode,
        playerCapacity,
        calendarMode,
        availabilityRecommendationsEnabled,
      },
    }).catch(() => null)

    return NextResponse.json(result)
  } catch (error) {
    if (isSeasonMutationError(error)) {
      const body: { error: string; message?: string } = {
        error: error.code,
      }

      if (error.message && error.message !== error.code) {
        body.message = error.message
      }

      return NextResponse.json(body, { status: error.status })
    }

    return NextResponse.json({ error: "season_create_failed" }, { status: 500 })
  }
}
