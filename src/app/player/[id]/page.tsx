"use client"

import { useParams } from "next/navigation"
import { PlayerMatchesList } from "@/components/player/PlayerMatchesList"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { StatCard } from "@/components/ui/StatCard"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

export default function PlayerPage() {
  const { t } = useI18n()
  const params = useParams<{ id: string }>()
  const { activeLeague, activeSeason, players, matches } =
    useCurrentLeagueData()

  const player = players.find(
    (item) => item.slug === params.id || item.id === params.id
  )

  if (!player) {
    return (
      <div className="space-y-5">
        <header className="pt-2">
          <BackButton fallbackHref="/ranking" label={t.common.back} />
        </header>

        <AppCard>
          <p className="font-bold">{t.playerProfile.notFound}</p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/ranking" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {player.displayName}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.playerProfile.description}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t.profile.points}
          value={player.points}
          helper={t.common.pointsShort}
        />

        <StatCard
          label={t.ranking.gamesDiff}
          value={`${player.gamesDiff > 0 ? "+" : ""}${player.gamesDiff}`}
          helper={t.ranking.diff}
        />
      </div>

      <AppCard>
        <div className="mb-4">
          <p className="text-sm font-semibold text-neutral-500">
            {t.playerProfile.seasonStats}
          </p>
          <p className="mt-1 text-xl font-black">{activeSeason.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl bg-neutral-100 p-3">
            <p className="font-black">{player.matchesPlayed}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {t.profile.matchesPlayed}
            </p>
          </div>

          <div className="rounded-xl bg-neutral-100 p-3">
            <p className="font-black">{player.wins}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {t.profile.wins}
            </p>
          </div>

          <div className="rounded-xl bg-neutral-100 p-3">
            <p className="font-black">{player.losses}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {t.profile.losses}
            </p>
          </div>
        </div>
      </AppCard>

      <PlayerMatchesList
        playerId={player.id}
        title={t.playerProfile.playerMatches}
        matches={matches}
        players={players}
      />

      <AppCard>
        <p className="font-bold">{t.playerProfile.futureTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.playerProfile.futureDescription}
        </p>
      </AppCard>
    </div>
  )
}
