"use client"

import { SeasonRecordsPanel } from "@/components/statistics/SeasonRecordsPanel"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"

export default function StatisticsRecordsPage() {
  const {
    selectedSeason,
    buildStatisticsHref,
    statistics,
    playersById,
    isLeagueWide,
  } = useStatisticsWorkspace()

  return (
    <div className="compact-page space-y-3">
      <StatisticsPageHeader
        title={isLeagueWide ? "Récords de la liga" : "Récords de temporada"}
        description={
          isLeagueWide
            ? "Las mejores rachas y los partidos más destacados de todo el historial de la liga."
            : "Las mejores rachas y los partidos que marcaron la competición."
        }
        selectedSeason={selectedSeason}
        fallbackHref={buildStatisticsHref("/statistics")}
      />

      <SeasonRecordsPanel
        records={statistics.records}
        playersById={playersById}
        isLeagueWide={isLeagueWide}
      />
    </div>
  )
}
