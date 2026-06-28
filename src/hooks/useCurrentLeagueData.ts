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

  const activeSeason = getActiveSeasonByLeagueId(activeLeague.id)
  const matches = getMatchesByLeagueAndSeason(
    storedMatches,
    activeLeague.id,
    activeSeason.id
  )
  const players = getPlayersBySeasonId(activeSeason.id, matches)
  const lastMatch = getLastMatch(matches)
  const nextMatch = getNextMatch(matches)
  const roundSettings = getSeasonRoundSettings(activeSeason.id)
  const rounds = buildSeasonRounds({
    season: activeSeason,
    settings: roundSettings,
    matches,
  })

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