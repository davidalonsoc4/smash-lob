"use client"

import { RankingTable } from "@/components/ranking/RankingTable"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)
}

export default function StatisticsStandingsPage() {
  const {
    activeLeague,
    selectedSeason,
    buildStatisticsHref,
    statistics,
  } = useStatisticsWorkspace()

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        leagueName={activeLeague.name}
        title="Clasificación"
        description="Posiciones, puntos y balance completo de la temporada seleccionada."
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Partidos
          </p>
          <p className="mt-1 text-2xl font-black">
            {statistics.completedMatches}/{statistics.totalMatches}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {formatPercent(statistics.completionRate)} completado
          </p>
        </AppCard>
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Jugadores
          </p>
          <p className="mt-1 text-2xl font-black">{statistics.ranking.length}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            con clasificación
          </p>
        </AppCard>
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Juegos
          </p>
          <p className="mt-1 text-2xl font-black">{statistics.totalGames}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {formatNumber(statistics.averageGamesPerMatch)} por partido
          </p>
        </AppCard>
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Liderato
          </p>
          <p className="mt-1 truncate text-base font-black">
            {statistics.leaders.length > 0
              ? statistics.leaders.map((player) => player.displayName).join(" / ")
              : "—"}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {statistics.leader ? `${statistics.leader.points} puntos` : "Sin datos"}
          </p>
        </AppCard>
      </div>

      {statistics.ranking.length > 0 ? (
        <RankingTable
          players={statistics.ranking}
          showAvatars={activeLeague.showRankingAvatars !== false}
        />
      ) : (
        <EmptyState
          compact
          title="Todavía no hay clasificación"
          description="La clasificación aparecerá cuando la temporada tenga jugadores y resultados contabilizados."
          action={{ label: "Ver partidos", href: "/matches" }}
        />
      )}
    </div>
  )
}
