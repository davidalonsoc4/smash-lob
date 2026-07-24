import {
  createEmptyWeeklyAvailability,
  normalizeWeeklyAvailability,
  type WeeklyAvailability,
} from "@/lib/playerAvailability"

export type AccountProfile = {
  firstName: string
  lastName: string
  displayName: string
  profileCompletedAt: string | null
  availabilityCompletedAt: string | null
  standardAvailabilityTimezone: string
  standardAvailabilityWeeklySlots: WeeklyAvailability
  isComplete: boolean
  isSuperuser: boolean
}

const PROFILE_NAME_LOCALE = "es-ES"

export function formatProfileName(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ").toLocaleLowerCase(PROFILE_NAME_LOCALE)

  return normalized.replace(
    /(^|[\s'’\-])([\p{L}])/gu,
    (_, separator: string, letter: string) =>
      `${separator}${letter.toLocaleUpperCase(PROFILE_NAME_LOCALE)}`,
  )
}

export function splitGoogleDisplayName(value: string | null | undefined) {
  const parts = (value ?? "").trim().split(/\s+/).filter(Boolean)

  return {
    firstName: formatProfileName(parts[0] ?? ""),
    lastName: formatProfileName(parts[1] ?? ""),
  }
}

export function normalizeProfileName(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? formatProfileName(value).slice(0, maxLength)
    : ""
}

export function normalizeAccountStandardAvailability(value: unknown) {
  return value
    ? normalizeWeeklyAvailability(value)
    : createEmptyWeeklyAvailability()
}
