"use client"

import Link from "next/link"
import { SeasonContextLineSelector } from "@/components/layout/SeasonContextLine"
import { RankingTable } from "@/components/ranking/RankingTable"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

export default function RankingPage() {
  const { seasons } = useSeasonSettings()
  const { tx } = useI18n()

  const { t } = useI18n()
  const { activeLeague, activeSeason, rankingPlayers } = useCurrentLeagueData()

  return (
    <div className="space-y-4">
      <header data-tour="ranking-header" className="app-page-header">
        <BackButton fallbackHref="/" label={t.common.back} />
        <h1 className="type-page-title text-2xl font-black tracking-tight">
          {t.common.individualRanking}
        </h1>
        <SeasonContextLineSelector leagueId={activeLeague.id} season={activeSeason} seasons={seasons} />
      </header>


      <div data-tour="ranking-table">
        <RankingTable
        players={rankingPlayers}
        showAvatars={activeLeague.showRankingAvatars !== false}
        />
      </div>

      <Link data-tour="ranking-statistics-link" href="/statistics" className="block">
        <AppCard className="transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="type-panel-title font-black">{tx("Historial y estadísticas")}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {tx("Consulta rachas, parejas, temporadas anteriores y campeones.")}
              </p>
            </div>
            <ClickableChevron className="shrink-0" />
          </div>
        </AppCard>
      </Link>

    </div>
  )
}
