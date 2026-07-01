"use client"

import Link from "next/link"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { TeamPlayers } from "@/components/player/TeamPlayers"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import { getRoundMvpPlayerIds } from "@/lib/mvp"
import type { PlayerProfile } from "@/data/fakeData"

type PlayerMatch = {
  id: string
  leagueId: string
  seasonId: string
  round: number
  status: string
  teamA: string[]
  teamB: string[]
  pointsA: number | null
  pointsB: number | null
  sets: { a: number; b: number }[]
  dateLabel: string | null
  location: string | null
}

type PlayerMatchesListProps = {
  playerId: string
  title: string
  matches: PlayerMatch[]
  players?: PlayerProfile[]
  limit?: number
  emptyMessage?: string
  seasonMatches?: PlayerMatch[]
  actionHref?: string
  actionLabel?: string
}

export function PlayerMatchesList({
  playerId,
  title,
  matches,
  players,
  limit,
  emptyMessage,
  seasonMatches = matches,
  actionHref,
  actionLabel,
}: PlayerMatchesListProps) {
  const { t } = useI18n()

  const playerMatches = matches.filter(
    (match) => match.teamA.includes(playerId) || match.teamB.includes(playerId)
  )
  const visibleMatches =
    typeof limit === "number" ? playerMatches.slice(0, limit) : playerMatches

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="sl-action-link shrink-0 rounded-full px-3 py-1.5 text-xs font-black"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {visibleMatches.length === 0 ? (
        <AppCard>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-neutral-400">
            {emptyMessage ?? t.matches.noMatches}
          </p>
        </AppCard>
      ) : null}

      <div className="space-y-3">
        {visibleMatches.map((match) => {
          const isFinished = match.status === "finished"
          const isPostponed = match.status === "postponed"
          const highlightedPlayerIds = getRoundMvpPlayerIds({
            leagueId: match.leagueId,
            seasonId: match.seasonId,
            round: match.round,
            matches: seasonMatches,
          })

          const scheduleTitle = isPostponed
            ? t.matches.pendingReschedule
            : match.dateLabel ?? t.matches.pendingDate

          const scheduleDescription = isPostponed
            ? t.matches.needsReschedule
            : match.location ?? t.matches.missingSchedule

          return (
            <Link key={match.id} href={`/match/${match.id}`}>
              <AppCard className="sl-action-card p-3 pr-8 transition">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-500">
                    {t.matches.round} {match.round}
                  </p>

                  <MatchStatusBadge status={match.status} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <TeamPlayers
                      playerIds={match.teamA}
                      players={players}
                      highlightedPlayerIds={highlightedPlayerIds}
                      className="flex min-w-0 flex-wrap gap-x-1 gap-y-1 text-sm font-black"
                    />

                    {isFinished ? (
                      <p className="text-xl font-black leading-none">{match.pointsA}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <TeamPlayers
                      playerIds={match.teamB}
                      players={players}
                      highlightedPlayerIds={highlightedPlayerIds}
                      className="flex min-w-0 flex-wrap gap-x-1 gap-y-1 text-sm font-black"
                    />

                    {isFinished ? (
                      <p className="text-xl font-black leading-none">{match.pointsB}</p>
                    ) : null}
                  </div>
                </div>

                {isFinished ? (
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-bold text-neutral-600">
                    {match.sets.map((set, index) => (
                      <span
                        key={index}
                        className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1"
                      >
                        {set.a}-{set.b}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-2.5">
                    <p className="text-sm font-semibold">{scheduleTitle}</p>

                    <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                      {scheduleDescription}
                    </p>
                  </div>
                )}
              </AppCard>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
