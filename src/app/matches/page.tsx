"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { MatchCard } from "@/components/matches/MatchCard"
import { SeasonContextLine } from "@/components/layout/SeasonContextLine"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { EmptyState } from "@/components/ui/EmptyState"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMvp } from "@/context/MvpProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getNextMatch } from "@/lib/leagues"
import { getActiveCalendarRoundId } from "@/lib/matchesCalendar"
import { getMatchMvpSelection, getRoundMvpPlayerIds } from "@/lib/mvp"
import { formatShortDate } from "@/lib/rounds"
import { getRoundStatusBadgeClassName } from "@/lib/statusStyles"

export default function MatchesPage() {
  const { tx, t, locale } = useI18n()
  const searchParams = useSearchParams()
  const { currentUserId } = useCurrentUser()
  const { isLeagueAdmin } = useLeagueAccess()
  const { votes } = useMvp()
  const { activeLeague, activeSeason, roundSettings, rounds, players, matches } =
    useCurrentLeagueData()
  const canManageSeason = isLeagueAdmin(activeLeague.id)
  const isSeasonUpcoming = activeSeason.status === "upcoming"
  const isPlayerSeasonLocked = isSeasonUpcoming && !canManageSeason
  const activeScope = searchParams.get("scope") === "mine" ? "mine" : "all"
  const currentUserMatches = matches.filter(
    (match) =>
      match.teamA.includes(currentUserId) || match.teamB.includes(currentUserId),
  )
  const nextPendingUserMatch = getNextMatch(currentUserMatches) ?? null
  const allMatchesCount = matches.length
  const myMatchesCount = currentUserMatches.length
  const visibleMatches = matches.filter((match) =>
    activeScope === "mine"
      ? match.teamA.includes(currentUserId) || match.teamB.includes(currentUserId)
      : true
  )
  const activeRoundId = getActiveCalendarRoundId(activeSeason.status, rounds)
  const activeRoundRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!activeRoundId) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      activeRoundRef.current?.scrollIntoView({
        behavior: "auto",
        block: "start",
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeRoundId])

  function getRoundWindowText(round: (typeof rounds)[number]) {
    if (!round.startsAt || !round.endsAt) {
      return null
    }

    return `${t.rounds.from} ${formatShortDate(round.startsAt, locale)} ${
      t.rounds.to
    } ${formatShortDate(round.endsAt, locale)}`
  }

  function getRoundStatusText(round: (typeof rounds)[number]) {
    const labelByStatus = {
      upcoming: t.rounds.statusUpcoming,
      active: t.rounds.statusActive,
      overdue: t.rounds.statusOverdue,
      completed: t.rounds.statusCompleted,
    }

    return labelByStatus[round.status]
  }

  return (
    <div className="space-y-4">
      <header data-tour="matches-header" className="app-page-header">
        <BackButton fallbackHref="/" label={t.common.back} />
        <h1 className="type-page-title text-2xl font-black tracking-tight">
          {t.matches.subtitle}
        </h1>
        <SeasonContextLine
          seasonName={activeSeason.name}
          statusLabel={
            activeSeason.status === "finished"
              ? t.common.finishedSeasonBadge
              : activeSeason.status === "upcoming"
                ? t.rounds.statusUpcoming
                : t.rounds.statusActive
          }
          className="mt-0.5"
        />
      </header>

      <AppCard data-tour="matches-scope" className="p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <p className="shrink-0 type-caption font-black text-neutral-700">
            {tx("Vista del calendario")}{" "}</p>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Link
              href="/matches"
              aria-current={activeScope === "all" ? "page" : undefined}
              className={`inline-flex items-center gap-1 rounded-xl px-2 py-1.5 transition ${
                activeScope === "all"
                  ? "bg-neutral-950 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-700"
              }`}
            >
              <span className="whitespace-nowrap type-caption font-black">
                {tx("Liga completa")}{" "}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 type-caption font-black ${
                  activeScope === "all"
                    ? "bg-white/15 text-white"
                    : "bg-white text-neutral-600"
                }`}
              >
                {allMatchesCount}
              </span>
            </Link>

            <Link
              href="/matches?scope=mine"
              aria-current={activeScope === "mine" ? "page" : undefined}
              className={`inline-flex items-center gap-1 rounded-xl px-2 py-1.5 transition ${
                activeScope === "mine"
                  ? "bg-neutral-950 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-700"
              }`}
            >
              <span className="whitespace-nowrap type-caption font-black">
                {tx("Mis partidos")}{" "}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 type-caption font-black ${
                  activeScope === "mine"
                    ? "bg-white/15 text-white"
                    : "bg-white text-neutral-600"
                }`}
              >
                {myMatchesCount}
              </span>
            </Link>
          </div>
        </div>
      </AppCard>

      {isPlayerSeasonLocked ? (
        <AppCard className="border border-neutral-200 bg-neutral-50/80 px-3 py-2.5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
            {tx("Temporada próximamente")}{" "}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-600">
            {tx("La temporada está creada, pero todavía no ha comenzado. Los partidos se desbloquearán al comenzar la temporada.")}{" "}</p>
          {canManageSeason ? (
            <Link
              href="/admin/season"
              className="mt-3 inline-flex rounded-2xl bg-neutral-950 px-3 py-2 text-xs font-black text-white items-center justify-center text-center"
            >
              {tx("Administrar temporada")}{" "}</Link>
          ) : null}
        </AppCard>
      ) : null}

      <div data-tour="matches-round-list" className="space-y-7">
        {rounds.map((round) => {
          const roundMatches = visibleMatches.filter(
            (match) => match.round === round.round
          )
          const roundWindowText = getRoundWindowText(round)
          const roundStatusText = getRoundStatusText(round)

          if (roundMatches.length === 0) {
            return null
          }

          return (
            <section
              key={round.id}
              ref={round.id === activeRoundId ? activeRoundRef : undefined}
              data-active-round={round.id === activeRoundId ? "true" : undefined}
              className="scroll-mt-24 space-y-4"
            >
              <Link
                href={`/round/${round.round}`}
                aria-label={tx(`Abrir resumen de ${round.name}`)}
                className="block rounded-xl px-1 py-1 transition active:bg-neutral-100"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="type-section-title">{round.name}</h2>

                  {roundStatusText ? (
                    <span className={getRoundStatusBadgeClassName(round.status)}>
                      {roundStatusText}
                    </span>
                  ) : null}
                </div>

                {roundWindowText ? (
                  <p className="mt-1 text-sm text-neutral-500">
                    {roundWindowText}
                  </p>
                ) : null}
              </Link>

              <div className="space-y-4">
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    players={players}
                    roundStartsAt={round.startsAt}
                    roundEndsAt={round.endsAt}
                    headerMode="match-date"
                    headerLeftLabel={tx(`Jornada ${match.round}`)}
                    statusPosition="right"
                    stackTeamPlayers
                    currentUserId={currentUserId}
                    highlightedPlayerIds={
                      roundSettings.mvpSystem === "voting"
                        ? (getMatchMvpSelection({ votes, match })?.playerIds ?? [])
                        : getRoundMvpPlayerIds({
                            leagueId: activeLeague.id,
                            seasonId: activeSeason.id,
                            round: match.round,
                            matches,
                            votes,
                            mvpSystem: roundSettings.mvpSystem,
                          })
                    }
                    highlightedPlayerLabel={
                      roundSettings.mvpSystem === "voting"
                        ? tx("MVP del partido")
                        : tx("MVP de jornada")
                    }
                    leagueLocations={activeLeague.locations}
                    showMissingScheduleHint={match.id === nextPendingUserMatch?.id}
                    hideMissingScheduleMeta
                  />
                ))}
              </div>
            </section>
          )
        })}

        {visibleMatches.length === 0 ? (
          <EmptyState
            title={
              activeScope === "mine"
                ? tx("Todavía no tienes partidos")
                : tx("El calendario todavía está vacío")
            }
            description={
              activeScope === "mine"
                ? tx("Cuando formes parte de un partido aparecerá aquí con su jornada, rivales y programación.")
                : isSeasonUpcoming
                  ? tx("Los partidos se mostrarán al comenzar la temporada o cuando el administrador termine de preparar el calendario.")
                  : tx("No hay partidos disponibles para esta temporada.")
            }
            action={
              activeScope === "mine"
                ? { label: tx("Ver calendario completo"), href: "/matches" }
                : canManageSeason
                  ? { label: tx("Administrar temporada"), href: "/admin/season" }
                  : roundSettings.availabilityRecommendationsEnabled
                    ? { label: tx("Revisar mi disponibilidad"), href: "/availability" }
                    : undefined
            }
          />
        ) : null}
      </div>
    </div>
  )
}
