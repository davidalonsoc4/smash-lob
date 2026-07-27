"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMatchData, type MatchData } from "@/context/MatchDataProvider"
import { useMvp } from "@/context/MvpProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { getMatchResultConfirmationState } from "@/lib/resultConfirmations"
import { calculateSeasonStatistics } from "@/lib/seasonStatistics"

export function useStatisticsWorkspace() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedSeasonId = searchParams.get("season")
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { matches, resultConfirmations } = useMatchData()
  const { votes } = useMvp()
  const {
    seasons,
    playerProfiles,
    seasonPlayers,
    getSeasonRoundSettings,
  } = useSeasonSettings()

  const countedMatches = useMemo(
    () =>
      matches.map((match) => ({
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
            mode: getSeasonRoundSettings(match.seasonId).resultConfirmationMode,
          }).countsForRanking,
      })),
    [getSeasonRoundSettings, matches, resultConfirmations],
  )

  const leagueSeasons = useMemo(
    () => seasons.filter((season) => season.leagueId === activeLeague.id),
    [activeLeague.id, seasons],
  )
  const selectedSeasonId =
    requestedSeasonId &&
    leagueSeasons.some((season) => season.id === requestedSeasonId)
      ? requestedSeasonId
      : activeSeason.id
  const selectedSeason =
    leagueSeasons.find((season) => season.id === selectedSeasonId) ??
    activeSeason
  const selectedSeasonSettings = getSeasonRoundSettings(selectedSeason.id)
  const leaguePlayers = useMemo(
    () => playerProfiles.filter((player) => player.leagueId === activeLeague.id),
    [activeLeague.id, playerProfiles],
  )
  const statistics = useMemo(
    () =>
      calculateSeasonStatistics({
        seasonId: selectedSeason.id,
        playerProfiles: leaguePlayers,
        seasonPlayers,
        matches: countedMatches,
      }),
    [countedMatches, leaguePlayers, seasonPlayers, selectedSeason.id],
  )
  const playersById = useMemo(
    () => new Map(leaguePlayers.map((player) => [player.id, player.displayName])),
    [leaguePlayers],
  )

  const selectSeason = useCallback(
    (seasonId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("season", seasonId)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const buildStatisticsHref = useCallback(
    (targetPath: string) => `${targetPath}?season=${selectedSeason.id}`,
    [selectedSeason.id],
  )

  const getMatchLabel = useCallback(
    (match: MatchData | null) => {
      if (!match) return "—"
      const teamA = match.teamA
        .map((playerId) => playersById.get(playerId) ?? "Jugador")
        .join(" / ")
      const teamB = match.teamB
        .map((playerId) => playersById.get(playerId) ?? "Jugador")
        .join(" / ")
      const result = match.sets.map((set) => `${set.a}-${set.b}`).join(", ")
      return `J${match.round} · ${teamA} vs ${teamB}${result ? ` · ${result}` : ""}`
    },
    [playersById],
  )

  return {
    activeLeague,
    activeSeason,
    selectedSeason,
    selectedSeasonSettings,
    isBalancedCalendar: selectedSeasonSettings.calendarMode === "balanced",
    leagueSeasons,
    selectSeason,
    statistics,
    countedMatches,
    leaguePlayers,
    seasonPlayers,
    playersById,
    votes,
    getSeasonRoundSettings,
    getMatchLabel,
    buildStatisticsHref,
  }
}
