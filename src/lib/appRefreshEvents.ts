export const LEAGUE_ACCESS_REFRESH_EVENT = "smash-lob:refresh-league-access"
export const PAYMENT_LEDGER_REFRESH_EVENT = "smash-lob:refresh-payment-ledger"
export const PERSONAL_PROFILE_HISTORY_REFRESH_EVENT = "smash-lob:refresh-personal-profile-history"

export const MATCH_DASHBOARD_REFRESH_EVENT = "smash-lob:refresh-match-dashboard"
export const TOURNAMENT_LIST_REFRESH_EVENT = "smash-lob:refresh-tournament-list"

export const LEAGUE_MEMBERSHIP_CHANGED_EVENT = "smash-lob:league-membership-changed"

export function requestLeagueMembershipRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(LEAGUE_MEMBERSHIP_CHANGED_EVENT))
}

export function requestMatchDashboardRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(MATCH_DASHBOARD_REFRESH_EVENT))
}

export function requestTournamentListRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(TOURNAMENT_LIST_REFRESH_EVENT))
}

export function requestPaymentLedgerRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PAYMENT_LEDGER_REFRESH_EVENT))
}

export function requestPersonalProfileHistoryRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PERSONAL_PROFILE_HISTORY_REFRESH_EVENT))
}

export function requestLeagueAccessRefresh() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(LEAGUE_ACCESS_REFRESH_EVENT))
}
