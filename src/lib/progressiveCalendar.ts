import type { MatchData } from "@/context/MatchDataProvider"
import type { SeasonRoundSettings } from "@/context/SeasonSettingsProvider"
import { isMatchCompetitionComplete } from "@/lib/matchLifecycle"
import { normalizeScheduledStartAt } from "@/lib/seasonScheduling"

export type CalendarVisibilityMode = "full" | "progressive"

export type RoundTimingSettings = Pick<
  SeasonRoundSettings,
  "openingRoundEnabled" | "openingRoundAt" | "roundWindowMode" | "seasonStartsAt" | "roundWindowDays"
>

export type ProgressiveCalendarSettings = RoundTimingSettings & Pick<
  SeasonRoundSettings,
  "calendarVisibilityMode" | "revealedThroughRound"
>

export function normalizeCalendarVisibilityMode(value: unknown): CalendarVisibilityMode {
  return value === "progressive" ? "progressive" : "full"
}

export function normalizeRevealedThroughRound(value: unknown) {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric > 0 ? numeric : 0
}

function parseDateTime(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function addDateOnlyDays(value: string, days: number) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + days))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

function parseMadridDateStart(value: string, days: number) {
  const dateOnly = addDateOnlyDays(value, days)
  if (!dateOnly) return null
  const normalized = normalizeScheduledStartAt(`${dateOnly}T00:00`)
  return normalized ? new Date(normalized) : null
}

export function getOfficialRoundStart({
  round,
  settings,
}: {
  round: number
  settings: RoundTimingSettings
}) {
  if (round < 1) return null

  if (settings.openingRoundEnabled && round === 1) {
    return settings.openingRoundAt ? parseDateTime(settings.openingRoundAt) : null
  }

  if (
    settings.roundWindowMode !== "fixed-days" ||
    !settings.seasonStartsAt ||
    !settings.roundWindowDays ||
    settings.roundWindowDays < 1
  ) {
    return null
  }

  const regularRoundIndex = settings.openingRoundEnabled ? round - 2 : round - 1
  if (regularRoundIndex < 0) return null

  return parseMadridDateStart(
    settings.seasonStartsAt,
    regularRoundIndex * settings.roundWindowDays,
  )
}

export function getHighestContiguousCompletedRound({
  matches,
  totalRounds,
}: {
  matches: MatchData[]
  totalRounds: number
}) {
  let completedThrough = 0
  for (let round = 1; round <= totalRounds; round += 1) {
    const roundMatches = matches.filter((match) => match.round === round)
    if (!roundMatches.length || !roundMatches.every(isMatchCompetitionComplete)) break
    completedThrough = round
  }
  return completedThrough
}

export function getOfficiallyStartedThroughRound({
  totalRounds,
  settings,
  now = new Date(),
}: {
  totalRounds: number
  settings: RoundTimingSettings
  now?: Date
}) {
  let startedThrough = 0
  const nowTime = now.getTime()
  for (let round = 1; round <= totalRounds; round += 1) {
    const startsAt = getOfficialRoundStart({ round, settings })
    if (!startsAt) continue
    if (startsAt.getTime() <= nowTime) startedThrough = Math.max(startedThrough, round)
  }
  return startedThrough
}

export function getEffectiveRevealedThroughRound({
  seasonStatus,
  totalRounds,
  settings,
  matches,
  now = new Date(),
}: {
  seasonStatus: "upcoming" | "active" | "finished"
  totalRounds: number
  settings: ProgressiveCalendarSettings
  matches: MatchData[]
  now?: Date
}) {
  if (settings.calendarVisibilityMode !== "progressive" || seasonStatus === "finished") {
    return totalRounds
  }

  const stored = Math.min(totalRounds, normalizeRevealedThroughRound(settings.revealedThroughRound))
  if (seasonStatus === "upcoming") return stored

  const completedThrough = getHighestContiguousCompletedRound({ matches, totalRounds })
  const revealedByCompletion = completedThrough > 0
    ? Math.min(totalRounds, completedThrough + 1)
    : 1
  const revealedByDate = getOfficiallyStartedThroughRound({ totalRounds, settings, now })
  return Math.min(totalRounds, Math.max(1, stored, revealedByCompletion, revealedByDate))
}

export function isRoundRevealedToPlayers({
  round,
  seasonStatus,
  totalRounds,
  settings,
  matches,
  now = new Date(),
}: {
  round: number
  seasonStatus: "upcoming" | "active" | "finished"
  totalRounds: number
  settings: ProgressiveCalendarSettings
  matches: MatchData[]
  now?: Date
}) {
  return round <= getEffectiveRevealedThroughRound({
    seasonStatus,
    totalRounds,
    settings,
    matches,
    now,
  })
}

export function redactProgressiveMatch(match: MatchData): MatchData {
  return {
    ...match,
    teamA: [],
    teamB: [],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: null,
    dateLabel: null,
    location: null,
    resultRecordedAt: null,
    resultReportedByPlayerId: null,
    resultLocked: false,
    coordinationStatus: null,
    incidentType: null,
    incidentStatus: null,
    incidentReason: null,
    incidentNotes: null,
    incidentCreatedAt: null,
    incidentResolvedAt: null,
    resolutionType: null,
    substitutions: [],
    courtBooking: {
      isReserved: false,
      reservations: [],
      ballPurchases: [],
      transfers: [],
      updatedAt: null,
    },
  }
}
