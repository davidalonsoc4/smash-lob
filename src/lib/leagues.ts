import {
  leagues,
  playerProfiles as defaultPlayerProfiles,
  seasonPlayers as defaultSeasonPlayers,
  type PlayerProfile,
  seasons,
  type SeasonPlayer,
} from "@/data/fakeData"
import type { MatchData } from "@/context/MatchDataProvider"
import { calculateSeasonRanking } from "@/lib/ranking"

function findRequired<T>(
  items: T[],
  predicate: (item: T) => boolean,
  errorMessage: string
): T {
  const item = items.find(predicate)

  if (!item) {
    throw new Error(errorMessage)
  }

  return item
}

export function getLeagueById(leagueId: string) {
  return findRequired(
    leagues,
    (league) => league.id === leagueId,
    `League not found: ${leagueId}`
  )
}

export function getActiveSeasonByLeagueId(leagueId: string) {
  const league = getLeagueById(leagueId)

  return findRequired(
    seasons,
    (season) => season.id === league.activeSeasonId,
    `Active season not found: ${league.activeSeasonId}`
  )
}

export function getMatchesByLeagueAndSeason(
  matches: MatchData[],
  leagueId: string,
  seasonId: string
) {
  return matches.filter(
    (match) => match.leagueId === leagueId && match.seasonId === seasonId
  )
}

export function getPlayersBySeasonId(
  seasonId: string,
  matches: MatchData[],
  seasonPlayers: SeasonPlayer[] = defaultSeasonPlayers,
  playerProfiles: PlayerProfile[] = defaultPlayerProfiles
) {
  return calculateSeasonRanking({
    seasonId,
    playerProfiles,
    seasonPlayers,
    matches,
  })
}

function getMatchTime(match: MatchData) {
  if (!match.scheduledAt) {
    return Number.NEGATIVE_INFINITY
  }

  const time = new Date(match.scheduledAt).getTime()

  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}

export function getLastMatch(matches: MatchData[]) {
  return [...matches]
    .filter((match) => match.status === "finished")
    .sort((a, b) => {
      const timeDiff = getMatchTime(b) - getMatchTime(a)

      if (timeDiff !== 0) {
        return timeDiff
      }

      return b.round - a.round
    })[0]
}

export function getNextMatch(matches: MatchData[]) {
  return [...matches]
    .filter(
      (match) =>
        match.status === "scheduling" ||
        match.status === "scheduled" ||
        match.status === "postponed"
    )
    .sort((a, b) => a.round - b.round)[0]
}
