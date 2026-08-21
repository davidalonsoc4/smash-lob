import type { MatchData } from "@/context/MatchDataProvider"
import {
  findLeagueLocationByScheduleLocation,
  getLeagueLocationCalendarText,
  getLeagueLocationIdentityKey,
  getLeagueLocationOptionLabel,
  normalizeLeagueLocation,
  type LeagueLocation,
} from "@/lib/leagueLocations"
import { normalizeScheduledStartAt, SCHEDULED_SEASON_TIME_ZONE, type SeasonLifecycleStatus } from "@/lib/seasonScheduling"

export type PreseasonAccessPhase = "inactive" | "locked" | "secrets" | "active"

export type PreseasonOpening = {
  round: 1
  startsAt: string
  endsAt: string
  locationLabel: string
  calendarLocation: string
  matchCount: number
}

const matchDurationMs = 120 * 60 * 1000
const maxSecretDays = 90
const madridDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCHEDULED_SEASON_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export function normalizePreseasonSecretDaysBefore(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maxSecretDays) return null
  return parsed
}

export function getPreseasonAccessPhase({
  status,
  scheduledStartAt,
  secretDaysBefore,
  now = Date.now(),
}: {
  status: SeasonLifecycleStatus
  scheduledStartAt: string | null | undefined
  secretDaysBefore: number | null | undefined
  now?: number
}): PreseasonAccessPhase {
  const startIso = normalizeScheduledStartAt(scheduledStartAt)
  if (status !== "upcoming") return status === "active" ? "active" : "inactive"
  if (!startIso) return "inactive"

  const startsAtMs = new Date(startIso).getTime()
  if (startsAtMs <= now) return "active"

  const secretDays = normalizePreseasonSecretDaysBefore(secretDaysBefore)
  if (!secretDays) return "locked"
  const secretStartsAtMs = startsAtMs - secretDays * 86_400_000
  return now >= secretStartsAtMs ? "secrets" : "locked"
}

function stripLegacyCourtSuffix(value: string) {
  return value.replace(/\s*(?:·|\s-\s)\s*Pista\s+\d+\s*$/i, "").trim()
}

export function getSafePreseasonLocation({
  scheduleLocation,
  leagueLocations,
}: {
  scheduleLocation: string | null | undefined
  leagueLocations: LeagueLocation[]
}) {
  if (!scheduleLocation?.trim()) return null

  const catalogLocation = findLeagueLocationByScheduleLocation({
    locations: leagueLocations,
    scheduleLocation,
  })
  const normalized = catalogLocation ?? normalizeLeagueLocation(scheduleLocation)

  if (normalized) {
    const safeLocation: LeagueLocation = { ...normalized, selectedCourt: null }
    return {
      key: getLeagueLocationIdentityKey(safeLocation),
      label: getLeagueLocationOptionLabel(safeLocation),
      calendarLocation:
        getLeagueLocationCalendarText(safeLocation) ?? getLeagueLocationOptionLabel(safeLocation),
      storedValue: JSON.stringify(safeLocation),
    }
  }

  const fallback = stripLegacyCourtSuffix(scheduleLocation)
  if (!fallback) return null
  return {
    key: `legacy:${fallback.toLocaleLowerCase("es-ES")}`,
    label: fallback,
    calendarLocation: fallback,
    storedValue: fallback,
  }
}

export function detectPreseasonOpening({
  matches,
  leagueLocations,
}: {
  matches: Pick<MatchData, "round" | "scheduledAt" | "location">[]
  leagueLocations: LeagueLocation[]
}): PreseasonOpening | null {
  const roundOne = matches.filter((match) => match.round === 1)
  if (!roundOne.length) return null

  const entries = roundOne.map((match) => {
    if (!match.scheduledAt) return null
    const start = new Date(match.scheduledAt)
    if (Number.isNaN(start.getTime())) return null
    const location = getSafePreseasonLocation({
      scheduleLocation: match.location,
      leagueLocations,
    })
    if (!location) return null
    return { start, location }
  })

  if (entries.some((entry) => !entry)) return null
  const resolved = entries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  const firstDate = madridDateFormatter.format(resolved[0].start)
  const firstLocationKey = resolved[0].location.key
  if (
    resolved.some(
      (entry) =>
        madridDateFormatter.format(entry.start) !== firstDate ||
        entry.location.key !== firstLocationKey,
    )
  ) {
    return null
  }

  const firstStartMs = Math.min(...resolved.map((entry) => entry.start.getTime()))
  const lastEndMs = Math.max(...resolved.map((entry) => entry.start.getTime() + matchDurationMs))
  const safeLocation = resolved[0].location

  return {
    round: 1,
    startsAt: new Date(firstStartMs).toISOString(),
    endsAt: new Date(lastEndMs).toISOString(),
    locationLabel: safeLocation.label,
    calendarLocation: safeLocation.calendarLocation,
    matchCount: resolved.length,
  }
}

export function redactPreseasonMatch({
  match,
  phase,
  leagueLocations,
}: {
  match: MatchData
  phase: PreseasonAccessPhase
  leagueLocations: LeagueLocation[]
}): MatchData {
  const exposeOpeningSchedule = phase === "secrets" && match.round === 1
  const safeLocation = exposeOpeningSchedule
    ? getSafePreseasonLocation({ scheduleLocation: match.location, leagueLocations })
    : null

  return {
    ...match,
    teamA: [],
    teamB: [],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: exposeOpeningSchedule ? match.scheduledAt : null,
    dateLabel: exposeOpeningSchedule ? match.dateLabel : null,
    location: exposeOpeningSchedule ? safeLocation?.storedValue ?? null : null,
    resultRecordedAt: null,
    resultReportedByPlayerId: null,
    resultLocked: false,
    rankingCounts: false,
    resultCounts: false,
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
