"use client"

import { MatchCard } from "@/components/matches/MatchCard"
import { AppCard } from "@/components/ui/AppCard"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { formatShortDate } from "@/lib/rounds"

export default function MatchesPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason, rounds, matches } =
    useCurrentLeagueData()

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
      "no-window": "",
      upcoming: t.rounds.statusUpcoming,
      active: t.rounds.statusActive,
      overdue: t.rounds.statusOverdue,
      completed: t.rounds.statusCompleted,
    }

    return labelByStatus[round.status]
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {t.matches.subtitle}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.matches.description}
        </p>
      </header>

      <div className="space-y-6">
        {rounds.map((round) => {
          const roundMatches = matches.filter(
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
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
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

              <div className="space-y-3">
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    roundStartsAt={round.startsAt}
                    roundEndsAt={round.endsAt}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {matches.length === 0 ? (
          <AppCard>
            <p className="font-bold">{t.matches.noMatches}</p>
          </AppCard>
        ) : null}
      </div>
    </div>
  )
}