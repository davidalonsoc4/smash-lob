"use client"

import Link from "next/link"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { AppCard } from "@/components/ui/AppCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { StatCard } from "@/components/ui/StatCard"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getTeamDisplayName } from "@/lib/players"

export default function Home() {
  const { t } = useI18n()
  const {
    activeLeague,
    activeSeason,
    players,
    lastMatch,
    nextMatch,
  } = useCurrentLeagueData()

  const rankingPlayers = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
    return b.gamesFor - a.gamesFor
  })

  const leader = rankingPlayers[0]

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-sm font-medium text-neutral-500">
          {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {activeLeague.name}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {activeLeague.description} · {t.common.individualRanking}
        </p>
      </header>

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
            {rankingPlayers.slice(0, 4).map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold">
                    {index + 1}
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

                <p className="text-lg font-black">{player.points}</p>
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
                    {getTeamDisplayName(lastMatch.teamA)}
                  </p>
                  <p className="text-xl font-black">{lastMatch.pointsA}</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="font-bold">
                    {getTeamDisplayName(lastMatch.teamB)}
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
                  {getTeamDisplayName(nextMatch.teamA)}
                </p>
                <p className="text-sm text-neutral-500">{t.common.versus}</p>
                <p className="font-bold">
                  {getTeamDisplayName(nextMatch.teamB)}
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