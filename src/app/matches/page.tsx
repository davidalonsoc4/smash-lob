"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MatchCard } from "@/components/matches/MatchCard"
import { AppCard } from "@/components/ui/AppCard"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getRoundMvpPlayerIds } from "@/lib/mvp"
import { formatShortDate } from "@/lib/rounds"

export default function MatchesPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const { currentUserId } = useCurrentUser()
  const { isLeagueAdmin } = useLeagueAccess()
  const { activeLeague, activeSeason, rounds, players, matches } =
    useCurrentLeagueData()
  const canManageSeason = isLeagueAdmin(activeLeague.id)
  const isSeasonClosed = activeSeason.status === "finished"
  const isSeasonUpcoming = activeSeason.status === "upcoming"
  const activeScope = searchParams.get("scope") === "mine" ? "mine" : "all"
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
        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <h1 className="mt-1 sl-page-title">
          {t.matches.subtitle}
        </h1>

        <p className="mt-1 sl-page-subtitle">
          {t.matches.description}
        </p>
      </header>


      <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-[0_1px_10px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
          Filtro
        </p>

        <div className="flex rounded-full border border-neutral-200 bg-neutral-50 p-1">
          <Link
            href="/matches"
            className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
              activeScope === "all"
                ? "bg-neutral-950 text-white shadow-sm"
                : "text-neutral-500"
            }`}
          >
            Todos
          </Link>
          <Link
            href="/matches?scope=mine"
            className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
              activeScope === "mine"
                ? "bg-neutral-950 text-white shadow-sm"
                : "text-neutral-500"
            }`}
          >
            Mis partidos
          </Link>
        </div>
      </div>

      {isSeasonUpcoming ? (
        <AppCard className="border border-neutral-200 bg-neutral-50/80 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
            Temporada próximamente
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-600">
            La temporada está creada, pero todavía no ha comenzado. Los partidos se desbloquearán al comenzar la temporada.
          </p>
          {canManageSeason ? (
            <Link
              href="/admin/season"
              className="sl-primary-action mt-3 inline-flex rounded-2xl px-3 py-2 text-xs font-black"
            >
              Administrar temporada
            </Link>
          ) : null}
        </AppCard>
      ) : null}

      {isSeasonClosed ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-500">
          <span className="min-w-0 truncate">
            Temporada terminada · {activeSeason.name}
          </span>

          {canManageSeason ? (
            <Link
              href="/admin/season"
              className="shrink-0 font-black text-neutral-900 underline-offset-4 active:underline"
            >
              Gestionar
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-5">
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
            <section key={round.id} className="space-y-3">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">{round.name}</h2>

                  {roundStatusText ? (
                    <span className="sl-quiet-label rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em]">
                      {roundStatusText}
                    </span>
                  ) : null}
                </div>

                {roundWindowText ? (
                  <p className="mt-1 sl-page-subtitle">
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
                    })}
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
