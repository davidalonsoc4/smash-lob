export const PENDING_ACCESS_INTENT_COOKIE = "smash-lob-pending-access-intent"
export const PENDING_ACCESS_INTENT_MAX_AGE_SECONDS = 3 * 24 * 60 * 60

const accessPathPattern = /^\/(?:invite|spectate)\/[^/]+$/
const maxDestinationLength = 700

export type PendingAccessIntentKind = "invite" | "spectate"

export function normalizePendingAccessDestination(value: string | null | undefined) {
  const candidate = value?.trim()

  if (!candidate || candidate.length > maxDestinationLength) {
    return null
  }

  try {
    const parsed = new URL(candidate, "https://smash-lob.invalid")

    if (
      parsed.origin !== "https://smash-lob.invalid" ||
      !accessPathPattern.test(parsed.pathname) ||
      parsed.hash
    ) {
      return null
    }

    return `${parsed.pathname}${parsed.search}`
  } catch {
    return null
  }
}

export function encodePendingAccessDestination(value: string) {
  return normalizePendingAccessDestination(value)
}

export function decodePendingAccessDestination(value: string | null | undefined) {
  if (!value) {
    return null
  }

  try {
    return normalizePendingAccessDestination(decodeURIComponent(value))
  } catch {
    return null
  }
}

export function getPendingAccessIntentKind(
  destination: string,
): PendingAccessIntentKind | null {
  const normalized = normalizePendingAccessDestination(destination)

  if (normalized?.startsWith("/invite/")) {
    return "invite"
  }

  if (normalized?.startsWith("/spectate/")) {
    return "spectate"
  }

  return null
}
