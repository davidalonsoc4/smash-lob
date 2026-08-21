export const LEAGUE_ACCESS_REFRESH_EVENT = "smash-lob:refresh-league-access"

export function requestLeagueAccessRefresh() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(LEAGUE_ACCESS_REFRESH_EVENT))
}
