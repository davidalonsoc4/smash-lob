"use client"

import Link from "next/link"
import { RankingTable } from "@/components/ranking/RankingTable"
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
    <div className="space-y-4">
      <header className="pt-2">
        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <h1 className="mt-1 sl-page-title">
          {t.common.individualRanking}
        </h1>

        <p className="mt-1 sl-page-subtitle">
          {t.ranking.description}
        </p>
      </header>

      {isSeasonClosed ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-500">
          <span className="min-w-0 truncate">
            Temporada terminada · {activeSeason.name}
          </span>

          {canManageSeason ? (
            <Link
              href="/admin/season"
              className="shrink-0 font-black text-neutral-900 underline-offset-4 active:underline"
            >
              Gestionar
            </Link>
          ) : null}
        </div>
      ) : null}

      <RankingTable players={players} />
    </div>
  )
}