const seasonSelectionKeyPrefix = "smash-lob-selected-season:"

export function getSeasonSelectionStorageKey(leagueId: string) {
  return `${seasonSelectionKeyPrefix}${leagueId}`
}

export function readSelectedSeasonId(leagueId: string) {
  if (typeof window === "undefined" || !leagueId) return null
  return window.localStorage.getItem(getSeasonSelectionStorageKey(leagueId))
}

export function writeSelectedSeasonId(leagueId: string, seasonId: string) {
  if (typeof window === "undefined" || !leagueId || !seasonId) return
  window.localStorage.setItem(getSeasonSelectionStorageKey(leagueId), seasonId)
}
