import { getPublicAppBaseUrl } from "@/lib/appUrl"

export { getPublicAppBaseUrl }

export function getPublicInviteUrl(inviteCode: string, request?: Request) {
  const inviteUrl = new URL(
    `/invite/${encodeURIComponent(normalizeInviteCode(inviteCode))}`,
    getPublicAppBaseUrl(request),
  )

  return inviteUrl.toString()
}

export function getPublicSpectatorUrl(spectatorCode: string, request?: Request) {
  const spectatorUrl = new URL(
    `/spectate/${encodeURIComponent(spectatorCode.trim())}`,
    getPublicAppBaseUrl(request),
  )

  return spectatorUrl.toString()
}

export function normalizeInviteCode(value: string) {
  return extractInviteCode(value).trim().toUpperCase()
}

/** Tournament tokens are case-sensitive; league codes retain their existing normalization. */
export function getCompetitionInvitePath(value: string): string | null {
  const input = value.trim()
  if (!input) return null
  try {
    const path = /^https?:\/\//i.test(input) ? new URL(input).pathname : input
    const tournament = path.match(/^\/tournament-invite\/([^/?#]+)\/?(?:[?#].*)?$/)
    const token = tournament ? decodeURIComponent(tournament[1]) : input
    if (/^[A-Za-z0-9_-]{43}$/.test(token)) return `/tournament-invite/${encodeURIComponent(token)}`
    if (tournament || /tournament-invite/i.test(path)) return null
    const code = normalizeInviteCode(input)
    return /^[A-Z0-9_-]+$/.test(code) ? `/invite/${encodeURIComponent(code)}` : null
  } catch {
    return null
  }
}

export function extractInviteCode(value: string) {
  const cleanValue = value.trim()

  if (!cleanValue) {
    return ""
  }

  try {
    const parsedUrl = new URL(cleanValue)
    const inviteMatch = parsedUrl.pathname.match(/\/invite\/([^/?#]+)/i)

    if (inviteMatch?.[1]) {
      return decodeURIComponent(inviteMatch[1])
    }
  } catch {
    // Not a URL; treat it as a raw invite code below.
  }

  const inviteMatch = cleanValue.match(/\/invite\/([^/?#]+)/i)

  if (inviteMatch?.[1]) {
    return decodeURIComponent(inviteMatch[1])
  }

  return cleanValue
}
