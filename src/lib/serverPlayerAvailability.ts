import "server-only"

import {
  normalizeDateAvailabilityOverrides,
  normalizeWeeklyAvailability,
  weekdayIds,
  type AvailabilitySlot,
  type DateAvailabilityOverrides,
  type PlayerAvailability,
  type WeeklyAvailability,
} from "@/lib/playerAvailability"
import { validateUuid } from "@/lib/serverRequest"

type PlayerAvailabilityRow = {
  league_id: string
  season_id: string
  player_id: string
  timezone: string | null
  weekly_slots: unknown
  date_overrides: unknown
  updated_at: string | null
}

type UpsertPlayerAvailabilityBody = {
  seasonId?: unknown
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

export function mapPlayerAvailabilityRow(
  row: PlayerAvailabilityRow
): PlayerAvailability {
  return {
    leagueId: row.league_id,
    seasonId: row.season_id,
    playerId: row.player_id,
    userId: null,
    timezone: row.timezone ?? "Europe/Madrid",
    weeklySlots: normalizeWeeklyAvailability(row.weekly_slots),
    dateOverrides: normalizeDateAvailabilityOverrides(row.date_overrides),
    updatedAt: row.updated_at,
  }
}

export function parsePlayerAvailabilityUpsert(
  body: UpsertPlayerAvailabilityBody | null
):
  | {
      ok: true
      seasonId: string
      timezone: string
      weeklySlots: WeeklyAvailability
      dateOverrides: DateAvailabilityOverrides
    }
  | { ok: false; error: string } {
  const seasonId = validateUuid(body?.seasonId)

  if (!seasonId) {
    return { ok: false, error: "invalid_season_id" }
  }

  if (!isValidWeeklyAvailability(body?.weeklySlots)) {
    return { ok: false, error: "invalid_weekly_slots" }
  }

  if (!isValidDateAvailabilityOverrides(body?.dateOverrides)) {
    return { ok: false, error: "invalid_date_overrides" }
  }

  const timezone = normalizeTimezone(body?.timezone)

  if (!timezone) {
    return { ok: false, error: "invalid_timezone" }
  }

  return {
    ok: true,
    seasonId,
    timezone,
    weeklySlots: normalizeWeeklyAvailability(body.weeklySlots),
    dateOverrides: normalizeDateAvailabilityOverrides(body.dateOverrides),
  }
}
