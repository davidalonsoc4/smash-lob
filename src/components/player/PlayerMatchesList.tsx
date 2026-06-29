"use client"

import Link from "next/link"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import { getTeamDisplayName } from "@/lib/players"

type PlayerMatch = {
  id: string
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
  limit?: number
  emptyMessage?: string
}

export function PlayerMatchesList({
  playerId,
  title,
  matches,
  limit,
  emptyMessage,
}: PlayerMatchesListProps) {
  const { t } = useI18n()

  const playerMatches = matches.filter(
    (match) => match.teamA.includes(playerId) || match.teamB.includes(playerId)
  )
  const visibleMatches =
    typeof limit === "number" ? playerMatches.slice(0, limit) : playerMatches

  return (
    <section>
      <h2 className="mb-3 text-lg font-black">{title}</h2>

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

          const scheduleTitle = isPostponed
            ? t.matches.pendingReschedule
            : match.dateLabel ?? t.matches.pendingDate

          const scheduleDescription = isPostponed
            ? t.matches.needsReschedule
            : match.location ?? t.matches.missingSchedule

          return (
            <Link key={match.id} href={`/match/${match.id}`}>
              <AppCard className="transition active:scale-[0.99]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-500">
                    {t.matches.round} {match.round}
                  </p>

                  <MatchStatusBadge status={match.status} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">
                      {getTeamDisplayName(match.teamA)}
                    </p>

                    {isFinished ? (
                      <p className="text-xl font-black">{match.pointsA}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">
                      {getTeamDisplayName(match.teamB)}
                    </p>

                    {isFinished ? (
                      <p className="text-xl font-black">{match.pointsB}</p>
                    ) : null}
                  </div>
                </div>

                {isFinished ? (
                  <div className="mt-4 flex gap-2 text-sm text-neutral-600">
                    {match.sets.map((set, index) => (
                      <span
                        key={index}
                        className="rounded-lg bg-neutral-100 px-2 py-1"
                      >
                        {set.a}-{set.b}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-3">
                    <p className="text-sm font-semibold">{scheduleTitle}</p>

                    <p className="mt-1 text-xs text-neutral-500">
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
