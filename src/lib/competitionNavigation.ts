/** Account-level competition pages, independent of the remembered league. */
export function isCompetitionOverviewRoute(pathname: string) {
  return pathname === "/leagues" || pathname === "/leagues/all" || pathname === "/tournaments"
}
