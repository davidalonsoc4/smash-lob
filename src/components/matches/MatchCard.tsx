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
          <p className="truncate text-[11px] font-black uppercase tracking-[0.1em] text-stone-400">
            {headerText}
          </p>
          <MatchStatusBadge status={match.status} />
        </div>

        <div className="grid gap-1.5">
          <div className="grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-2">
            <TeamPlayers
              playerIds={match.teamA}
              players={players}
              highlightedPlayerIds={highlightedPlayerIds}
              className="flex min-w-0 flex-wrap gap-x-1 gap-y-1 text-sm font-black leading-tight"
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
              className="flex min-w-0 flex-wrap gap-x-1 gap-y-1 text-sm font-black leading-tight"
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

        {isPostponed && hasRoundWindow ? (
          <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-2 text-[11px] font-semibold text-orange-900">
            {t.rounds.postponedWindowWarning}
          </div>
        ) : null}
      </AppCard>
    </Link>
  )
}
