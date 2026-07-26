"use client"

import { SeasonRecordsPanel } from "@/components/statistics/SeasonRecordsPanel"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

export default function StatisticsRecordsPage() {
  const {
    activeLeague,
    selectedSeason,
    leagueSeasons,
    selectSeason,
    buildStatisticsHref,
    statistics,
    getMatchLabel,
  } = useStatisticsWorkspace()

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        leagueName={activeLeague.name}
        title="Récords y parejas"
        description="Rachas, remontadas, partidos destacados y rendimiento conjunto."
        seasons={leagueSeasons}
        selectedSeason={selectedSeason}
        onSeasonChange={selectSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      <SeasonRecordsPanel
        records={statistics.records}
        getMatchLabel={getMatchLabel}
      />

      <div>
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
              Ranking de parejas
            </p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-500">
              Ordenadas por rendimiento competitivo en la temporada.
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-black text-neutral-500">
            {statistics.pairStatistics.length} parejas
          </span>
        </div>

        {statistics.pairStatistics.length === 0 ? (
          <EmptyState
            compact
            title="Todavía no se pueden comparar parejas"
            description="Se necesitan partidos contabilizados para calcular rendimiento, victorias y diferencias."
            action={{ label: "Consultar calendario", href: "/matches" }}
          />
        ) : (
          <AppCard className="overflow-hidden p-0">
            {statistics.pairStatistics.map((pair, index) => (
              <div
                key={pair.playerIds.join("|")}
                className="statistics-pair-row flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {index + 1}. {pair.playerNames.join(" / ")}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                    {pair.matchesPlayed} partidos · {pair.wins}V · {pair.losses}D · Dif. {formatSigned(pair.gamesDiff)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-black text-neutral-800">
                  {formatPercent(pair.winRate)}
                </span>
              </div>
            ))}
          </AppCard>
        )}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Partidos destacados
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <AppCard>
            <p className="text-xs font-black uppercase tracking-wide text-neutral-400">
              Partido más igualado
            </p>
            <p className="mt-1 text-sm font-bold leading-5">
              {getMatchLabel(statistics.closestMatch)}
            </p>
          </AppCard>
          <AppCard>
            <p className="text-xs font-black uppercase tracking-wide text-neutral-400">
              Victoria más amplia
            </p>
            <p className="mt-1 text-sm font-bold leading-5">
              {getMatchLabel(statistics.biggestWin)}
            </p>
          </AppCard>
        </div>
      </div>
    </div>
  )
}
