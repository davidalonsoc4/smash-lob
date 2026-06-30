"use client"

import { useParams } from "next/navigation"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { PlayerMatchesList } from "@/components/player/PlayerMatchesList"
import { PlayerStatsPanel } from "@/components/player/PlayerStatsPanel"
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

        <div className="mt-3 flex items-center gap-3">
          <PlayerAvatar player={player} size="lg" />

          <h1 className="min-w-0 text-3xl font-black tracking-tight">
            {player.displayName}
          </h1>
        </div>

        <p className="mt-3 text-sm text-neutral-500">
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

      <PlayerStatsPanel
        playerId={player.id}
        leagueId={activeLeague.id}
        seasonId={activeSeason.id}
        players={players}
        matches={matches}
        seasonMatches={matches}
      />


      <PlayerMatchesList
        playerId={player.id}
        title={t.playerProfile.playerMatches}
        matches={matches}
        players={players}
        seasonMatches={matches}
      />

    </div>
  )
}
