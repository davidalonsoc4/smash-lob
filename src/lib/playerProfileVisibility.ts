import type { League, Season } from "@/data/fakeData"
import type { PlayerSeasonScope } from "@/lib/playerHistory"

export function shouldShowHistoricalProfileStats({
  league,
  seasons,
}: {
  league: League
  seasons: Season[]
}) {
  const hasOpenSeason = seasons.some(
    (season) =>
      season.leagueId === league.id &&
      (season.status === "active" || season.status === "upcoming")
  )

  return league.showHistoricalProfileStats === true || !hasOpenSeason
}

export function getVisiblePlayerSeasonScopes({
  scopes,
  activeSeason,
  showHistory,
}: {
  scopes: PlayerSeasonScope[]
  activeSeason: Season
  showHistory: boolean
}): PlayerSeasonScope[] {
  if (showHistory) {
    return scopes
  }

  const activeScope = scopes.find((scope) => scope.id === activeSeason.id)

  return [
    activeScope ?? {
      id: activeSeason.id,
      label: activeSeason.name,
      seasonIds: [activeSeason.id],
      isTotal: false,
    },
  ]
}
