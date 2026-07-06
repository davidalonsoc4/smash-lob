const defaultPublicAppUrl = "https://smash-lob.vercel.app"

export function getPublicAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
    defaultPublicAppUrl
  )
}

export function getPublicInviteUrl(
  inviteCode: string,
  options?: { leagueId?: string | null }
) {
  const inviteUrl = new URL(
    `${getPublicAppBaseUrl()}/invite/${encodeURIComponent(
      normalizeInviteCode(inviteCode)
    )}`
  )

  const leagueId = options?.leagueId?.trim()

  if (leagueId) {
    inviteUrl.searchParams.set("leagueId", leagueId)
  }

  return inviteUrl.toString()
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
