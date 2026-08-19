"use client"

import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  StatisticsPageHeader,
  StatisticsSectionIcon,
  StatisticsSectionLink,
} from "@/components/statistics/StatisticsNavigation"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import { useI18n } from "@/i18n/I18nProvider"

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

function formatNames(names: string[]) {
  return names.length > 0 ? names.join(" / ") : "—"
}

export default function StatisticsPage() {
  const { tx } = useI18n()
  const {
    selectedSeason,
    seasonOptions,
    selectSeason,
    statistics,
    buildStatisticsHref,
    isLeagueWide,
  } = useStatisticsWorkspace()

  const issueCount =
    (selectedSeason.status === "finished" || isLeagueWide
      ? statistics.dataQuality.pendingMatches
      : 0) +
    statistics.dataQuality.excludedFinishedMatches +
    statistics.dataQuality.invalidFinishedMatches
  const maximumWins = Math.max(0, ...statistics.ranking.map((player) => player.wins))
  const mostWinsPlayers = statistics.ranking.filter(
    (player) => player.wins === maximumWins && maximumWins > 0,
  )
  const maximumGamesDiff =
    statistics.ranking.length > 0
      ? Math.max(...statistics.ranking.map((player) => player.gamesDiff))
      : 0
  const bestGamesDiffPlayers = statistics.ranking.filter(
    (player) => player.gamesDiff === maximumGamesDiff,
  )

  return (
    <div className="compact-page space-y-3">
      <div data-tour="statistics-header" className="space-y-3">
        <StatisticsPageHeader
          title={tx("Estadísticas")}
          description={
            isLeagueWide
              ? tx("El histórico completo de la liga y accesos directos a cada análisis.")
              : tx("Lo más destacado de la temporada y accesos directos a cada análisis.")
          }
          seasons={seasonOptions}
          selectedSeason={selectedSeason}
          onSeasonChange={selectSeason}
          fallbackHref="/ranking"
        />
      </div>

      {statistics.ranking.length > 0 ? (
        <div data-tour="statistics-highlights" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <AppCard>
            <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
              {isLeagueWide
                ? statistics.leaders.length > 1
                  ? tx("Líderes históricos")
                  : tx("Líder histórico")
                : selectedSeason.status === "finished"
                  ? statistics.leaders.length > 1
                    ? "Campeones"
                    : tx("Campeón")
                  : statistics.leaders.length > 1
                    ? tx("Líderes")
                    : tx("Líder")}
            </p>
            <p className="mt-1 truncate text-base font-black">
              {formatNames(statistics.leaders.map((player) => player.displayName))}
            </p>
            <p className="mt-0.5 type-caption font-semibold text-neutral-500">
              {statistics.leader ? tx(`${statistics.leader.points} puntos`) : tx("Sin datos")}
            </p>
          </AppCard>
          <AppCard>
            <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
              {tx("Más victorias")}{" "}</p>
            <p className="mt-1 truncate text-base font-black">
              {formatNames(mostWinsPlayers.map((player) => player.displayName))}
            </p>
            <p className="mt-0.5 type-caption font-semibold text-neutral-500">
              {maximumWins > 0 ? `${maximumWins} victorias` : tx("Sin victorias")}
            </p>
          </AppCard>
          <AppCard>
            <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
              {tx("Mejor diferencia")}
            </p>
            <p className="mt-1 truncate text-base font-black">
              {formatNames(bestGamesDiffPlayers.map((player) => player.displayName))}
            </p>
            <p className="mt-0.5 type-caption font-semibold text-neutral-500">
              {formatSigned(maximumGamesDiff)} {tx("juegos")}{" "}</p>
          </AppCard>
          <AppCard>
            <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
              {tx("Mejor racha")}
            </p>
            <p className="mt-1 truncate text-base font-black">
              {statistics.longestWinStreak?.displayName ?? "—"}
            </p>
            <p className="mt-0.5 type-caption font-semibold text-neutral-500">
              {statistics.longestWinStreak
                ? `${statistics.longestWinStreak.wins} victorias seguidas`
                : tx("Sin racha registrada")}
            </p>
          </AppCard>
        </div>
      ) : (
        <EmptyState
          compact
          title={tx("Todavía no hay estadísticas")}
          description={tx("El resumen aparecerá cuando la temporada tenga jugadores y resultados contabilizados.")}
          action={{ label: "Ver partidos", href: "/matches" }}
        />
      )}

      <div data-tour="statistics-navigation">
        <p className="mb-2 type-caption font-black uppercase tracking-[0.2em] text-neutral-600">
          {tx("Explorar estadísticas")}{" "}</p>
        <AppCard className="overflow-hidden p-0">
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/standings")}
            title={tx("Clasificación")}
            description={
              isLeagueWide
                ? tx("Clasificación histórica acumulada, puntos y balance de todas las temporadas.")
                : tx("Tabla completa, puntos, balance y evolución de la temporada.")
            }
            leading={<StatisticsSectionIcon name="standings" />}
          />
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/compare")}
            title={tx("Cara a cara")}
            description={tx("Compara a dos jugadores, sus rachas y su rendimiento ante los mismos rivales.")}
            leading={<StatisticsSectionIcon name="compare" />}
          />
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/player")}
            title={tx("Análisis individual")}
            description={tx("Rendimiento, compañero más fuerte, rivales, récords y evolución.")}
            leading={<StatisticsSectionIcon name="player" />}
          />
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/evolution")}
            title={tx("Evolución de la liga")}
            description={tx("Posición, puntos y diferencia de juegos de todos los jugadores.")}
            leading={<StatisticsSectionIcon name="evolution" />}
          />
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/records")}
            title={isLeagueWide ? tx("Récords de la liga") : tx("Récords de temporada")}
            description={
              isLeagueWide
                ? tx("Mejores rachas, remontadas y partidos de todo el historial.")
                : tx("Mejores rachas, remontadas y partidos que marcaron la temporada.")
            }
            leading={<StatisticsSectionIcon name="records" />}
          />
          <StatisticsSectionLink
            href={buildStatisticsHref("/statistics/season")}
            title={tx("Compartir resumen de temporada")}
            description={tx("Genera, descarga o comparte el resumen final y consulta el historial de campeones.")}
            leading={<StatisticsSectionIcon name="season" />}
          />
        </AppCard>
      </div>

      {issueCount > 0 ? (
        <AppCard className="border-amber-200 bg-amber-50">
          <p className="text-sm font-black text-amber-900">
            {tx("Hay")} {issueCount} {tx("elementos que conviene revisar")}{" "}</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-amber-800">
            {tx("Los resultados excluidos o no válidos no se incluyen en los cálculos competitivos. Los pendientes solo requieren revisión al cerrar la temporada.")}{" "}</p>
        </AppCard>
      ) : null}
    </div>
  )
}
