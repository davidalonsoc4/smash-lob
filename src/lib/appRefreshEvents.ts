export const LEAGUE_ACCESS_REFRESH_EVENT = "smash-lob:refresh-league-access"
export const PERSONAL_PROFILE_HISTORY_REFRESH_EVENT = "smash-lob:refresh-personal-profile-history"

export function requestPersonalProfileHistoryRefresh() {
  window.dispatchEvent(new Event(PERSONAL_PROFILE_HISTORY_REFRESH_EVENT))
}

export function requestLeagueAccessRefresh() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(LEAGUE_ACCESS_REFRESH_EVENT))
}
