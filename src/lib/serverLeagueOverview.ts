import "server-only"
import type { League, UserLeagueMembership } from "@/data/fakeData"
import type { MatchData } from "@/context/MatchDataProvider"
import type { SeasonSnapshot } from "@/context/SeasonSettingsProvider"
import { resolveLeagueActiveSeason, selectCompetitionHighlights, type LeagueOverview } from "@/lib/competitionOverview"
import { getLeagueActivityMatches } from "@/lib/leagueActivity"
import { getEffectiveRevealedThroughRound } from "@/lib/progressiveCalendar"
import { createFallbackSettings } from "@/lib/seasonFallbackSettings"

export const emptyLeagueOverview: LeagueOverview = { activeSeasons: {}, startsAt: {}, revealedThrough: {}, activity: [] }

export function buildLeagueOverview({ leagues, memberships, matches, snapshot, now }: {
  leagues: League[]
  memberships: UserLeagueMembership[]
  matches: MatchData[]
  snapshot: SeasonSnapshot
  now: Date
}): LeagueOverview {
  const settingsBySeason = new Map(snapshot.seasonSettings.map(settings => [settings.seasonId, settings]))
  const matchesBySeason = Map.groupBy(matches, match => match.seasonId)
  const leagueById = new Map(leagues.map(league => [league.id, league]))
  const playerByLeague = new Map(memberships.map(member => [member.leagueId, member.playerId]))
  const roster = new Set(snapshot.seasonPlayers.filter(row => row.status !== "withdrawn").map(row => `${row.seasonId}:${row.playerId}`))
  const revealedThrough: LeagueOverview["revealedThrough"] = {}
  const items = snapshot.seasons.flatMap(season => {
    const settings = settingsBySeason.get(season.id) ?? createFallbackSettings(season.id)
    const seasonMatches = matchesBySeason.get(season.id) ?? []
    revealedThrough[season.id] = season.status === "upcoming" ? 0 : getEffectiveRevealedThroughRound({
      seasonStatus: season.status, totalRounds: season.totalRounds, settings, matches: seasonMatches, now,
    })
    const league = leagueById.get(season.leagueId), playerId = playerByLeague.get(season.leagueId)
    if (!league || !playerId || !roster.has(`${season.id}:${playerId}`)) return []
    return getLeagueActivityMatches({ league, season, settings, matches: seasonMatches, playerId, profiles: snapshot.playerProfiles, now, useMadridDay: true })
  })
  return {
    activeSeasons: Object.fromEntries(leagues.map(league => [league.id, resolveLeagueActiveSeason(snapshot.seasons, league.id, league.activeSeasonId)])),
    startsAt: Object.fromEntries(snapshot.seasonSettings.map(settings => [settings.seasonId, settings.scheduledStartAt ?? settings.seasonStartsAt])),
    revealedThrough,
    activity: selectCompetitionHighlights(items, now).map(item => item.match),
  }
}
