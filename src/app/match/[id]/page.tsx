"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { AddToCalendarButton } from "@/components/match/AddToCalendarButton"
import { MatchResultForm } from "@/components/match/MatchResultForm"
import { MatchScheduleForm } from "@/components/match/MatchScheduleForm"
import { MatchScoreboard } from "@/components/match/MatchScoreboard"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { formatShortDate } from "@/lib/rounds"

export default function MatchDetailPage() {
  const { t } = useI18n()
  const { currentUserId } = useCurrentUser()
  const { isLeagueAdmin } = useLeagueAccess()
  const params = useParams<{ id: string }>()
  const { activeLeague, activeSeason, roundSettings, rounds, players, matches } =
    useCurrentLeagueData()
  const [isEditingResult, setIsEditingResult] = useState(false)

  const match = matches.find((item) => item.id === params.id)
  const round = match
    ? rounds.find((item) => item.round === match.round)
    : undefined

  const hasRoundWindow = Boolean(round?.startsAt && round?.endsAt)
  const isPostponed = match?.status === "postponed"

  function getRoundWindowText() {
    if (!round?.startsAt || !round?.endsAt) {
      return null
    }

    return `${t.rounds.from} ${formatShortDate(round.startsAt)} ${
      t.rounds.to
    } ${formatShortDate(round.endsAt)}`
  }

  function getRoundStatusText() {
    if (!round || round.status === "no-window") {
      return ""
    }

    const labelByStatus = {
      upcoming: t.rounds.statusUpcoming,
      active: t.rounds.statusActive,
      overdue: t.rounds.statusOverdue,
      completed: t.rounds.statusCompleted,
    }

    return labelByStatus[round.status]
  }

  if (!match) {
    return (
      <div className="space-y-5">
        <header className="pt-2">
          <BackButton fallbackHref="/matches" label={t.common.back} />
        </header>

        <AppCard>
          <p className="font-bold">{t.matchDetail.notFound}</p>
        </AppCard>
      </div>
    )
  }

  const roundWindowText = getRoundWindowText()
  const roundStatusText = getRoundStatusText()
  const isMatchParticipant = [...match.teamA, ...match.teamB].includes(
    currentUserId
  )
  const canManageMatch =
    isMatchParticipant || isLeagueAdmin(activeLeague.id)
  const canEnterResult = canManageMatch && match.status === "scheduled"
  const canEditResult = canManageMatch && match.status === "finished"

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/matches" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-black tracking-tight">
            {t.matchDetail.title}
          </h1>

          <MatchStatusBadge status={match.status} />
        </div>

        <p className="mt-1 text-sm text-neutral-500">
          {t.matches.round} {match.round}
        </p>
      </header>

      <MatchScoreboard
        teamA={match.teamA}
        teamB={match.teamB}
        players={players}
        pointsA={match.pointsA}
        pointsB={match.pointsB}
        sets={match.sets}
      />

      {hasRoundWindow ? (
        <AppCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{t.rounds.officialWindow}</p>

              {roundWindowText ? (
                <p className="mt-2 text-sm text-neutral-600">
                  {roundWindowText}
                </p>
              ) : null}
            </div>

            {roundStatusText ? (
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
                {roundStatusText}
              </span>
            ) : null}
          </div>

          {isPostponed ? (
            <div className="mt-4 rounded-2xl bg-orange-100 p-4 text-sm text-orange-900">
              <p className="font-black">{t.rounds.postponedWindowTitle}</p>
              <p className="mt-1 text-xs font-semibold">
                {t.rounds.postponedWindowDescription}
              </p>
            </div>
          ) : null}
        </AppCard>
      ) : null}

      <MatchScheduleForm
        matchId={match.id}
        status={match.status}
        scheduledAt={match.scheduledAt}
        dateLabel={match.dateLabel}
        location={match.location}
        availableLocations={activeLeague.locations}
        roundStartsAt={round?.startsAt ?? null}
        roundEndsAt={round?.endsAt ?? null}
        canManage={canManageMatch}
        calendarAction={
          match.status === "scheduled" && match.scheduledAt ? (
            <AddToCalendarButton
              leagueName={activeLeague.name}
              seasonName={activeSeason.name}
              round={match.round}
              teamA={match.teamA}
              teamB={match.teamB}
              players={players}
              scheduledAt={match.scheduledAt}
              location={match.location}
            />
          ) : null
        }
      />

      {canEnterResult ? (
        <MatchResultForm
          matchId={match.id}
          teamA={match.teamA}
          teamB={match.teamB}
          players={players}
          mode="create"
          requiresThreeSets={roundSettings.requiresThreeSets}
        />
      ) : null}

      {canEditResult && !isEditingResult ? (
        <AppCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{t.matchResult.registeredTitle}</p>
              <p className="mt-2 text-sm text-neutral-500">
                {t.matchResult.registeredDescription}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingResult(true)}
              className="shrink-0 rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-800"
            >
              {t.matchResult.editButton}
            </button>
          </div>
        </AppCard>
      ) : null}

      {canEditResult && isEditingResult ? (
        <MatchResultForm
          matchId={match.id}
          teamA={match.teamA}
          teamB={match.teamB}
          players={players}
          initialSets={match.sets}
          mode="edit"
          requiresThreeSets={roundSettings.requiresThreeSets}
          onCancel={() => setIsEditingResult(false)}
          onSaved={() => setIsEditingResult(false)}
        />
      ) : null}

      {match.status === "scheduling" ? (
        <AppCard>
          <p className="font-bold">{t.matchResult.pendingScheduleTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.matchResult.pendingScheduleDescription}
          </p>
        </AppCard>
      ) : null}

      {match.status === "postponed" ? (
        <AppCard>
          <p className="font-bold">{t.matchResult.postponedTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.matchResult.postponedDescription}
          </p>
        </AppCard>
      ) : null}
    </div>
  )
}
