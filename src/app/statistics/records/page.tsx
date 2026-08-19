"use client"

import { SeasonRecordsPanel } from "@/components/statistics/SeasonRecordsPanel"
import { StatisticsPageHeader } from "@/components/statistics/StatisticsNavigation"
import { useStatisticsWorkspace } from "@/hooks/useStatisticsWorkspace"
import { useI18n } from "@/i18n/I18nProvider"

export default function StatisticsRecordsPage() {
  const { tx } = useI18n()
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
        title={isLeagueWide ? tx("Récords de la liga") : tx("Récords de temporada")}
        description={
          isLeagueWide
            ? tx("Las mejores rachas y los partidos más destacados de todo el historial de la liga.")
            : tx("Las mejores rachas y los partidos que marcaron la competición.")
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
