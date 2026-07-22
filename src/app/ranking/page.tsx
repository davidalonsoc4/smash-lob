"use client"

import Link from "next/link"
import { LeagueSeasonEyebrow } from "@/components/layout/LeagueSeasonEyebrow"
import { RankingTable } from "@/components/ranking/RankingTable"
import { AppCard } from "@/components/ui/AppCard"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

export default function RankingPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason, rankingPlayers } = useCurrentLeagueData()

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
        players={rankingPlayers}
        showAvatars={activeLeague.showRankingAvatars !== false}
      />

      <Link href="/statistics" className="block">
        <AppCard className="transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-black">Historial y estadísticas</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                Consulta rachas, parejas, temporadas anteriores y campeones.
              </p>
            </div>
            <span className="text-xl">&gt;</span>
          </div>
        </AppCard>
      </Link>

    </div>
  )
}
