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
import { getMatchDisplayStatus } from "@/lib/matchLifecycle"
import { parseMatchScheduleDate } from "@/lib/matchScheduleTime"

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

function getMatchDate(match: MatchData) {
  return parseMatchScheduleDate(match.scheduledAt)
}

function getMatchTime(match: MatchData) {
  const scheduledDate = getMatchDate(match)

  return scheduledDate ? scheduledDate.getTime() : Number.NEGATIVE_INFINITY
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

function getNextMatchPriority(match: MatchData, now: Date) {
  const displayStatus = getMatchDisplayStatus({
    status: match.status,
    scheduledAt: match.scheduledAt,
    resultRecordedAt: match.resultRecordedAt,
    now,
  })

  if (displayStatus === "in_progress") {
    return 0
  }

  if (match.status === "scheduled") {
    const scheduledDate = getMatchDate(match)

    if (scheduledDate && scheduledDate.getTime() >= now.getTime()) {
      return 1
    }

    return 5
  }

  if (match.status === "scheduling") {
    return 2
  }

  if (match.status === "postponed") {
    return 3
  }

  return 9
}

export function getNextMatch(matches: MatchData[]) {
  const now = new Date()

  return [...matches]
    .filter(
      (match) =>
        match.status === "scheduling" ||
        match.status === "scheduled" ||
        match.status === "postponed"
    )
    .sort((a, b) => {
      const priorityDiff =
        getNextMatchPriority(a, now) - getNextMatchPriority(b, now)

      if (priorityDiff !== 0) {
        return priorityDiff
      }

      const aTime = getMatchTime(a)
      const bTime = getMatchTime(b)

      if (aTime !== bTime) {
        if (aTime === Number.NEGATIVE_INFINITY) return 1
        if (bTime === Number.NEGATIVE_INFINITY) return -1

        return aTime - bTime
      }

      return a.round - b.round
    })[0]
}
