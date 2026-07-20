"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useState } from "react"
import { AddToCalendarButton } from "@/components/match/AddToCalendarButton"
import { CourtBookingPanel } from "@/components/match/CourtBookingPanel"
import { MatchResultForm } from "@/components/match/MatchResultForm"
import { MatchResultConfirmationCard } from "@/components/match/MatchResultConfirmationCard"
import { MatchScheduleForm } from "@/components/match/MatchScheduleForm"
import { MatchScoreboard } from "@/components/match/MatchScoreboard"
import { MatchSubstitutionPanel } from "@/components/match/MatchSubstitutionPanel"
import { MvpVotingCard } from "@/components/mvp/MvpVotingCard"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useMvp } from "@/context/MvpProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getRoundMvpPlayerIds } from "@/lib/mvp"
import {
  findLeagueLocationByScheduleLocation,
  getLeagueLocationCalendarText,
} from "@/lib/leagueLocations"
import { formatShortDate } from "@/lib/rounds"

export default function MatchDetailPage() {
  const { t } = useI18n()
  const { currentUserId } = useCurrentUser()
  const { isLeagueAdmin } = useLeagueAccess()
  const {
    clearMatchResult,
    resultConfirmations,
    setMatchResultLocked,
    setMatchResultConfirmation,
  } = useMatchData()
  const { votes, clearVotesForMatch } = useMvp()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { activeLeague, activeSeason, roundSettings, rounds, players, matches } =
    useCurrentLeagueData()
  const [isEditingResult, setIsEditingResult] = useState(false)
  const [isClearingResult, setIsClearingResult] = useState(false)
  const [isUpdatingResultLock, setIsUpdatingResultLock] = useState(false)
  const [clearResultError, setClearResultError] = useState<string | null>(null)

  const shouldFocusBooking = searchParams.get("focus") === "booking"
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
      overdue: t.rounds.statusOverdue,
      completed: t.rounds.statusCompleted,
    }

    return labelByStatus[round.status]
  }

  if (!match) {
    return (
      <div className="space-y-4">
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

    if (cleared) {
      await clearVotesForMatch(match.id)
    }

    setIsClearingResult(false)

    if (!cleared) {
      setClearResultError(
        "No se ha podido limpiar el resultado. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    setIsEditingResult(false)
  }

  async function handleToggleResultLock() {
    if (!match || isUpdatingResultLock) {
      return
    }

    const nextLocked = !match.resultLocked
    const confirmed = window.confirm(
      nextLocked
        ? "¿Marcar este resultado como definitivo? Los jugadores ya no podrán confirmarlo, impugnarlo ni editarlo hasta que un admin lo desbloquee."
        : "¿Desbloquear este resultado? Volverá a admitir correcciones según el flujo de confirmación."
    )

    if (!confirmed) {
      return
    }

    setIsUpdatingResultLock(true)
    setClearResultError(null)
    const saved = await setMatchResultLocked(match.id, nextLocked)
    setIsUpdatingResultLock(false)

    if (!saved) {
      setClearResultError(
        "No se ha podido actualizar el bloqueo del resultado. Revisa Supabase o smash-lob-last-supabase-error."
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
    votes,
    mvpSystem: roundSettings.mvpSystem,
  })
  const isMatchParticipant = [...match.teamA, ...match.teamB].includes(
    currentUserId
  )
  const currentResultConfirmation = resultConfirmations.find(
    (confirmation) =>
      confirmation.matchId === match.id &&
      confirmation.playerId === currentUserId
  )
  const isAdmin = isLeagueAdmin(activeLeague.id)
  const confirmationsEnabled = roundSettings.resultConfirmationMode !== "none"
  const resultIsLocked = confirmationsEnabled && match.resultLocked
  const isSeasonUpcoming = activeSeason.status === "upcoming"
  const canManageMatch = !isSeasonUpcoming && (isMatchParticipant || isAdmin)
  const canEnterResult =
    canManageMatch &&
    (match.status === "scheduled" ||
      (isAdmin && (match.status === "scheduling" || match.status === "postponed")))
  const canEditResultAsParticipant = Boolean(
    isMatchParticipant &&
      !resultIsLocked &&
      (match.resultReportedByPlayerId === currentUserId ||
        currentResultConfirmation?.status === "disputed" ||
        !match.resultReportedByPlayerId)
  )
  const canEditResult =
    !isSeasonUpcoming &&
    match.status === "finished" &&
    !resultIsLocked &&
    (isAdmin || canEditResultAsParticipant)
  const resultReporterName = match.resultReportedByPlayerId
    ? players.find((player) => player.id === match.resultReportedByPlayerId)
        ?.displayName ?? null
    : null
  const editorReporterPlayerId = isMatchParticipant ? currentUserId : null

  const scheduledLeagueLocation = findLeagueLocationByScheduleLocation({
    locations: activeLeague.locations,
    scheduleLocation: match.location,
  })
  const calendarLocation = getLeagueLocationCalendarText(
    scheduledLeagueLocation,
    match.location
  )
  const hasSchedule = Boolean(
    match.scheduledAt || match.dateLabel || match.location
  )
  const hasSubstitutions = (match.substitutions?.length ?? 0) > 0
  const shouldShowSchedulePanel =
    match.status !== "finished" || hasSchedule
  const shouldShowSubstitutionPanel =
    canManageMatch && (match.status !== "finished" || hasSubstitutions)

  return (
    <div className="space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/matches" label={t.common.back} />

        <div className="mt-3 min-w-0 w-full" style={{ maxWidth: "none" }}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
            {activeLeague.name}
          </p>

          <div className="mt-1 flex min-w-0 items-center justify-between gap-2.5">
            <h1 className="min-w-0 text-2xl font-black tracking-tight">
              {t.matchDetail.title}
            </h1>

            <MatchStatusBadge
              status={match.status}
              scheduledAt={match.scheduledAt}
              resultRecordedAt={match.resultRecordedAt}
            />
          </div>

          <p className="mt-0.5 text-xs font-black uppercase tracking-wide text-neutral-500">
            {t.matches.round} {match.round}
          </p>
        </div>
      </header>

      {isSeasonUpcoming ? (
        <AppCard>
          <p className="font-black">Temporada próximamente</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
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
        substitutions={match.substitutions}
        highlightedPlayerIds={roundMvpPlayerIds}
      />

      {match.status === "finished" ? (
        <MatchResultConfirmationCard
          matchId={match.id}
          participantIds={[...match.teamA, ...match.teamB]}
          currentUserId={currentUserId}
          reporterPlayerId={match.resultReportedByPlayerId}
          resultRecordedAt={match.resultRecordedAt}
          resultLocked={match.resultLocked}
          mode={roundSettings.resultConfirmationMode}
          confirmations={resultConfirmations}
          onSetStatus={setMatchResultConfirmation}
        />
      ) : null}

      {match.status === "finished" ? (
        <MvpVotingCard
          match={match}
          currentUserId={currentUserId}
          players={players}
          matches={matches}
          mvpSystem={roundSettings.mvpSystem}
        />
      ) : null}

      {hasRoundWindow ? (
        <AppCard>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black">{t.rounds.officialWindow}</p>

              {roundWindowText ? (
                <p className="mt-0.5 text-xs font-semibold text-neutral-600">
                  {roundWindowText}
                </p>
              ) : null}
            </div>

            {roundStatusText ? (
              <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-black text-neutral-700">
                {roundStatusText}
              </span>
            ) : null}
          </div>

          {isPostponed ? (
            <div className="mt-2 rounded-lg bg-orange-100 p-2 text-xs text-orange-900">
              <p className="font-black">{t.rounds.postponedWindowTitle}</p>
              <p className="mt-0.5 font-semibold">
                {t.rounds.postponedWindowDescription}
              </p>
            </div>
          ) : null}
        </AppCard>
      ) : null}

      {shouldShowSchedulePanel ? (
        <MatchScheduleForm
          matchId={match.id}
          leagueId={activeLeague.id}
          seasonId={activeSeason.id}
          status={match.status}
          scheduledAt={match.scheduledAt}
          dateLabel={match.dateLabel}
          location={match.location}
          availableLocations={activeLeague.locations}
          playerIds={[...match.teamA, ...match.teamB]}
          players={players}
          roundStartsAt={round?.startsAt ?? null}
          roundEndsAt={round?.endsAt ?? null}
          canManage={canManageMatch}
          canClearSchedule={isAdmin}
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
                location={calendarLocation}
                className="min-w-0"
              />
            ) : null
          }
        />
      ) : null}

      {(match.status === "scheduled" || match.courtBooking.isReserved) ? (
        <CourtBookingPanel
          matchId={match.id}
          teamA={match.teamA}
          teamB={match.teamB}
          players={players}
          currentUserId={currentUserId}
          canManage={canManageMatch}
          canManageAllPayments={isAdmin}
          booking={match.courtBooking}
          shouldFocusBooking={shouldFocusBooking}
        />
      ) : null}

      {shouldShowSubstitutionPanel ? (
        <MatchSubstitutionPanel match={match} players={players} />
      ) : null}

      {canEnterResult ? (
        <MatchResultForm
          matchId={match.id}
          teamA={match.teamA}
          teamB={match.teamB}
          players={players}
          mode="create"
          requiresThreeSets={roundSettings.requiresThreeSets}
          reportedByPlayerId={editorReporterPlayerId}
        />
      ) : null}

      {match.status === "finished" &&
      (canEditResult || isAdmin) &&
      !isEditingResult ? (
        <AppCard>
          <div>
            <p className="font-black">{t.matchResult.registeredTitle}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
              {resultIsLocked
                ? "El resultado está fijado como definitivo por la administración."
                : currentResultConfirmation?.status === "disputed"
                  ? "Lo has marcado como incorrecto. Ya puedes corregirlo y pasarás a figurar como la persona que informó el resultado."
                  : resultReporterName
                    ? `Informado por ${resultReporterName}. Solo esa persona puede modificarlo, salvo que otro jugador lo marque como incorrecto.`
                    : t.matchResult.registeredDescription}
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {canEditResult ? (
              <button
                type="button"
                onClick={() => setIsEditingResult(true)}
                disabled={isClearingResult || isUpdatingResultLock}
                className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-black text-neutral-800 disabled:text-neutral-400"
              >
                {currentResultConfirmation?.status === "disputed"
                  ? "Corregir resultado"
                  : t.matchResult.editButton}
              </button>
            ) : null}

            {isAdmin && confirmationsEnabled ? (
              <button
                type="button"
                onClick={handleToggleResultLock}
                disabled={isClearingResult || isUpdatingResultLock}
                className={`rounded-xl px-3 py-2 text-sm font-black disabled:text-neutral-400 ${
                  resultIsLocked
                    ? "bg-neutral-100 text-neutral-800"
                    : "bg-emerald-50 text-emerald-800"
                }`}
              >
                {isUpdatingResultLock
                  ? "Guardando..."
                  : resultIsLocked
                    ? "Desbloquear resultado"
                    : "Fijar como definitivo"}
              </button>
            ) : null}

            {isAdmin && !resultIsLocked ? (
              <button
                type="button"
                onClick={handleClearResult}
                disabled={isClearingResult || isUpdatingResultLock}
                className="rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-700 disabled:text-red-300 sm:col-span-2"
              >
                {isClearingResult ? "Limpiando..." : "Limpiar resultado"}
              </button>
            ) : null}
          </div>

          {clearResultError ? (
            <p className="mt-2 text-xs font-semibold text-red-600">
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
          reportedByPlayerId={editorReporterPlayerId}
          onCancel={() => setIsEditingResult(false)}
          onSaved={async () => {
            await clearVotesForMatch(match.id)
            setIsEditingResult(false)
          }}
        />
      ) : null}


      {match.status === "postponed" && !canEnterResult ? (
        <AppCard>
          <p className="font-black">{t.matchResult.postponedTitle}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            {t.matchResult.postponedDescription}
          </p>
        </AppCard>
      ) : null}
    </div>
  )
}
