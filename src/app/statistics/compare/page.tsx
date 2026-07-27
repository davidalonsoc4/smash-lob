"use client"

import { useMemo, useState } from "react"
import { PlayerComparisonPanel } from "@/components/statistics/PlayerComparisonPanel"
import { SeasonProgressChart } from "@/components/statistics/SeasonProgressChart"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import {
  calculatePlayerComparison,
  calculatePlayerSeasonDetail,
} from "@/lib/seasonStatistics"

export default function StatisticsComparePage() {
  const {
    activeLeague,
    selectedSeason,
    buildStatisticsHref,
    statistics,
    countedMatches,
    leaguePlayers,
    seasonPlayers,
  } = useStatisticsWorkspace()
  const [playerASelection, setPlayerASelection] = useState("")
  const [playerBSelection, setPlayerBSelection] = useState("")

  const playerAId =
    statistics.ranking.some((player) => player.id === playerASelection)
      ? playerASelection
      : statistics.ranking[0]?.id ?? ""
  const playerBId =
    statistics.ranking.some(
      (player) => player.id === playerBSelection && player.id !== playerAId,
    )
      ? playerBSelection
      : statistics.ranking.find((player) => player.id !== playerAId)?.id ?? ""

  const comparison = useMemo(
    () =>
      calculatePlayerComparison({
        seasonId: selectedSeason.id,
        playerAId,
        playerBId,
        playerProfiles: leaguePlayers,
        seasonPlayers,
        matches: countedMatches,
      }),
    [
      countedMatches,
      leaguePlayers,
      playerAId,
      playerBId,
      seasonPlayers,
      selectedSeason.id,
    ],
  )
  const playerADetail = useMemo(
    () =>
      playerAId
        ? calculatePlayerSeasonDetail({
            seasonId: selectedSeason.id,
            playerId: playerAId,
            playerProfiles: leaguePlayers,
            seasonPlayers,
            matches: countedMatches,
            precomputedProgress: statistics.progressByPlayer[playerAId],
          })
        : null,
    [
      countedMatches,
      leaguePlayers,
      playerAId,
      seasonPlayers,
      selectedSeason.id,
      statistics.progressByPlayer,
    ],
  )
  const playerBDetail = useMemo(
    () =>
      playerBId
        ? calculatePlayerSeasonDetail({
            seasonId: selectedSeason.id,
            playerId: playerBId,
            playerProfiles: leaguePlayers,
            seasonPlayers,
            matches: countedMatches,
            precomputedProgress: statistics.progressByPlayer[playerBId],
          })
        : null,
    [
      countedMatches,
      leaguePlayers,
      playerBId,
      seasonPlayers,
      selectedSeason.id,
      statistics.progressByPlayer,
    ],
  )

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        leagueName={activeLeague.name}
        title="Comparar jugadores"
        description="Cara a cara, forma reciente y evolución por jornada entre dos jugadores."
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      <PlayerComparisonPanel
        players={statistics.ranking}
        playerAId={playerAId}
        playerBId={playerBId}
        comparison={comparison}
        onPlayerAChange={(playerId) => {
          setPlayerASelection(playerId)
          if (playerId === playerBId) {
            setPlayerBSelection(
              statistics.ranking.find((player) => player.id !== playerId)?.id ?? "",
            )
          }
        }}
        onPlayerBChange={(playerId) => {
          setPlayerBSelection(playerId)
          if (playerId === playerAId) {
            setPlayerASelection(
              statistics.ranking.find((player) => player.id !== playerId)?.id ?? "",
            )
          }
        }}
      />

      <SeasonProgressChart
        playerA={
          playerADetail
            ? {
                playerId: playerADetail.player.id,
                displayName: playerADetail.player.displayName,
                progress: playerADetail.progress,
              }
            : null
        }
        playerB={
          playerBDetail
            ? {
                playerId: playerBDetail.player.id,
                displayName: playerBDetail.player.displayName,
                progress: playerBDetail.progress,
              }
            : null
        }
      />
    </div>
  )
}
