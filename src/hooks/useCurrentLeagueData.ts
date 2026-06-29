"use client"

import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueSettings } from "@/context/LeagueSettingsProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import {
  getActiveSeasonByLeagueId,
  getLastMatch,
  getLeagueById,
  getMatchesByLeagueAndSeason,
  getNextMatch,
  getPlayersBySeasonId,
} from "@/lib/leagues"
import { buildSeasonRounds } from "@/lib/rounds"

export function useCurrentLeagueData() {
  const { activeLeagueId } = useActiveLeague()
  const { getLeagueSettings } = useLeagueSettings()
  const { matches: storedMatches } = useMatchData()
  const { getSeasonRoundSettings } = useSeasonSettings()

  const baseActiveLeague = getLeagueById(activeLeagueId)
  const activeLeagueSettings = getLeagueSettings(baseActiveLeague.id)

  const activeLeague = {
    ...baseActiveLeague,
    locations: activeLeagueSettings.locations,
  }

  const baseActiveSeason = getActiveSeasonByLeagueId(activeLeague.id)
  const matches = getMatchesByLeagueAndSeason(
    storedMatches,
    activeLeague.id,
    baseActiveSeason.id
  )
  const players = getPlayersBySeasonId(baseActiveSeason.id, matches)
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
