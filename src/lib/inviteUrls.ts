const defaultPublicAppUrl = "https://smash-lob.vercel.app"

export function getPublicAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
    defaultPublicAppUrl
  )
}

export function getPublicInviteUrl(inviteCode: string) {
  return `${getPublicAppBaseUrl()}/invite/${encodeURIComponent(
    normalizeInviteCode(inviteCode)
  )}`
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
