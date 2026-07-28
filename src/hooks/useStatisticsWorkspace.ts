"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMatchData, type MatchData } from "@/context/MatchDataProvider"
import { useMvp } from "@/context/MvpProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import type { Season, SeasonPlayer } from "@/data/fakeData"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { getMatchResultConfirmationState } from "@/lib/resultConfirmations"
import {
  calculateSeasonStatistics,
  type PlayerRoundProgress,
  type StatisticsMatchData,
} from "@/lib/seasonStatistics"

export const ALL_LEAGUE_STATISTICS_ID = "all"

function buildLeagueWideDataset({
  leagueSeasons,
  matches,
  seasonPlayers,
}: {
  leagueSeasons: Season[]
  matches: MatchData[]
  seasonPlayers: SeasonPlayer[]
}) {
  const seasonIds = new Set(leagueSeasons.map((season) => season.id))
  const roundMetadata = new Map<
    string,
    {
      sequence: number
      label: string
      shortLabel: string
      seasonId: string
      originalRound: number
    }
  >()
  let sequence = 0

  leagueSeasons.forEach((season, seasonIndex) => {
    const rounds = Array.from(
      new Set(
        matches
          .filter((match) => match.seasonId === season.id)
          .map((match) => match.round),
      ),
    ).sort((first, second) => first - second)

    rounds.forEach((round) => {
      sequence += 1
      roundMetadata.set(`${season.id}:${round}`, {
        sequence,
        label: `${season.name} · Jornada ${round}`,
        shortLabel: `T${seasonIndex + 1} · J${round}`,
        seasonId: season.id,
        originalRound: round,
      })
    })
  })

  const statisticsMatches: StatisticsMatchData[] = matches
    .filter((match) => seasonIds.has(match.seasonId))
    .map((match) => {
      const metadata = roundMetadata.get(`${match.seasonId}:${match.round}`)
      return {
        ...match,
        seasonId: ALL_LEAGUE_STATISTICS_ID,
        round: metadata?.sequence ?? match.round,
        statisticsSeasonId: match.seasonId,
        statisticsOriginalRound: match.round,
        statisticsRoundLabel:
          metadata?.label ?? `Jornada ${match.round}`,
        statisticsRoundShortLabel:
          metadata?.shortLabel ?? `J${match.round}`,
      }
    })

  const playersInLeague = new Map<string, SeasonPlayer>()
  seasonPlayers
    .filter((seasonPlayer) => seasonIds.has(seasonPlayer.seasonId))
    .forEach((seasonPlayer) => {
      if (!playersInLeague.has(seasonPlayer.playerId)) {
        playersInLeague.set(seasonPlayer.playerId, {
          seasonId: ALL_LEAGUE_STATISTICS_ID,
          playerId: seasonPlayer.playerId,
          status: "active",
          joinedFromRound: null,
          replacesPlayerId: null,
          replacedFromRound: null,
          replacedByPlayerId: null,
        })
      }
    })

  return {
    statisticsMatches,
    statisticsSeasonPlayers: Array.from(playersInLeague.values()),
    roundMetadata,
  }
}

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
  const canSelectLeagueWide = leagueSeasons.length > 1
  const isLeagueWide =
    canSelectLeagueWide && requestedSeasonId === ALL_LEAGUE_STATISTICS_ID
  const selectedSeasonId = isLeagueWide
    ? ALL_LEAGUE_STATISTICS_ID
    : requestedSeasonId &&
        leagueSeasons.some((season) => season.id === requestedSeasonId)
      ? requestedSeasonId
      : activeSeason.id
  const selectedSeason = useMemo<Season>(() => {
    if (!isLeagueWide) {
      return (
        leagueSeasons.find((season) => season.id === selectedSeasonId) ??
        activeSeason
      )
    }

    const allFinished = leagueSeasons.every(
      (season) => season.status === "finished",
    )
    const hasActive = leagueSeasons.some((season) => season.status === "active")
    return {
      id: ALL_LEAGUE_STATISTICS_ID,
      leagueId: activeLeague.id,
      name: "Toda la liga",
      status: allFinished ? "finished" : hasActive ? "active" : "upcoming",
      totalRounds: leagueSeasons.reduce(
        (total, season) => total + season.totalRounds,
        0,
      ),
      completedRounds: leagueSeasons.reduce(
        (total, season) => total + season.completedRounds,
        0,
      ),
    }
  }, [activeLeague.id, activeSeason, isLeagueWide, leagueSeasons, selectedSeasonId])
  const selectedSeasonSettings = getSeasonRoundSettings(
    isLeagueWide ? activeSeason.id : selectedSeason.id,
  )
  const leaguePlayers = useMemo(
    () => playerProfiles.filter((player) => player.leagueId === activeLeague.id),
    [activeLeague.id, playerProfiles],
  )
  const leagueWideDataset = useMemo(
    () =>
      buildLeagueWideDataset({
        leagueSeasons,
        matches: countedMatches,
        seasonPlayers,
      }),
    [countedMatches, leagueSeasons, seasonPlayers],
  )
  const statisticsMatches = isLeagueWide
    ? leagueWideDataset.statisticsMatches
    : countedMatches
  const statisticsSeasonPlayers = isLeagueWide
    ? leagueWideDataset.statisticsSeasonPlayers
    : seasonPlayers
  const baseStatistics = useMemo(
    () =>
      calculateSeasonStatistics({
        seasonId: selectedSeason.id,
        playerProfiles: leaguePlayers,
        seasonPlayers: statisticsSeasonPlayers,
        matches: statisticsMatches,
        includeProgress: !isLeagueWide,
      }),
    [
      isLeagueWide,
      leaguePlayers,
      selectedSeason.id,
      statisticsMatches,
      statisticsSeasonPlayers,
    ],
  )
  const leagueWideProgressByPlayer = useMemo(() => {
    if (!isLeagueWide) return {}

    const combined: Record<string, PlayerRoundProgress[]> = {}
    leagueSeasons.forEach((season) => {
      const seasonStatistics = calculateSeasonStatistics({
        seasonId: season.id,
        playerProfiles: leaguePlayers,
        seasonPlayers,
        matches: countedMatches,
      })

      Object.entries(seasonStatistics.progressByPlayer).forEach(
        ([playerId, rows]) => {
          const normalizedRows = rows.map((row) => {
            const metadata = leagueWideDataset.roundMetadata.get(
              `${season.id}:${row.round}`,
            )
            return {
              ...row,
              round: metadata?.sequence ?? row.round,
              label: metadata?.label ?? `${season.name} · Jornada ${row.round}`,
              shortLabel:
                metadata?.shortLabel ?? `J${row.round}`,
              seasonId: season.id,
              originalRound: row.round,
            }
          })
          combined[playerId] = [
            ...(combined[playerId] ?? []),
            ...normalizedRows,
          ]
        },
      )
    })

    return combined
  }, [
    countedMatches,
    isLeagueWide,
    leaguePlayers,
    leagueSeasons,
    leagueWideDataset.roundMetadata,
    seasonPlayers,
  ])
  const statistics = useMemo(
    () =>
      isLeagueWide
        ? {
            ...baseStatistics,
            progressByPlayer: leagueWideProgressByPlayer,
          }
        : baseStatistics,
    [baseStatistics, isLeagueWide, leagueWideProgressByPlayer],
  )
  const playersById = useMemo<Map<string, string>>(
    () =>
      new Map(
        leaguePlayers.map((player): [string, string] => [
          player.id,
          player.displayName,
        ]),
      ),
    [leaguePlayers],
  )
  const seasonOptions = useMemo(
    () =>
      canSelectLeagueWide
        ? [
            {
              id: ALL_LEAGUE_STATISTICS_ID,
              name: "Toda la liga",
              status: "finished" as const,
              isLeagueWide: true,
            },
            ...leagueSeasons,
          ]
        : leagueSeasons,
    [canSelectLeagueWide, leagueSeasons],
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
      const statisticsMatch = match as StatisticsMatchData
      const teamA = match.teamA
        .map((playerId) => playersById.get(playerId) ?? "Jugador")
        .join(" / ")
      const teamB = match.teamB
        .map((playerId) => playersById.get(playerId) ?? "Jugador")
        .join(" / ")
      const result = match.sets.map((set) => `${set.a}-${set.b}`).join(", ")
      const roundLabel =
        statisticsMatch.statisticsRoundShortLabel ?? `J${match.round}`
      return `${roundLabel} · ${teamA} vs ${teamB}${result ? ` · ${result}` : ""}`
    },
    [playersById],
  )

  const isBalancedCalendar = isLeagueWide
    ? leagueSeasons.every(
        (season) => getSeasonRoundSettings(season.id).calendarMode === "balanced",
      )
    : selectedSeasonSettings.calendarMode === "balanced"

  return {
    activeLeague,
    activeSeason,
    selectedSeason,
    selectedSeasonSettings,
    isLeagueWide,
    isBalancedCalendar,
    leagueSeasons,
    seasonOptions,
    selectSeason,
    statistics,
    countedMatches,
    statisticsMatches,
    leaguePlayers,
    seasonPlayers,
    statisticsSeasonPlayers,
    playersById,
    votes,
    getSeasonRoundSettings,
    getMatchLabel,
    buildStatisticsHref,
  }
}
