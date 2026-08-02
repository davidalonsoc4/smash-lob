const INVITE_PATH_PATTERN = /^\/(?:invite|spectate)\/[^/?#]+$/

export function buildPostAuthDestination(
  pathname: string | null | undefined,
  searchParams?: Pick<URLSearchParams, "toString"> | null,
) {
  const normalizedPath = pathname?.trim() || "/"

  if (!INVITE_PATH_PATTERN.test(normalizedPath)) {
    return "/"
  }

  const query = searchParams?.toString().trim()
  return query ? `${normalizedPath}?${query}` : normalizedPath
}
