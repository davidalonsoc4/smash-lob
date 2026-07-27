"use client"

import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  StatisticsPageHeader,
  StatisticsSectionIcon,
  StatisticsSectionLink,
} from "@/components/statistics/StatisticsNavigation"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import { getRankingPosition } from "@/lib/seasonStatistics"

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

export default function StatisticsPage() {
  const {
    activeLeague,
    selectedSeason,
    leagueSeasons,
    selectSeason,
    statistics,
    buildStatisticsHref,
  } = useStatisticsWorkspace()

  const issueCount =
    statistics.dataQuality.pendingMatches +
    statistics.dataQuality.excludedFinishedMatches +
    statistics.dataQuality.invalidFinishedMatches
  const topPlayers = statistics.ranking.slice(0, 3)

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        leagueName={activeLeague.name}
        title="Estadísticas"
        description="Un resumen rápido de la temporada y accesos directos al detalle que quieras consultar."
        seasons={leagueSeasons}
        selectedSeason={selectedSeason}
        onSeasonChange={selectSeason}
        fallbackHref="/ranking"
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Progreso
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
            Líder
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
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Mejor racha
          </p>
          <p className="mt-1 truncate text-base font-black">
            {statistics.longestWinStreak?.displayName ?? "—"}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {statistics.longestWinStreak
              ? `${statistics.longestWinStreak.wins} victorias`
              : "Sin datos"}
          </p>
        </AppCard>
        <AppCard>
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
            Resultados válidos
          </p>
          <p className="mt-1 text-2xl font-black">
            {statistics.countedMatches}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {statistics.countedMatches > 0
              ? `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(statistics.averageGamesPerMatch)} juegos por partido`
              : "Sin resultados"}
          </p>
        </AppCard>
      </div>

      {statistics.ranking.length > 0 ? (
        <AppCard accentStrip>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
                Podio provisional
              </p>
              <p className="mt-1 text-sm font-black">{selectedSeason.name}</p>
            </div>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-700">
              {selectedSeason.status === "finished" ? "Final" : "En curso"}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {topPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2"
              >
                <p className="min-w-0 truncate text-sm font-black">
                  {getRankingPosition(statistics.ranking, player.id)}º · {player.displayName}
                </p>
                <span className="shrink-0 text-xs font-black">
                  {player.points} pts · {formatSigned(player.gamesDiff)} juegos
                </span>
              </div>
            ))}
          </div>
        </AppCard>
      ) : (
        <EmptyState
          compact
          title="Todavía no hay estadísticas"
          description="El resumen aparecerá cuando la temporada tenga jugadores y resultados contabilizados."
          action={{ label: "Ver partidos", href: "/matches" }}
        />
      )}

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Explorar estadísticas
        </p>
        <AppCard className="overflow-hidden p-0">
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/standings")}
            title="Clasificación"
            description="Tabla completa, puntos, balance y evolución de la temporada."
            summary={`${statistics.ranking.length} jugadores`}
            leading={<StatisticsSectionIcon name="standings" />}
          />
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/compare")}
            title="Comparar jugadores"
            description="Cara a cara, forma reciente y evolución entre dos jugadores."
            summary={statistics.ranking.length >= 2 ? "Disponible" : "Sin datos"}
            leading={<StatisticsSectionIcon name="compare" />}
          />
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/player")}
            title="Análisis individual"
            description="Rendimiento, compañero más fuerte, rivales, récords y evolución."
            summary={statistics.ranking[0]?.displayName}
            leading={<StatisticsSectionIcon name="player" />}
          />
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/evolution")}
            title="Evolución de la liga"
            description="Gráfico conjunto de posición y puntos de todos los jugadores."
            summary={`${statistics.ranking.length} series`}
            leading={<StatisticsSectionIcon name="evolution" />}
          />
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/records")}
            title="Récords de temporada"
            description="Mejores rachas, remontadas y partidos destacados."
            summary={statistics.records.biggestComeback ? "Con remontada" : "Partidos destacados"}
            leading={<StatisticsSectionIcon name="records" />}
          />
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/season")}
            title="Resumen de temporada"
            description="Calidad de los datos, resumen final compartible e historial de campeones."
            summary={
              issueCount > 0
                ? `${issueCount} avisos`
                : selectedSeason.status === "finished"
                  ? "Temporada cerrada"
                  : "Datos al día"
            }
            leading={<StatisticsSectionIcon name="season" />}
          />
        </AppCard>
      </div>

      {issueCount > 0 ? (
        <AppCard className="border-amber-200 bg-amber-50">
          <p className="text-sm font-black text-amber-900">
            Hay {issueCount} elementos que conviene revisar
          </p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-amber-800">
            Los partidos pendientes, excluidos o no válidos no se incluyen en los cálculos competitivos.
          </p>
        </AppCard>
      ) : null}
    </div>
  )
}
