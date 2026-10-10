"use client"

import { useCurrentUser } from "@/context/CurrentUserProvider"
import { AllPlayersProgressChart } from "@/components/statistics/AllPlayersProgressChart"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import { useI18n } from "@/i18n/I18nProvider"

export default function StatisticsEvolutionPage() {
  const { tx } = useI18n()
  const {
    selectedSeason,
    seasonOptions,
    selectSeason,
    buildStatisticsHref,
    statistics,
    isLeagueWide,
  } = useStatisticsWorkspace()

  const { currentUserId } = useCurrentUser()
  const series = statistics.ranking.map((player) => ({
    playerId: player.id,
    displayName: player.displayName,
    progress: statistics.progressByPlayer[player.id] ?? [],
  }))

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        title={tx("Evolución de la liga")}
        description={
          isLeagueWide
            ? tx("Compara a todos los jugadores a través de cada temporada, separando los periodos y reiniciando sus métricas.")
            : tx("Compara en un único gráfico la posición, los puntos y la diferencia de juegos de todos los jugadores.")
        }
        seasons={seasonOptions}
        onSeasonChange={selectSeason}
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      <AllPlayersProgressChart key={series.map(player => player.playerId).join("|")} series={series} preferredPlayerId={currentUserId} />
    </div>
  )
}
