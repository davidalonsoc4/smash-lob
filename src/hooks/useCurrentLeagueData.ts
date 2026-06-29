"use client"

import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import {
  getLastMatch,
  getMatchesByLeagueAndSeason,
  getNextMatch,
  getPlayersBySeasonId,
} from "@/lib/leagues"
import { buildSeasonRounds } from "@/lib/rounds"

export function useCurrentLeagueData() {
  const { activeLeagueId } = useActiveLeague()
  const { leagues, userLeagues } = useLeagueAccess()
  const { matches: storedMatches } = useMatchData()
  const {
    getActiveSeasonByLeagueId: getStoredActiveSeasonByLeagueId,
    playerProfiles,
    seasonPlayers,
    getSeasonRoundSettings,
  } = useSeasonSettings()

  const baseActiveLeague =
    leagues.find((league) => league.id === activeLeagueId) ?? userLeagues[0]

  if (!baseActiveLeague) {
    throw new Error("Active league not found")
  }

  const activeLeague = baseActiveLeague

  const baseActiveSeason = getStoredActiveSeasonByLeagueId(activeLeague.id)
  const matches = getMatchesByLeagueAndSeason(
    storedMatches,
    activeLeague.id,
    baseActiveSeason.id
  )
  const players = getPlayersBySeasonId(
    baseActiveSeason.id,
    matches,
    seasonPlayers,
    playerProfiles
  )
  const lastMatch = getLastMatch(matches)
  const nextMatch = getNextMatch(matches)
  const roundSettings = getSeasonRoundSettings(baseActiveSeason.id)
  const rounds = buildSeasonRounds({
    season: baseActiveSeason,
    settings: roundSettings,
    matches,
  })
  const activeSeason = {
    ...baseActiveSeason,
    completedRounds: rounds.filter((round) => round.status === "completed")
      .length,
  }

  return {
    activeLeague,
    activeSeason,
    roundSettings,
    rounds,
    players,
    matches,
    lastMatch,
    nextMatch,
  }
}
