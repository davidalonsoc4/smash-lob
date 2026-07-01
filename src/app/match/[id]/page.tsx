"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { AddToCalendarButton } from "@/components/match/AddToCalendarButton"
import { CourtBookingPanel } from "@/components/match/CourtBookingPanel"
import { MatchResultForm } from "@/components/match/MatchResultForm"
import { MatchScheduleForm } from "@/components/match/MatchScheduleForm"
import { MatchScoreboard } from "@/components/match/MatchScoreboard"
import { MvpVotingCard } from "@/components/mvp/MvpVotingCard"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getRoundMvpPlayerIds } from "@/lib/mvp"
import { formatShortDate } from "@/lib/rounds"

export default function MatchDetailPage() {
  const { t } = useI18n()
  const { currentUserId } = useCurrentUser()
  const { isLeagueAdmin } = useLeagueAccess()
  const { clearMatchResult } = useMatchData()
  const params = useParams<{ id: string }>()
  const { activeLeague, activeSeason, roundSettings, rounds, players, matches } =
    useCurrentLeagueData()
  const [isEditingResult, setIsEditingResult] = useState(false)
  const [isClearingResult, setIsClearingResult] = useState(false)
  const [clearResultError, setClearResultError] = useState<string | null>(null)

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
    if (!round) {
      return ""
    }

    const labelByStatus = {
      upcoming: t.rounds.statusUpcoming,
      active: t.rounds.statusActive,
      completed: t.rounds.statusCompleted,
    }

    return labelByStatus[round.status]
  }

  if (!match) {
    return (
      <div className="space-y-3">
        <header className="pt-2">
          <BackButton fallbackHref="/matches" label={t.common.back} />
        </header>

        <AppCard>
          <p className="font-bold">{t.matchDetail.notFound}</p>
        </AppCard>
      </div>
    )
  }


  async function handleClearResult() {
    if (!match || isClearingResult) {
      return
    }

    const confirmed = window.confirm(
      "¿Seguro que quieres limpiar el resultado? El partido volverá a quedar pendiente de resultado y se eliminarán los sets guardados."
    )

    if (!confirmed) {
      return
    }

    setIsClearingResult(true)
    setClearResultError(null)

    const cleared = await clearMatchResult(match.id)

    setIsClearingResult(false)

    if (!cleared) {
      setClearResultError(
        "No se ha podido limpiar el resultado. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    setIsEditingResult(false)
  }

  const roundWindowText = getRoundWindowText()
  const roundStatusText = getRoundStatusText()
  const roundMvpPlayerIds = getRoundMvpPlayerIds({
    leagueId: activeLeague.id,
    seasonId: activeSeason.id,
    round: match.round,
    matches,
  })
  const isMatchParticipant = [...match.teamA, ...match.teamB].includes(
    currentUserId
  )
  const isAdmin = isLeagueAdmin(activeLeague.id)
  const isSeasonUpcoming = activeSeason.status === "upcoming"
  const canManageMatch = !isSeasonUpcoming && (isMatchParticipant || isAdmin)
  const canEnterResult =
    canManageMatch &&
    (match.status === "scheduled" ||
      (isAdmin && (match.status === "scheduling" || match.status === "postponed")))
  const canEditResult = canManageMatch && match.status === "finished"

  return (
    <div className="space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/matches" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-stone-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="sl-page-title">
            {t.matchDetail.title}
          </h1>

          <MatchStatusBadge status={match.status} />
        </div>

        <p className="mt-1 sl-page-subtitle">
          {t.matches.round} {match.round}
        </p>
      </header>

      {isSeasonUpcoming ? (
        <AppCard>
          <p className="font-bold">Temporada próximamente</p>
          <p className="mt-2 text-sm text-stone-500">
            Esta temporada ya está creada, pero todavía no ha comenzado. No se pueden programar partidos ni registrar resultados hasta que un admin pulse Comenzar temporada.
          </p>
        </AppCard>
      ) : null}

      <MatchScoreboard
        teamA={match.teamA}
        teamB={match.teamB}
        players={players}
        pointsA={match.pointsA}
        pointsB={match.pointsB}
        sets={match.sets}
        highlightedPlayerIds={roundMvpPlayerIds}
      />

      {match.status === "finished" ? (
        <MvpVotingCard
          leagueId={activeLeague.id}
          seasonId={activeSeason.id}
          round={match.round}
          currentUserId={currentUserId}
          players={players}
          matches={matches}
        />
      ) : null}

      {hasRoundWindow ? (
        <AppCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{t.rounds.officialWindow}</p>

              {roundWindowText ? (
                <p className="mt-2 text-sm text-stone-600">
                  {roundWindowText}
                </p>
              ) : null}
            </div>

            {roundStatusText ? (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">
                {roundStatusText}
              </span>
            ) : null}
          </div>

          {isPostponed ? (
            <div className="mt-4 rounded-xl bg-orange-100 p-3 text-sm text-orange-900">
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

      {match.status === "scheduled" ? (
        <CourtBookingPanel
          matchId={match.id}
          teamA={match.teamA}
          teamB={match.teamB}
          players={players}
          currentUserId={currentUserId}
          canManage={canManageMatch}
          booking={match.courtBooking}
        />
      ) : null}

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
              <p className="mt-2 text-sm text-stone-500">
                {t.matchResult.registeredDescription}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsEditingResult(true)}
              disabled={isClearingResult}
              className="rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-black text-stone-800 disabled:text-stone-400"
            >
              {t.matchResult.editButton}
            </button>

            {isAdmin ? (
              <button
                type="button"
                onClick={handleClearResult}
                disabled={isClearingResult}
                className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 disabled:text-red-300"
              >
                {isClearingResult ? "Limpiando..." : "Limpiar resultado"}
              </button>
            ) : null}
          </div>

          {clearResultError ? (
            <p className="mt-3 text-sm font-semibold text-red-600">
              {clearResultError}
            </p>
          ) : null}
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

      {match.status === "scheduling" && !canEnterResult ? (
        <AppCard>
          <p className="font-bold">{t.matchResult.pendingScheduleTitle}</p>
          <p className="mt-2 text-sm text-stone-500">
            {t.matchResult.pendingScheduleDescription}
          </p>
        </AppCard>
      ) : null}

      {match.status === "postponed" && !canEnterResult ? (
        <AppCard>
          <p className="font-bold">{t.matchResult.postponedTitle}</p>
          <p className="mt-2 text-sm text-stone-500">
            {t.matchResult.postponedDescription}
          </p>
        </AppCard>
      ) : null}
    </div>
  )
}
