import {
  createEmptyWeeklyAvailability,
  normalizeWeeklyAvailability,
  type WeeklyAvailability,
} from "@/lib/playerAvailability"

export type PreferredPlayerSide = "drive" | "reves" | "versatile"
export type DominantHand = "right" | "left"

export type AccountProfile = {
  firstName: string
  lastName: string
  displayName: string
  avatarUrl: string | null
  preferredSide: PreferredPlayerSide | null
  dominantHand: DominantHand | null
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

export function normalizePreferredPlayerSide(value: unknown): PreferredPlayerSide | null {
  return value === "drive" || value === "reves" || value === "versatile" ? value : null
}

export function getPreferredPlayerSideLabel(value: PreferredPlayerSide | null | undefined) {
  if (value === "drive") return "Drive"
  if (value === "reves") return "Revés"
  return value === "versatile" ? "Versátil" : null
}

export function normalizeDominantHand(value: unknown): DominantHand | null {
  return value === "right" || value === "left" ? value : null
}

export function getDominantHandLabel(value: DominantHand | null | undefined) {
  if (value === "right") return "Diestro"
  return value === "left" ? "Zurdo" : null
}

export function getPlayerSideAndHandLabel(
  side: PreferredPlayerSide | null | undefined,
  hand: DominantHand | null | undefined,
) {
  const sideLabel = getPreferredPlayerSideLabel(side)
  if (!sideLabel) return null
  const handLabel = getDominantHandLabel(hand)
  return `${sideLabel}${handLabel ? ` ${handLabel}` : ""}`.toLocaleUpperCase("es-ES")
}
