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
import { getMatchResultConfirmationState } from "@/lib/resultConfirmations"

export function useCurrentLeagueData() {
  const { activeLeagueId } = useActiveLeague()
  const {
    getMembershipForLeague,
    isLeagueAdmin,
    leagues,
    userLeagues,
  } = useLeagueAccess()
  const { matches: storedMatches, resultConfirmations } = useMatchData()
  const {
    getActiveSeasonByLeagueId: getStoredActiveSeasonByLeagueId,
    playerProfiles,
    seasonPlayers,
    getSeasonRoundSettings,
    seasons,
  } = useSeasonSettings()

  const baseActiveLeague =
    leagues.find((league) => league.id === activeLeagueId) ?? userLeagues[0]

  if (!baseActiveLeague) {
    throw new Error("Active league not found")
  }

  const activeLeague = baseActiveLeague
  const membership = getMembershipForLeague(activeLeague.id)
  const canManageLeague = isLeagueAdmin(activeLeague.id)
  const storedCurrentSeason = getStoredActiveSeasonByLeagueId(activeLeague.id)
  const playerSeasonIds = new Set(
    seasonPlayers
      .filter((seasonPlayer) => seasonPlayer.playerId === membership?.playerId)
      .map((seasonPlayer) => seasonPlayer.seasonId)
  )
  const playerParticipatesInStoredSeason = membership?.playerId
    ? playerSeasonIds.has(storedCurrentSeason.id)
    : true
  const latestPlayerSeason = membership?.playerId
    ? [...seasons]
        .filter(
          (season) =>
            season.leagueId === activeLeague.id && playerSeasonIds.has(season.id)
        )
        .at(-1) ?? null
    : null

  const baseActiveSeason =
    !canManageLeague &&
    membership?.playerId &&
    !playerParticipatesInStoredSeason &&
    latestPlayerSeason
      ? latestPlayerSeason
      : storedCurrentSeason
  const roundSettings = getSeasonRoundSettings(baseActiveSeason.id)
  const matches = getMatchesByLeagueAndSeason(
    storedMatches,
    activeLeague.id,
    baseActiveSeason.id
  ).map((match) => ({
    ...match,
    resultCounts:
      match.rankingCounts !== false &&
      getMatchResultConfirmationState({
        matchId: match.id,
        participantIds: [...match.teamA, ...match.teamB],
        reporterPlayerId: match.resultReportedByPlayerId,
        resultRecordedAt: match.resultRecordedAt,
        resultLocked: match.resultLocked,
        confirmations: resultConfirmations,
        mode: roundSettings.resultConfirmationMode,
      }).countsForRanking,
  }))
  const rankingPlayers = getPlayersBySeasonId(
    baseActiveSeason.id,
    matches,
    seasonPlayers,
    playerProfiles
  )
  const rankingPlayerIds = new Set(rankingPlayers.map((player) => player.id))
  const matchParticipantIds = new Set(
    matches.flatMap((match) => [...match.teamA, ...match.teamB]),
  )
  const matchOnlyPlayers = playerProfiles
    .filter(
      (player) =>
        player.leagueId === activeLeague.id &&
        matchParticipantIds.has(player.id) &&
        !rankingPlayerIds.has(player.id),
    )
    .map((player) => ({
      ...player,
      seasonId: baseActiveSeason.id,
      playerId: player.id,
      seasonPlayerStatus: "active" as const,
      joinedFromRound: null,
      replacedFromRound: null,
      points: 0,
      gamesDiff: 0,
      gamesFor: 0,
      gamesAgainst: 0,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    }))
  const players = [...rankingPlayers, ...matchOnlyPlayers]
  const lastMatch = getLastMatch(matches)
  const nextMatch = getNextMatch(matches)
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
    rankingPlayers,
    matches,
    lastMatch,
    nextMatch,
  }
}
