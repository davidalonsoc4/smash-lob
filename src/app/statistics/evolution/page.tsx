"use client"

import { AllPlayersProgressChart } from "@/components/statistics/AllPlayersProgressChart"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"

export default function StatisticsEvolutionPage() {
  const {
    selectedSeason,
    buildStatisticsHref,
    statistics,
    isLeagueWide,
  } = useStatisticsWorkspace()

  const series = statistics.ranking.map((player) => ({
    playerId: player.id,
    displayName: player.displayName,
    progress: statistics.progressByPlayer[player.id] ?? [],
  }))

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        title="Evolución de la liga"
        description={
          isLeagueWide
            ? "Compara a todos los jugadores a través de cada temporada, separando los periodos y reiniciando sus métricas."
            : "Compara en un único gráfico la posición, los puntos y la diferencia de juegos de todos los jugadores."
        }
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      <AllPlayersProgressChart series={series} />
    </div>
  )
}
