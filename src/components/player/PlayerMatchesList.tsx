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
      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-2">
        <h2 className="text-[15px] font-black">{title}</h2>
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
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-stone-400">
            {emptyMessage ?? t.matches.noMatches}
          </p>
        </AppCard>
      ) : null}

      <div className="grid gap-1.5">
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
                <div className="mb-2 grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-stone-400">
                    {t.matches.round} {match.round}
                  </p>

                  <MatchStatusBadge status={match.status} />
                </div>

                <div className="grid gap-1.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-2">
                    <TeamPlayers
                      playerIds={match.teamA}
                      players={players}
                      highlightedPlayerIds={highlightedPlayerIds}
                      className="flex min-w-0 flex-wrap gap-x-1 gap-y-1 text-sm font-black"
                    />

                    {isFinished ? (
                      <p className="text-right text-lg font-black leading-none text-stone-950">{match.pointsA}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-2">
                    <TeamPlayers
                      playerIds={match.teamB}
                      players={players}
                      highlightedPlayerIds={highlightedPlayerIds}
                      className="flex min-w-0 flex-wrap gap-x-1 gap-y-1 text-sm font-black"
                    />

                    {isFinished ? (
                      <p className="text-right text-lg font-black leading-none text-stone-950">{match.pointsB}</p>
                    ) : null}
                  </div>
                </div>

                {isFinished ? (
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px] font-bold text-stone-600">
                    {match.sets.map((set, index) => (
                      <span
                        key={index}
                        className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5"
                      >
                        {set.a}-{set.b}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-2.5 py-2">
                    <p className="text-xs font-black text-stone-900">{scheduleTitle}</p>

                    <p className="mt-0.5 text-[11px] font-semibold text-stone-500">
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
