const seasonSelectionKeyPrefix = "smash-lob-selected-season:"
export const SEASON_SELECTION_CHANGED_EVENT = "smash-lob-season-selection-changed"

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
  window.dispatchEvent(
    new CustomEvent(SEASON_SELECTION_CHANGED_EVENT, {
      detail: { leagueId, seasonId },
    }),
  )
  // The native storage signal keeps other mounted shells in sync even when
  // the change happens in the same tab (browsers normally emit it only to
  // other documents).
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: getSeasonSelectionStorageKey(leagueId),
      newValue: seasonId,
      storageArea: window.localStorage,
      url: window.location.href,
    }),
  )
}
