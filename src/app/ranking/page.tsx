"use client"

import { LeagueSeasonEyebrow } from "@/components/layout/LeagueSeasonEyebrow"
import { RankingTable } from "@/components/ranking/RankingTable"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

export default function RankingPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason, players } = useCurrentLeagueData()

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <LeagueSeasonEyebrow
          leagueName={activeLeague.name}
          seasonName={activeSeason.name}
          seasonStatus={activeSeason.status}
        />

        <h1 className="mt-1.5 text-2xl font-black tracking-tight">
          {t.common.individualRanking}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.ranking.description}
        </p>
      </header>


      <RankingTable
        players={players}
        showAvatars={activeLeague.showRankingAvatars !== false}
      />
    </div>
  )
}
