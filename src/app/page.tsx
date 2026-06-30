"use client"

import Link from "next/link"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { AppCard } from "@/components/ui/AppCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { StatCard } from "@/components/ui/StatCard"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getTeamDisplayName } from "@/lib/players"

export default function Home() {
  const { t } = useI18n()
  const { currentUserId } = useCurrentUser()
  const { isLeagueAdmin } = useLeagueAccess()
  const {
    activeLeague,
    activeSeason,
    players,
    lastMatch,
    nextMatch,
  } = useCurrentLeagueData()

  const canManageSeason = isLeagueAdmin(activeLeague.id)
  const isSeasonClosed = activeSeason.status === "finished"

  const rankingPlayers = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
    return b.gamesFor - a.gamesFor
  })

  const leader = rankingPlayers[0]
  const currentUserRankingIndex = rankingPlayers.findIndex(
    (player) => player.id === currentUserId
  )
  const rankingPreviewStart =
    currentUserRankingIndex <= 0
      ? 0
      : currentUserRankingIndex >= rankingPlayers.length - 1
      ? Math.max(0, rankingPlayers.length - 3)
      : currentUserRankingIndex - 1
  const rankingPreviewPlayers =
    currentUserRankingIndex === -1
      ? rankingPlayers.slice(0, 3)
      : rankingPlayers.slice(rankingPreviewStart, rankingPreviewStart + 3)

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-sm font-medium text-neutral-500">
          {activeSeason.name}
        </p>

        <div className="mt-2 flex items-center gap-3">
          <LeagueLogo league={activeLeague} size="lg" />

          <h1 className="min-w-0 text-3xl font-black tracking-tight">
            {activeLeague.name}
          </h1>
        </div>

        <p className="mt-1 text-sm text-neutral-500">
          {activeLeague.description} · {t.common.individualRanking}
        </p>
      </header>

      {isSeasonClosed ? (
        leader ? (
          <AppCard className="overflow-hidden p-0">
            <div className="border-b border-neutral-100 bg-gradient-to-br from-neutral-950 to-neutral-800 px-4 py-3 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60">
                    {t.dashboard.closedSeasonTitle}
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">
                    {t.dashboard.seasonWinner.replace(
                      "{seasonName}",
                      activeSeason.name
                    )}
                  </h2>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-base font-black text-neutral-950">
                  1º
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  player={leader}
                  size="lg"
                  className="border border-neutral-200 bg-white"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-2xl font-black text-neutral-950">
                    {leader.displayName}
                  </p>
                  <p className="mt-1 text-sm font-bold text-neutral-500">
                    {t.dashboard.finalChampion}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-neutral-100 px-2 py-2.5">
                  <p className="text-lg font-black text-neutral-950">
                    {leader.points}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                    {t.common.pointsShort}
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-100 px-2 py-2.5">
                  <p className="text-lg font-black text-neutral-950">
                    {leader.gamesDiff > 0 ? "+" : ""}
                    {leader.gamesDiff}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                    {t.ranking.diff}
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-100 px-2 py-2.5">
                  <p className="text-lg font-black text-neutral-950">
                    {leader.gamesFor}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                    {t.ranking.forShort}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                {t.dashboard.closedSeasonHistoricalDescription.replace(
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
            </div>
          </AppCard>
        ) : (
          <AppCard>
            <p className="font-bold text-neutral-950">{t.dashboard.closedSeasonTitle}</p>
            <p className="mt-2 text-sm text-neutral-500">
              {t.dashboard.closedSeasonHistoricalDescription.replace(
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
        )
      ) : null}

      {!isSeasonClosed ? (
        <div className="grid grid-cols-2 gap-3">
          {leader ? (
            <StatCard
              label={t.dashboard.leader}
              value={leader.displayName}
              helper={`${leader.points} ${t.common.pointsShort} · ${
                leader.gamesDiff > 0 ? "+" : ""
              }${leader.gamesDiff} ${t.ranking.diff.toLowerCase()}`}
            />
          ) : null}

          <StatCard
            label={t.dashboard.rounds}
            value={`${activeSeason.completedRounds}/${activeSeason.totalRounds}`}
            helper={t.dashboard.regularLeague}
          />
        </div>
      ) : null}

      <section>
        <SectionHeader
          title={t.dashboard.rankingTitle}
          action={
            <Link
              href="/ranking"
              className="text-sm font-semibold text-neutral-600"
            >
              {t.dashboard.viewAll}
            </Link>
          }
        />

        <AppCard>
          <div className="space-y-3">
            {rankingPreviewPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between gap-3 rounded-2xl py-1.5 pl-2 pr-3 ${
                  player.id === currentUserId ? "bg-neutral-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold">
                    {rankingPreviewStart + index + 1}
                  </div>

                  <div>
                    <p className="font-semibold">{player.displayName}</p>
                    <p className="text-xs text-neutral-500">
                      {t.ranking.gamesDiff}:{" "}
                      {player.gamesDiff > 0 ? "+" : ""}
                      {player.gamesDiff}
                    </p>
                  </div>
                </div>

                <p className="min-w-6 text-right text-lg font-black">
                  {player.points}
                </p>
              </div>
            ))}
          </div>
        </AppCard>
      </section>

      {lastMatch ? (
        <section>
          <SectionHeader title={t.dashboard.lastMatch} />

          <Link href={`/match/${lastMatch.id}`}>
            <AppCard className="transition active:scale-[0.99]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-500">
                  {t.matches.round} {lastMatch.round}
                </p>

                <MatchStatusBadge status={lastMatch.status} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-bold">
                    {getTeamDisplayName(lastMatch.teamA, players)}
                  </p>
                  <p className="text-xl font-black">{lastMatch.pointsA}</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="font-bold">
                    {getTeamDisplayName(lastMatch.teamB, players)}
                  </p>
                  <p className="text-xl font-black">{lastMatch.pointsB}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 text-sm text-neutral-600">
                {lastMatch.sets.map((set, index) => (
                  <span
                    key={index}
                    className="rounded-lg bg-neutral-100 px-2 py-1"
                  >
                    {set.a}-{set.b}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-xs text-neutral-500">
                {lastMatch.dateLabel} · {lastMatch.location}
              </p>
            </AppCard>
          </Link>
        </section>
      ) : null}

      {nextMatch ? (
        <section>
          <SectionHeader title={t.dashboard.nextMatch} />

          <Link href={`/match/${nextMatch.id}`}>
            <AppCard className="transition active:scale-[0.99]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-500">
                  {t.matches.round} {nextMatch.round}
                </p>

                <MatchStatusBadge status={nextMatch.status} />
              </div>

              <div className="space-y-2">
                <p className="font-bold">
                  {getTeamDisplayName(nextMatch.teamA, players)}
                </p>
                <p className="text-sm text-neutral-500">{t.common.versus}</p>
                <p className="font-bold">
                  {getTeamDisplayName(nextMatch.teamB, players)}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-3">
                <p className="text-sm font-semibold">
                  {nextMatch.dateLabel ??
                    (nextMatch.status === "postponed"
                      ? t.matches.pendingReschedule
                      : t.dashboard.addSchedule)}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  {nextMatch.location ??
                    (nextMatch.status === "postponed"
                      ? t.matches.needsReschedule
                      : t.dashboard.playersCanSchedule)}
                </p>
              </div>
            </AppCard>
          </Link>
        </section>
      ) : null}
    </div>
  )
}
