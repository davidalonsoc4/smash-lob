"use client"

import Link from "next/link"
import { RankingTable } from "@/components/ranking/RankingTable"
import { AppCard } from "@/components/ui/AppCard"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

export default function RankingPage() {
  const { t } = useI18n()
  const { isLeagueAdmin } = useLeagueAccess()
  const { activeLeague, activeSeason, players } = useCurrentLeagueData()
  const canManageSeason = isLeagueAdmin(activeLeague.id)
  const isSeasonClosed = activeSeason.status === "finished"

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

      {isSeasonClosed ? (
        <AppCard>
          <p className="font-bold">{t.dashboard.closedSeasonTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.ranking.closedSeasonHistoricalDescription.replace(
              "{seasonName}",
              activeSeason.name
            )}
          </p>
          {canManageSeason ? (
            <Link
              href="/admin/season"
              className="mt-4 block rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white"
            >
              {t.dashboard.createSeason}
            </Link>
          ) : null}
        </AppCard>
      ) : null}

      <RankingTable players={players} />
    </div>
  )
}