"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MatchCard } from "@/components/matches/MatchCard"
import { AppCard } from "@/components/ui/AppCard"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMvp } from "@/context/MvpProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getNextMatch } from "@/lib/leagues"
import { getRoundMvpPlayerIds } from "@/lib/mvp"
import { formatShortDate } from "@/lib/rounds"
import {
  getRoundStatusBadgeClassName,
  getSeasonStatusBadgeClassName,
} from "@/lib/statusStyles"

export default function MatchesPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const { currentUserId } = useCurrentUser()
  const { isLeagueAdmin } = useLeagueAccess()
  const { votes } = useMvp()
  const { activeLeague, activeSeason, roundSettings, rounds, players, matches } =
    useCurrentLeagueData()
  const canManageSeason = isLeagueAdmin(activeLeague.id)
  const isSeasonClosed = activeSeason.status === "finished"
  const isSeasonUpcoming = activeSeason.status === "upcoming"
  const activeScope = searchParams.get("scope") === "mine" ? "mine" : "all"
  const currentUserMatches = matches.filter(
    (match) =>
      match.teamA.includes(currentUserId) || match.teamB.includes(currentUserId),
  )
  const allMatchesCount = matches.length
  const myMatchesCount = currentUserMatches.length
  const currentUserNextMatch = getNextMatch(currentUserMatches)
  const visibleMatches = matches.filter((match) =>
    activeScope === "mine"
      ? match.teamA.includes(currentUserId) || match.teamB.includes(currentUserId)
      : true
  )

  function getRoundWindowText(round: (typeof rounds)[number]) {
    if (!round.startsAt || !round.endsAt) {
      return null
    }

    return `${t.rounds.from} ${formatShortDate(round.startsAt)} ${
      t.rounds.to
    } ${formatShortDate(round.endsAt)}`
  }

  function getRoundStatusText(round: (typeof rounds)[number]) {
    const labelByStatus = {
      upcoming: t.rounds.statusUpcoming,
      active: t.rounds.statusActive,
      completed: t.rounds.statusCompleted,
    }

    return labelByStatus[round.status]
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-neutral-500">
          <span>{activeLeague.name} · {activeSeason.name}</span>
          {isSeasonClosed ? (
            <span className={getSeasonStatusBadgeClassName("finished")}>
              Terminada
            </span>
          ) : null}
        </p>

        <h1 className="mt-1 text-2xl font-black tracking-tight">
          {t.matches.subtitle}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.matches.description}
        </p>
      </header>


      <AppCard className="p-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-neutral-950">
              Vista del calendario
            </p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-500">
              {activeScope === "mine"
                ? "Solo tus partidos en esta temporada."
                : "Todos los partidos de la liga."}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-500">
            {visibleMatches.length}/{allMatchesCount}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/matches"
            className={`rounded-2xl px-3 py-2.5 text-center transition ${
              activeScope === "all"
                ? "bg-neutral-950 text-white shadow-sm"
                : "bg-neutral-100 text-neutral-700"
            }`}
          >
            <span className="block text-xs font-black">
              Liga completa
            </span>
            <span className={`mt-0.5 block text-[11px] font-semibold ${activeScope === "all" ? "text-white/70" : "text-neutral-500"}`}>
              {allMatchesCount} partidos
            </span>
          </Link>
          <Link
            href="/matches?scope=mine"
            className={`rounded-2xl px-3 py-2.5 text-center transition ${
              activeScope === "mine"
                ? "bg-neutral-950 text-white shadow-sm"
                : "bg-neutral-100 text-neutral-700"
            }`}
          >
            <span className="block text-xs font-black">
              Mis partidos
            </span>
            <span className={`mt-0.5 block text-[11px] font-semibold ${activeScope === "mine" ? "text-white/70" : "text-neutral-500"}`}>
              {myMatchesCount} partidos
            </span>
          </Link>
        </div>
      </AppCard>

      {isSeasonUpcoming ? (
        <AppCard className="border border-neutral-200 bg-neutral-50/80 px-3 py-2.5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
            Temporada próximamente
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-600">
            La temporada está creada, pero todavía no ha comenzado. Los partidos se desbloquearán al comenzar la temporada.
          </p>
          {canManageSeason ? (
            <Link
              href="/admin/season"
              className="mt-3 inline-flex rounded-2xl bg-neutral-950 px-3 py-2 text-xs font-black text-white"
            >
              Administrar temporada
            </Link>
          ) : null}
        </AppCard>
      ) : null}


      <div className="space-y-7">
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
            <section key={round.id} className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">{round.name}</h2>

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
              </div>

              <div className="space-y-4">
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    players={players}
                    roundStartsAt={round.startsAt}
                    roundEndsAt={round.endsAt}
                    headerMode="match-date"
                    highlightedPlayerIds={getRoundMvpPlayerIds({
                      leagueId: activeLeague.id,
                      seasonId: activeSeason.id,
                      round: match.round,
                      matches,
                      votes,
                      mvpSystem: roundSettings.mvpSystem,
                    })}
                    leagueLocations={activeLeague.locations}
                    showMissingScheduleHint={currentUserNextMatch?.id === match.id}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {visibleMatches.length === 0 ? (
          <AppCard>
            <p className="font-bold">
              {activeScope === "mine" ? "Todavía no tienes partidos en esta temporada." : t.matches.noMatches}
            </p>
          </AppCard>
        ) : null}
      </div>
    </div>
  )
}
