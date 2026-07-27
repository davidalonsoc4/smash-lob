"use client"

import { AllPlayersProgressChart } from "@/components/statistics/AllPlayersProgressChart"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"

export default function StatisticsEvolutionPage() {
  const {
    activeLeague,
    selectedSeason,
    buildStatisticsHref,
    statistics,
  } = useStatisticsWorkspace()

  const series = statistics.ranking.map((player) => ({
    playerId: player.id,
    displayName: player.displayName,
    progress: statistics.progressByPlayer[player.id] ?? [],
  }))

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        leagueName={activeLeague.name}
        title="Evolución de la liga"
        description="Compara en un único gráfico la posición y los puntos acumulados de todos los jugadores."
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      <AllPlayersProgressChart series={series} />
    </div>
  )
}
