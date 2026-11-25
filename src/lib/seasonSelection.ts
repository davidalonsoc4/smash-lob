import type { Season } from "@/data/fakeData"
// Legacy snapshots without timestamps retain their original creation order.
export function getNewestLeagueSeasons(seasons: Season[], leagueId: string) {
  return seasons.filter((season) => season.leagueId === leagueId).reverse().sort((a, b) =>
    (Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0))
}
const seasonSelectionKeyPrefix = "smash-lob-selected-season:"
export const SEASON_SELECTION_CHANGED_EVENT = "smash-lob-season-selection-changed"
export function subscribeSeasonSelection(callback: () => void) {
  window.addEventListener(SEASON_SELECTION_CHANGED_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => { window.removeEventListener(SEASON_SELECTION_CHANGED_EVENT, callback); window.removeEventListener("storage", callback) }
}

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

const seenSeasonKeyPrefix = "smash-lob-seen-season:"

export function readSeenSeasonId(leagueId: string) {
  if (typeof window === "undefined" || !leagueId) return null
  try { return window.localStorage.getItem(`${seenSeasonKeyPrefix}${leagueId}`) } catch { return null }
}

export function writeSeenSeasonId(leagueId: string, seasonId: string) {
  if (typeof window === "undefined" || !leagueId || !seasonId) return
  try { window.localStorage.setItem(`${seenSeasonKeyPrefix}${leagueId}`, seasonId) } catch { /* private mode: the season is only offered again next time */ }
}

export function clearSeenSeasonId(leagueId: string) {
  if (typeof window === "undefined" || !leagueId) return
  try { window.localStorage.removeItem(`${seenSeasonKeyPrefix}${leagueId}`) } catch { /* nothing to clear */ }
}

/** The newest season of a league the person can see: the one they play, or any for who manages the league. */
export function getNewestAvailableSeasonId({ seasons, leagueId, participatingSeasonIds, canManage }: { seasons: Season[]; leagueId: string; participatingSeasonIds: ReadonlySet<string>; canManage: boolean }) {
  return getNewestLeagueSeasons(seasons, leagueId).find(season => canManage || participatingSeasonIds.has(season.id))?.id ?? null
}

/**
 * The newest season of a league the person can see (the one they play, or any for who manages the league), when it is
 * not the one they were last taken to. The first visit after a new season exists lands there; afterwards the person
 * keeps whatever they choose with the season selector.
 */
export function getNewSeasonToOffer({ seasons, leagueId, participatingSeasonIds, canManage, seenSeasonId }: {
  seasons: Season[]
  leagueId: string
  participatingSeasonIds: ReadonlySet<string>
  canManage: boolean
  seenSeasonId: string | null
}) {
  const newest = getNewestAvailableSeasonId({ seasons, leagueId, participatingSeasonIds, canManage })
  return newest && newest !== seenSeasonId ? newest : null
}
