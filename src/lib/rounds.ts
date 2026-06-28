import type { MatchData } from "@/context/MatchDataProvider"
import type { SeasonRoundSettings } from "@/context/SeasonSettingsProvider"

type Season = {
  id: string
  leagueId: string
  totalRounds: number
}

export type SeasonRoundStatus =
  | "no-window"
  | "upcoming"
  | "active"
  | "overdue"
  | "completed"

export type SeasonRound = {
  id: string
  leagueId: string
  seasonId: string
  round: number
  name: string
  startsAt: string | null
  endsAt: string | null
  status: SeasonRoundStatus
}

function parseLocalDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number)

  return new Date(year, month - 1, day)
}

function parseLocalDateTime(dateTimeValue: string) {
  const [datePart, timePart = "00:00"] = dateTimeValue.split("T")
  const [year, month, day] = datePart.split("-").map(Number)
  const [hours, minutes] = timePart.split(":").map(Number)

  return new Date(year, month - 1, day, hours, minutes)
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")

  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)

  return result
}

function endOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)

  return result
}

function getRoundWindow({
  round,
  settings,
}: {
  round: number
  settings: SeasonRoundSettings
}) {
  if (
    settings.roundWindowMode !== "fixed-days" ||
    !settings.seasonStartsAt ||
    !settings.roundWindowDays ||
    settings.roundWindowDays < 1
  ) {
    return {
      startsAt: null,
      endsAt: null,
    }
  }

  const seasonStart = parseLocalDate(settings.seasonStartsAt)
  const startsAt = addDays(seasonStart, (round - 1) * settings.roundWindowDays)
  const endsAt = addDays(startsAt, settings.roundWindowDays - 1)

  return {
    startsAt: formatDateValue(startsAt),
    endsAt: formatDateValue(endsAt),
  }
}

function getRoundStatus({
  round,
  matches,
  startsAt,
  endsAt,
}: {
  round: number
  matches: MatchData[]
  startsAt: string | null
  endsAt: string | null
}): SeasonRoundStatus {
  const roundMatches = matches.filter((match) => match.round === round)
  const hasMatches = roundMatches.length > 0
  const isCompleted =
    hasMatches && roundMatches.every((match) => match.status === "finished")

  if (isCompleted) {
    return "completed"
  }

  if (!startsAt || !endsAt) {
    return "no-window"
  }

  const today = new Date()
  const startDate = parseLocalDate(startsAt)
  const endDate = endOfDay(parseLocalDate(endsAt))

  if (today < startDate) {
    return "upcoming"
  }

  if (today > endDate) {
    return "overdue"
  }

  return "active"
}

export function buildSeasonRounds({
  season,
  settings,
  matches,
}: {
  season: Season
  settings: SeasonRoundSettings
  matches: MatchData[]
}) {
  return Array.from({ length: season.totalRounds }, (_, index) => {
    const round = index + 1
    const { startsAt, endsAt } = getRoundWindow({ round, settings })
    const status = getRoundStatus({
      round,
      matches,
      startsAt,
      endsAt,
    })

    return {
      id: `${season.id}-round-${round}`,
      leagueId: season.leagueId,
      seasonId: season.id,
      round,
      name: `Jornada ${round}`,
      startsAt,
      endsAt,
      status,
    }
  })
}

export function formatShortDate(dateValue: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(parseLocalDate(dateValue))
}

export function isDateTimeInsideRoundWindow({
  dateTimeValue,
  startsAt,
  endsAt,
}: {
  dateTimeValue: string
  startsAt: string | null
  endsAt: string | null
}) {
  if (!startsAt || !endsAt || !dateTimeValue) {
    return true
  }

  const dateTime = parseLocalDateTime(dateTimeValue)
  const startDate = parseLocalDate(startsAt)
  const endDate = endOfDay(parseLocalDate(endsAt))

  return dateTime >= startDate && dateTime <= endDate
}