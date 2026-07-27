"use client"

import { useMemo, useState } from "react"
import { PlayerComparisonPanel } from "@/components/statistics/PlayerComparisonPanel"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import { calculatePlayerComparison } from "@/lib/seasonStatistics"

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
  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        leagueName={activeLeague.name}
        title="Cara a cara"
        description="Compara la clasificación, la forma reciente y los enfrentamientos directos entre dos jugadores."
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
    </div>
  )
}
