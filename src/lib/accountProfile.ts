export type AccountProfile = {
  firstName: string
  lastName: string
  displayName: string
  profileCompletedAt: string | null
  isComplete: boolean
  isSuperuser: boolean
}

export function splitGoogleDisplayName(value: string | null | undefined) {
  const parts = (value ?? "").trim().split(/\s+/).filter(Boolean)

  return {
    firstName: parts[0] ?? "",
    lastName: parts[1] ?? "",
  }
}

export function normalizeProfileName(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : ""
}
