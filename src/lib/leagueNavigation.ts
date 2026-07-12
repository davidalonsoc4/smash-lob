export function normalizeInternalNavigationTarget(
  targetPath: string | null | undefined,
) {
  const normalizedTarget = targetPath?.trim() ?? ""

  if (
    !normalizedTarget.startsWith("/") ||
    normalizedTarget.startsWith("//") ||
    normalizedTarget.startsWith("/open")
  ) {
    return "/"
  }

  return normalizedTarget
}

export function buildLeagueNavigationUrl({
  leagueId,
  targetPath,
}: {
  leagueId: string
  targetPath: string
}) {
  const normalizedLeagueId = leagueId.trim()
  const normalizedTarget = normalizeInternalNavigationTarget(targetPath)

  if (!normalizedLeagueId) {
    return normalizedTarget
  }

  const searchParams = new URLSearchParams({
    leagueId: normalizedLeagueId,
    target: normalizedTarget,
  })

  return `/open?${searchParams.toString()}`
}
