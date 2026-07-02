"use client"

import Link from "next/link"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { TeamPlayers } from "@/components/player/TeamPlayers"
import { AppCard } from "@/components/ui/AppCard"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-black text-neutral-700"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {visibleMatches.length === 0 ? (
        <AppCard>
          <p className="text-sm font-semibold text-neutral-500">
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
            <Link key={match.id} href={`/match/${match.id}`} className="block">
              <AppCard className="relative transition active:scale-[0.99]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="min-w-0 text-sm font-semibold text-neutral-500">
                    {t.matches.round} {match.round}
                  </p>

                  <MatchStatusBadge status={match.status} />
                </div>

                <ClickableChevron className="absolute right-3 top-1/2 -translate-y-1/2" />

                <div className="pr-11">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <TeamPlayers
                        playerIds={match.teamA}
                        players={players}
                        highlightedPlayerIds={highlightedPlayerIds}
                        className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                      />

                      {isFinished ? (
                        <p className="min-w-6 text-right text-lg font-black">{match.pointsA}</p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <TeamPlayers
                        playerIds={match.teamB}
                        players={players}
                        highlightedPlayerIds={highlightedPlayerIds}
                        className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                      />

                      {isFinished ? (
                        <p className="min-w-6 text-right text-lg font-black">{match.pointsB}</p>
                      ) : null}
                    </div>
                  </div>

                  {isFinished ? (
                    <div className="mt-2 flex gap-1.5 text-xs font-bold text-neutral-600">
                      {match.sets.map((set, index) => (
                        <span
                          key={index}
                          className="rounded-md bg-neutral-100 px-1.5 py-0.5"
                        >
                          {set.a}-{set.b}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-2">
                      <p className="text-xs font-black text-neutral-800">{scheduleTitle}</p>

                      <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                        {scheduleDescription}
                      </p>
                    </div>
                  )}
                </div>
              </AppCard>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
