"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MatchEventMeta } from "@/components/matches/MatchEventMeta"
import { SetGameScore } from "@/components/matches/SetGameScore"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { AppCard } from "@/components/ui/AppCard"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import {
  getPersonalMatchOriginBadgeClass,
  getPersonalMatchOriginBadgeStyle,
  getPersonalMatchOriginLabel,
  getPersonalMatchOutcome,
  getPersonalMatchSetWins,
  getPersonalMatchTeamPlayers,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

const showPersonalMatchChevron = false

function MatchCardContent({ match }: { match: PersonalMatchItem }) {
  const teamA = getPersonalMatchTeamPlayers(match.participants, 1)
  const teamB = getPersonalMatchTeamPlayers(match.participants, 2)
  const setWins = getPersonalMatchSetWins(match.sets)
  const outcome = getPersonalMatchOutcome(match)
  const isFinished = match.status === "finished"

  return (
    <AppCard className="relative !p-3 transition active:scale-[0.99]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span
          className={`max-w-[58%] shrink truncate rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${getPersonalMatchOriginBadgeClass(match)}`}
          style={getPersonalMatchOriginBadgeStyle(match)}
        >
          {getPersonalMatchOriginLabel(match)}
        </span>

        {isFinished ? (
          <span
            className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide leading-none ${
              outcome === "win"
                ? "bg-green-100 text-green-800"
                : outcome === "loss"
                  ? "bg-red-100 text-red-800"
                  : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {outcome === "win"
              ? "Victoria"
              : outcome === "loss"
                ? "Derrota"
                : "Finalizado"}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
            Programado
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isFinished ? (
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-stretch justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2">
              <div className="flex min-w-0 flex-1 flex-col gap-y-0.5">
                {teamA.map((participant) => (
                  <p
                    key={`a-${participant.slot}`}
                    className="truncate text-sm font-black leading-5 text-neutral-950"
                  >
                    {participant.displayName}
                  </p>
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-1 self-center">
                <div
                  className="flex items-center gap-1"
                  aria-label="Juegos por set de la pareja A"
                >
                  {match.sets.map((set, index) => (
                    <SetGameScore
                      key={index}
                      value={set.a}
                      won={set.a > set.b}
                    />
                  ))}
                </div>
                <span
                  className="ml-1 flex min-w-8 items-center justify-center rounded-md border border-neutral-200 bg-white px-2 py-1 text-base font-black text-neutral-900 shadow-sm"
                  aria-label="Sets ganados por la pareja A"
                >
                  {setWins.a}
                </span>
              </div>
            </div>

            <div className="flex items-stretch justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2">
              <div className="flex min-w-0 flex-1 flex-col gap-y-0.5">
                {teamB.map((participant) => (
                  <p
                    key={`b-${participant.slot}`}
                    className="truncate text-sm font-black leading-5 text-neutral-950"
                  >
                    {participant.displayName}
                  </p>
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-1 self-center">
                <div
                  className="flex items-center gap-1"
                  aria-label="Juegos por set de la pareja B"
                >
                  {match.sets.map((set, index) => (
                    <SetGameScore
                      key={index}
                      value={set.b}
                      won={set.b > set.a}
                    />
                  ))}
                </div>
                <span
                  className="ml-1 flex min-w-8 items-center justify-center rounded-md border border-neutral-200 bg-white px-2 py-1 text-base font-black text-neutral-900 shadow-sm"
                  aria-label="Sets ganados por la pareja B"
                >
                  {setWins.b}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_30px_minmax(0,1fr)] items-stretch gap-2">
            <div className="min-w-0 rounded-xl bg-neutral-50 px-3 py-2.5">
              <div className="flex min-w-0 flex-col gap-y-1">
                {teamA.map((participant) => (
                  <p
                    key={`a-${participant.slot}`}
                    className="truncate text-sm font-black leading-tight text-neutral-950"
                  >
                    {participant.displayName}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-[9px] font-black uppercase text-neutral-600">
                VS
              </span>
            </div>

            <div className="min-w-0 rounded-xl bg-neutral-50 px-3 py-2.5 text-right">
              <div className="flex min-w-0 flex-col items-end gap-y-1">
                {teamB.map((participant) => (
                  <p
                    key={`b-${participant.slot}`}
                    className="max-w-full truncate text-sm font-black leading-tight text-neutral-950"
                  >
                    {participant.displayName}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {showPersonalMatchChevron ? <ClickableChevron className="shrink-0" /> : null}
      </div>

      <MatchEventMeta
        eventAt={match.scheduledAt}
        locationText={match.locationName}
        locationFallback={null}
        hideMissingRows
      />
    </AppCard>
  )
}

export function PersonalMatchCard({ match }: { match: PersonalMatchItem }) {
  const router = useRouter()
  const { activateLeague } = useActiveLeague()

  if (match.origin === "friendly") {
    return (
      <Link href={`/personal-matches/${encodeURIComponent(match.id)}`} className="block">
        <MatchCardContent match={match} />
      </Link>
    )
  }

  return (
    <button
      type="button"
      className="block w-full text-left"
      onClick={() => {
        if (!match.leagueId || !activateLeague(match.leagueId)) return
        router.push(`/match/${encodeURIComponent(match.id)}`)
      }}
      aria-label={`Abrir partido de ${match.leagueName ?? "liga"}`}
    >
      <MatchCardContent match={match} />
    </button>
  )
}
