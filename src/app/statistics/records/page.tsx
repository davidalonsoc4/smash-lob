"use client"

import { SeasonRecordsPanel } from "@/components/statistics/SeasonRecordsPanel"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { AppCard } from "@/components/ui/AppCard"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"

export default function StatisticsRecordsPage() {
  const {
    activeLeague,
    selectedSeason,
    buildStatisticsHref,
    statistics,
    getMatchLabel,
  } = useStatisticsWorkspace()

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        leagueName={activeLeague.name}
        title="Récords de temporada"
        description="Rachas, remontadas y partidos destacados de la competición individual."
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      <SeasonRecordsPanel
        records={statistics.records}
        getMatchLabel={getMatchLabel}
      />

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
