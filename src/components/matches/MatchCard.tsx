"use client"

import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import { getTeamDisplayName } from "@/lib/players"
import { MatchStatusBadge } from "./MatchStatusBadge"

type MatchCardProps = {
  match: {
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
  roundStartsAt: string | null
  roundEndsAt: string | null
}

export function MatchCard({
  match,
  roundStartsAt,
  roundEndsAt,
}: MatchCardProps) {
  const { t } = useI18n()
  const isFinished = match.status === "finished"
  const isPostponed = match.status === "postponed"
  const hasRoundWindow = Boolean(roundStartsAt && roundEndsAt)

  const scheduleTitle = isPostponed
    ? t.matches.pendingReschedule
    : match.dateLabel ?? t.matches.pendingDate

  const scheduleDescription = isPostponed
    ? t.matches.needsReschedule
    : match.location ?? t.matches.missingSchedule

  return (
    <Link href={`/match/${match.id}`}>
      <AppCard className="transition active:scale-[0.99]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-500">
            {t.matches.round} {match.round}
          </p>

          <MatchStatusBadge status={match.status} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold">{getTeamDisplayName(match.teamA)}</p>

            {isFinished ? (
              <p className="text-xl font-black">{match.pointsA}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="font-bold">{getTeamDisplayName(match.teamB)}</p>

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

        {isPostponed && hasRoundWindow ? (
          <div className="mt-3 rounded-xl bg-orange-100 p-3 text-xs font-semibold text-orange-900">
            {t.rounds.postponedWindowWarning}
          </div>
        ) : null}
      </AppCard>
    </Link>
  )
}