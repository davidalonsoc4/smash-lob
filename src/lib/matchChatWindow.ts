export const MATCH_CHAT_TIME_ZONE = "Europe/Madrid"
export const PERSONAL_MATCH_CHAT_RETENTION_MONTHS = 2

type MatchChatWindowInput = {
  status: string
  resultRecordedAt?: string | null
}

type CalendarDateParts = {
  year: number
  month: number
  day: number
}

const zonedDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MATCH_CHAT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

function parseResultRecordedAt(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getZonedParts(date: Date) {
  const values = new Map(
    zonedDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  )

  return {
    year: values.get("year") ?? 0,
    month: values.get("month") ?? 0,
    day: values.get("day") ?? 0,
    hour: values.get("hour") ?? 0,
    minute: values.get("minute") ?? 0,
    second: values.get("second") ?? 0,
  }
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = getZonedParts(date)
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  const dateWithoutMilliseconds = Math.trunc(date.getTime() / 1000) * 1000
  return representedAsUtc - dateWithoutMilliseconds
}

function toUtcAtMadridMidnight({ year, month, day }: CalendarDateParts) {
  const nominalUtc = new Date(Date.UTC(year, month - 1, day))
  let offset = getTimeZoneOffsetMs(nominalUtc)
  let candidate = new Date(nominalUtc.getTime() - offset)

  const refinedOffset = getTimeZoneOffsetMs(candidate)
  if (refinedOffset !== offset) {
    offset = refinedOffset
    candidate = new Date(nominalUtc.getTime() - offset)
  }

  return candidate
}

function addCalendarDays({ year, month, day }: CalendarDateParts, days: number) {
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  }
}

export function getMatchChatWriteUntil({
  status,
  resultRecordedAt,
}: MatchChatWindowInput) {
  if (status !== "finished" && !resultRecordedAt) return null

  const resultDate = parseResultRecordedAt(resultRecordedAt)
  if (!resultDate) return null

  const resultDay = getZonedParts(resultDate)
  return toUtcAtMadridMidnight(
    addCalendarDays(
      {
        year: resultDay.year,
        month: resultDay.month,
        day: resultDay.day,
      },
      2,
    ),
  )
}

export function isMatchChatReadOnly({
  status,
  resultRecordedAt,
  now = new Date(),
}: MatchChatWindowInput & { now?: Date }) {
  if (status !== "finished" && !resultRecordedAt) return false

  const writeUntil = getMatchChatWriteUntil({ status, resultRecordedAt })
  if (!writeUntil) return true

  return now.getTime() >= writeUntil.getTime()
}

export function getPersonalMatchChatDeleteAfter({
  status,
  resultRecordedAt,
}: MatchChatWindowInput) {
  if (status !== "finished" && !resultRecordedAt) return null

  const resultDate = parseResultRecordedAt(resultRecordedAt)
  if (!resultDate) return null

  const deleteAfter = new Date(resultDate)
  deleteAfter.setUTCMonth(
    deleteAfter.getUTCMonth() + PERSONAL_MATCH_CHAT_RETENTION_MONTHS,
  )
  return deleteAfter
}

export function isPersonalMatchChatExpired({
  status,
  resultRecordedAt,
  now = new Date(),
}: MatchChatWindowInput & { now?: Date }) {
  const deleteAfter = getPersonalMatchChatDeleteAfter({
    status,
    resultRecordedAt,
  })
  return Boolean(deleteAfter && now.getTime() >= deleteAfter.getTime())
}
