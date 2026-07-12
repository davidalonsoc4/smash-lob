"use client"

import { RankingTable } from "@/components/ranking/RankingTable"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getSeasonStatusBadgeClassName } from "@/lib/statusStyles"

export default function RankingPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason, players } = useCurrentLeagueData()
  const isSeasonClosed = activeSeason.status === "finished"

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-neutral-500">
          <span>{activeLeague.name}</span>
          {isSeasonClosed ? (
            <span className={getSeasonStatusBadgeClassName("finished")}>
              Terminada
            </span>
          ) : null}
        </p>

        <h1 className="mt-1 text-2xl font-black tracking-tight">
          {t.common.individualRanking}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.ranking.description}
        </p>
      </header>


      <RankingTable players={players} />
    </div>
  )
}
