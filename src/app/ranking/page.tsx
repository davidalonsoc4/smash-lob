"use client"

import { RankingTable } from "@/components/ranking/RankingTable"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

export default function RankingPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason, players } = useCurrentLeagueData()

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
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