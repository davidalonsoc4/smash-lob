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
