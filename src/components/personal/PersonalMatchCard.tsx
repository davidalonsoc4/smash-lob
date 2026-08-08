"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { SetGameScore } from "@/components/matches/SetGameScore"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { AppCard } from "@/components/ui/AppCard"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import {
  formatPersonalMatchDate,
  formatPersonalMatchTime,
  getPersonalMatchOriginBadgeClass,
  getPersonalMatchOriginLabel,
  getPersonalMatchOutcome,
  getPersonalMatchSetWins,
  getPersonalMatchTeamPlayers,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

function MatchCardContent({ match }: { match: PersonalMatchItem }) {
  const eventAt = match.scheduledAt ?? match.resultRecordedAt
  const teamA = getPersonalMatchTeamPlayers(match.participants, 1)
  const teamB = getPersonalMatchTeamPlayers(match.participants, 2)
  const setWins = getPersonalMatchSetWins(match.sets)
  const outcome = getPersonalMatchOutcome(match)
  const isFinished = match.status === "finished"
  const timeLabel = eventAt ? formatPersonalMatchTime(eventAt) : null

  return (
    <AppCard className="relative !p-3 transition active:scale-[0.99]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-neutral-500">
          {formatPersonalMatchDate(eventAt)}
          {timeLabel ? ` · ${timeLabel}` : ""}
        </p>

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

            {isFinished ? (
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
            ) : null}
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

            {isFinished ? (
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
            ) : null}
          </div>
        </div>

        <ClickableChevron className="shrink-0" />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2">
        <p className="min-w-0 truncate text-[11px] font-semibold text-neutral-500">
          {match.locationName || "Ubicación no indicada"}
        </p>
        <span
          className={`max-w-[45%] shrink-0 truncate rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${getPersonalMatchOriginBadgeClass(match)}`}
        >
          {getPersonalMatchOriginLabel(match)}
        </span>
      </div>
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
