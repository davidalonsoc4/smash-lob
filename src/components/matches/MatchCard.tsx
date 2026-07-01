"use client"

import Link from "next/link"
import { TeamPlayers } from "@/components/player/TeamPlayers"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import type { PlayerProfile } from "@/data/fakeData"
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
    scheduledAt?: string | null
    dateLabel: string | null
    location: string | null
  }
  players?: PlayerProfile[]
  roundStartsAt: string | null
  roundEndsAt: string | null
  headerMode?: "round" | "match-date"
  highlightedPlayerIds?: string[]
}

export function MatchCard({
  match,
  players = [],
  roundStartsAt,
  roundEndsAt,
  headerMode = "round",
  highlightedPlayerIds = [],
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

  function getPlayedDateLabel() {
    if (!match.scheduledAt) {
      return match.dateLabel ?? t.matches.played
    }

    const playedAt = new Date(match.scheduledAt)

    if (Number.isNaN(playedAt.getTime())) {
      return match.dateLabel ?? t.matches.played
    }

    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(playedAt)
  }

  const headerText =
    headerMode === "round"
      ? `${t.matches.round} ${match.round}`
      : isFinished
      ? getPlayedDateLabel()
      : t.matches.pendingPlay

  return (
    <Link href={`/match/${match.id}`} className="block">
      <AppCard className="sl-action-card p-3 pr-8 transition">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-neutral-400">
            {headerText}
          </p>

          <MatchStatusBadge status={match.status} />
        </div>

        <div className="space-y-1.5">
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
            <p className="text-sm font-black">{scheduleTitle}</p>

            <p className="mt-0.5 text-xs font-semibold text-neutral-500">
              {scheduleDescription}
            </p>
          </div>
        )}

        {isPostponed && hasRoundWindow ? (
          <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50 p-2.5 text-xs font-semibold text-orange-900">
            {t.rounds.postponedWindowWarning}
          </div>
        ) : null}
      </AppCard>
    </Link>
  )
}
