export type SeasonLifecycleStatus = "upcoming" | "active" | "finished"

export type SeasonCountdown = {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isDue: boolean
}

export const SCHEDULED_SEASON_TIME_ZONE = "Europe/Madrid"
const hourMs = 3_600_000
const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
const timeZoneSuffixPattern = /(Z|[+-]\d{2}:?\d{2})$/i
const madridPartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SCHEDULED_SEASON_TIME_ZONE,
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
})

function madridParts(date: Date) {
  const parts = Object.fromEntries(madridPartsFormatter.formatToParts(date).map((part) => [part.type, part.value]))
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second) }
}

function madridOffsetMs(date: Date) {
  const instantMs = Math.floor(date.getTime() / 1000) * 1000
  const parts = madridParts(new Date(instantMs))
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - instantMs
}

function parseMadridLocalDateTime(value: string) {
  const match = value.trim().match(localDateTimePattern)
  if (!match) return null
  const [, year, month, day, hour, minute, second = "00"] = match
  const wanted = { year: Number(year), month: Number(month), day: Number(day), hour: Number(hour), minute: Number(minute), second: Number(second) }
  const wallUtc = Date.UTC(wanted.year, wanted.month - 1, wanted.day, wanted.hour, wanted.minute, wanted.second)
  const offsets = new Set([-36 * hourMs, 0, 36 * hourMs].map((delta) => madridOffsetMs(new Date(wallUtc + delta))))
  const candidates = [...offsets].map((offset) => new Date(wallUtc - offset)).filter((candidate) => {
    const actual = madridParts(candidate)
    return Object.keys(wanted).every((key) => actual[key as keyof typeof actual] === wanted[key as keyof typeof wanted])
  })
  return candidates.length === 1 ? candidates[0] : null
}

function formatMadridDateTimeInput(date: Date) {
  const parts = madridParts(date)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

export function normalizeScheduledStartAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null
  const cleanValue = value.trim()
  const date = timeZoneSuffixPattern.test(cleanValue) ? new Date(cleanValue) : parseMadridLocalDateTime(cleanValue)
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null
}


export type ScheduledSeasonHomeStage = "roster" | "registration" | "countdown"

export function getScheduledSeasonHomeStage({
  isRosterComplete,
  registrationEnabled,
  registrationSettled,
}: {
  isRosterComplete: boolean
  registrationEnabled: boolean
  registrationSettled: boolean
}): ScheduledSeasonHomeStage {
  if (!isRosterComplete) return "roster"
  if (registrationEnabled && !registrationSettled) return "registration"
  return "countdown"
}

export function isScheduledSeasonHomeLocked(status: SeasonLifecycleStatus, scheduledStartAt: string | null | undefined, canBypassLock: boolean) {
  return Boolean(status === "upcoming" && normalizeScheduledStartAt(scheduledStartAt) && !canBypassLock)
}

export function isScheduledSeasonPending(status: SeasonLifecycleStatus, scheduledStartAt: string | null | undefined, now = Date.now()) {
  const normalized = normalizeScheduledStartAt(scheduledStartAt)
  return Boolean(status === "upcoming" && normalized && new Date(normalized).getTime() > now)
}

export function isScheduledSeasonDue(status: SeasonLifecycleStatus, scheduledStartAt: string | null | undefined, now = Date.now()) {
  const normalized = normalizeScheduledStartAt(scheduledStartAt)
  return Boolean(status === "upcoming" && normalized && new Date(normalized).getTime() <= now)
}

export function getEffectiveSeasonStatus(status: SeasonLifecycleStatus, scheduledStartAt: string | null | undefined, now = Date.now()): SeasonLifecycleStatus {
  return isScheduledSeasonDue(status, scheduledStartAt, now) ? "active" : status
}

export function getSeasonCountdown(scheduledStartAt: string | null | undefined, now = Date.now()): SeasonCountdown | null {
  const normalized = normalizeScheduledStartAt(scheduledStartAt)
  if (!normalized) return null
  const totalMs = new Date(normalized).getTime() - now
  const remainingMs = Math.max(0, totalMs)
  return {
    totalMs,
    days: Math.floor(remainingMs / 86_400_000),
    hours: Math.floor((remainingMs % 86_400_000) / hourMs),
    minutes: Math.floor((remainingMs % hourMs) / 60_000),
    seconds: Math.floor((remainingMs % 60_000) / 1_000),
    isDue: totalMs <= 0,
  }
}

export function formatScheduledSeasonStart(scheduledStartAt: string | null | undefined) {
  const normalized = normalizeScheduledStartAt(scheduledStartAt)
  if (!normalized) return null
  const date = new Date(normalized)
  const dateLabel = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(date)
  const timeLabel = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(date)
  return `${dateLabel.charAt(0).toLocaleUpperCase("es-ES")}${dateLabel.slice(1)} · ${timeLabel}`
}

export function toDatetimeLocalValue(value: string | null | undefined) {
  const normalized = normalizeScheduledStartAt(value)
  return normalized ? formatMadridDateTimeInput(new Date(normalized)) : ""
}

export function datetimeLocalToIso(value: string) {
  return normalizeScheduledStartAt(value)
}

export function formatNextScheduledStartForInput(now = new Date()) {
  let nextHour = new Date(Math.floor(now.getTime() / hourMs) * hourMs + hourMs)
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const value = formatMadridDateTimeInput(nextHour)
    if (datetimeLocalToIso(value)) return value
    nextHour = new Date(nextHour.getTime() + hourMs)
  }
  return ""
}
