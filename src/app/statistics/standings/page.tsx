"use client"

import { RankingTable } from "@/components/ranking/RankingTable"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(getIntlLocale(locale), { maximumFractionDigits: 1 }).format(value)
}

export default function StatisticsStandingsPage() {
  const { tx, locale } = useI18n()
  const {
    activeLeague,
    selectedSeason,
    buildStatisticsHref,
    statistics,
    isLeagueWide,
  } = useStatisticsWorkspace()

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        title={isLeagueWide ? tx("Clasificación histórica") : tx("Clasificación")}
        description={
          isLeagueWide
            ? tx("Puntos, victorias y balance acumulados en todas las temporadas de la liga.")
            : tx("Posiciones, puntos y balance completo de la temporada seleccionada.")
        }
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <AppCard>
          <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
            {tx("Partidos")}{" "}</p>
          <p className="mt-1 text-2xl font-black">
            {statistics.completedMatches}/{statistics.totalMatches}
          </p>
          <p className="mt-0.5 type-caption font-semibold text-neutral-500">
            {formatPercent(statistics.completionRate)} {tx("completado")}
          </p>
        </AppCard>
        <AppCard>
          <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
            {tx("Jugadores")}{" "}</p>
          <p className="mt-1 text-2xl font-black">{statistics.ranking.length}</p>
          <p className="mt-0.5 type-caption font-semibold text-neutral-500">
            {tx("con clasificación")}{" "}</p>
        </AppCard>
        <AppCard>
          <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
            {tx("Juegos")}{" "}</p>
          <p className="mt-1 text-2xl font-black">{statistics.totalGames}</p>
          <p className="mt-0.5 type-caption font-semibold text-neutral-500">
            {formatNumber(statistics.averageGamesPerMatch, locale)} {tx("por partido")}{" "}</p>
        </AppCard>
        <AppCard>
          <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
            {isLeagueWide ? tx("Liderato histórico") : tx("Liderato")}
          </p>
          <p className="mt-1 truncate text-base font-black">
            {statistics.leaders.length > 0
              ? statistics.leaders.map((player) => player.displayName).join(" / ")
              : "—"}
          </p>
          <p className="mt-0.5 type-caption font-semibold text-neutral-500">
            {statistics.leader ? tx(`${statistics.leader.points} puntos`) : tx("Sin datos")}
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
          title={tx("Todavía no hay clasificación")}
          description={tx("La clasificación aparecerá cuando la temporada tenga jugadores y resultados contabilizados.")}
          action={{ label: "Ver partidos", href: "/matches" }}
        />
      )}
    </div>
  )
}
