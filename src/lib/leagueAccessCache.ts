const spectatorAccessStorageKeyPrefix = "smash-lob-spectator-leagues"

function getSpectatorAccessStorageKey(userId: string) {
  return `${spectatorAccessStorageKeyPrefix}:${userId.trim().toLowerCase()}`
}

export function readCachedSpectatorLeagueIds(userId: string | null | undefined) {
  if (typeof window === "undefined" || !userId?.trim()) {
    return []
  }

  const storedValue = window.localStorage.getItem(
    getSpectatorAccessStorageKey(userId),
  )

  if (!storedValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return Array.from(
      new Set(
        parsedValue.filter(
          (leagueId): leagueId is string =>
            typeof leagueId === "string" && leagueId.trim().length > 0,
        ),
      ),
    )
  } catch {
    return []
  }
}

export function writeCachedSpectatorLeagueIds(
  userId: string,
  leagueIds: string[],
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return
  }

  window.localStorage.setItem(
    getSpectatorAccessStorageKey(userId),
    JSON.stringify(Array.from(new Set(leagueIds))),
  )
}

export function addCachedSpectatorLeagueId(userId: string, leagueId: string) {
  writeCachedSpectatorLeagueIds(userId, [
    ...readCachedSpectatorLeagueIds(userId),
    leagueId,
  ])
}
