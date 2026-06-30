"use client"

import Link from "next/link"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { PlayerMatchesList } from "@/components/player/PlayerMatchesList"
import { PlayerStatsPanel } from "@/components/player/PlayerStatsPanel"
import { AppCard } from "@/components/ui/AppCard"
import { StatCard } from "@/components/ui/StatCard"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

export default function ProfilePage() {
  const { t } = useI18n()
  const { currentUserId } = useCurrentUser()
  const { activeLeague, activeSeason, players, matches } =
    useCurrentLeagueData()

  const isSeasonClosed = activeSeason.status === "finished"
  const player = players.find((item) => item.id === currentUserId)
  const playerMatches = matches.filter(
    (match) =>
      match.teamA.includes(currentUserId) || match.teamB.includes(currentUserId)
  )
  const nextMatches = playerMatches
    .filter((match) => match.status !== "finished")
    .sort((firstMatch, secondMatch) => firstMatch.round - secondMatch.round)
  const recentFinishedMatches = playerMatches
    .filter((match) => match.status === "finished")
    .sort((firstMatch, secondMatch) => secondMatch.round - firstMatch.round)

  if (!player) {
    return (
      <div className="space-y-5">
        <header className="pt-2">
          <p className="text-sm font-medium text-neutral-500">
            {activeLeague.name} · {activeSeason.name}
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {t.profile.title}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.profile.notFound}</p>
        </AppCard>

        <AppCard>
          <p className="font-bold">{t.profile.placeholderTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.profile.placeholderDescription}
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <PlayerAvatar player={player} size="lg" />

          <h1 className="min-w-0 text-3xl font-black tracking-tight">
            {player.displayName}
          </h1>
        </div>

        <p className="mt-3 text-sm text-neutral-500">
          {t.profile.description}
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
            {t.profile.seasonSummary}
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

      <PlayerStatsPanel
        playerId={player.id}
        players={players}
        matches={playerMatches}
      />

      {!isSeasonClosed ? (
        <PlayerMatchesList
          playerId={player.id}
          title={t.profile.nextMatch}
          matches={nextMatches}
          players={players}
          limit={1}
          emptyMessage={t.profile.noUpcomingMatches}
        />
      ) : null}

      <PlayerMatchesList
        playerId={player.id}
        title={t.profile.recentResults}
        matches={recentFinishedMatches}
        players={players}
        limit={3}
        emptyMessage={t.profile.noRecentResults}
      />

      <Link href="/profile/matches">
        <AppCard className="transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">{t.profile.matchHistoryTitle}</p>
              <p className="mt-2 text-sm text-neutral-500">
                {t.profile.matchHistoryDescription}
              </p>
            </div>

            <span className="text-xl">&gt;</span>
          </div>
        </AppCard>
      </Link>
    </div>
  )
}
