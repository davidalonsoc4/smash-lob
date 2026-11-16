import "server-only"

import {
  normalizeDateAvailabilityOverrides,
  normalizeWeeklyAvailability,
  weekdayIds,
  type AvailabilitySlot,
  type DateAvailabilityOverrides,
  type WeeklyAvailability,
} from "@/lib/playerAvailability"

type UpsertProfileAvailabilityBody = {
  timezone?: unknown
  weeklySlots?: unknown
  dateOverrides?: unknown
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number)

  return hours * 60 + minutes
}

function isValidAvailabilitySlot(value: unknown): value is AvailabilitySlot {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.start !== "string" || typeof value.end !== "string") {
    return false
  }

  return (
    timePattern.test(value.start) &&
    timePattern.test(value.end) &&
    toMinutes(value.end) > toMinutes(value.start)
  )
}

function isValidAvailabilitySlotList(value: unknown) {
  return Array.isArray(value) && value.every((slot) => isValidAvailabilitySlot(slot))
}

function isValidWeeklyAvailability(value: unknown): value is WeeklyAvailability {
  if (!isRecord(value)) {
    return false
  }

  return weekdayIds.every((weekdayId) => {
    const weekdaySlots = value[weekdayId]

    return typeof weekdaySlots === "undefined" || isValidAvailabilitySlotList(weekdaySlots)
  })
}

function isValidDateAvailabilityOverrides(
  value: unknown
): value is DateAvailabilityOverrides {
  if (!isRecord(value)) {
    return false
  }

  return Object.entries(value).every(
    ([date, slots]) => datePattern.test(date) && isValidAvailabilitySlotList(slots)
  )
}

function normalizeTimezone(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const timezone = value.trim()

  if (!timezone || timezone.length > 100) {
    return null
  }

  return timezone
}

/** A player availability source: the linked account first, otherwise the player profile. */
export type AvailabilitySource = {
  timezone: string | null | undefined
  weeklySlots: unknown
  dateOverrides: unknown
  updatedAt?: string | null
}

export function hasAvailabilityContent(source: AvailabilitySource) {
  const hasSlots = (value: unknown) =>
    isRecord(value) && Object.values(value).some((slots) => Array.isArray(slots) && slots.length > 0)

  return hasSlots(source.weeklySlots) || hasSlots(source.dateOverrides)
}

export function mapProfileAvailability({
  leagueId,
  seasonId,
  playerId,
  userId,
  source,
}: {
  leagueId: string
  seasonId: string
  playerId: string
  userId: string | null
  source: AvailabilitySource
}) {
  return {
    leagueId,
    seasonId,
    playerId,
    userId,
    timezone: source.timezone || "Europe/Madrid",
    weeklySlots: normalizeWeeklyAvailability(source.weeklySlots),
    dateOverrides: normalizeDateAvailabilityOverrides(source.dateOverrides),
    updatedAt: source.updatedAt ?? null,
  }
}

export function parseProfileAvailabilityUpsert(
  body: UpsertProfileAvailabilityBody | null
):
  | {
      ok: true
      timezone: string
      weeklySlots: WeeklyAvailability
      dateOverrides: DateAvailabilityOverrides | null
    }
  | { ok: false; error: string } {
  if (!isValidWeeklyAvailability(body?.weeklySlots)) {
    return { ok: false, error: "invalid_weekly_slots" }
  }

  const hasOverrides = typeof body?.dateOverrides !== "undefined"

  if (hasOverrides && !isValidDateAvailabilityOverrides(body?.dateOverrides)) {
    return { ok: false, error: "invalid_date_overrides" }
  }

  const timezone = normalizeTimezone(body?.timezone)

  if (!timezone) {
    return { ok: false, error: "invalid_timezone" }
  }

  return {
    ok: true,
    timezone,
    weeklySlots: normalizeWeeklyAvailability(body?.weeklySlots),
    dateOverrides: hasOverrides ? normalizeDateAvailabilityOverrides(body?.dateOverrides) : null,
  }
}
