"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { AppCard } from "@/components/ui/AppCard"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import {
  formatPersonalMatchDate,
  formatPersonalMatchTime,
  getPersonalMatchOriginBadgeClass,
  getPersonalMatchOriginLabel,
  getPersonalMatchOverallScore,
  getPersonalMatchTeamPlayers,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

function MatchCardContent({ match }: { match: PersonalMatchItem }) {
  const eventAt = match.scheduledAt ?? match.resultRecordedAt
  const teamA = getPersonalMatchTeamPlayers(match.participants, 1)
  const teamB = getPersonalMatchTeamPlayers(match.participants, 2)
  const meta = [formatPersonalMatchTime(eventAt), match.locationName]
    .filter(Boolean)
    .join(" · ")

  return (
    <AppCard className="relative !p-3 transition active:scale-[0.99]">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`min-w-0 truncate rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${getPersonalMatchOriginBadgeClass(match)}`}
        >
          {getPersonalMatchOriginLabel(match)}
        </span>
        <span className="shrink-0 text-[10px] font-bold text-neutral-400">
          {formatPersonalMatchDate(eventAt)}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5">
            <div className="min-w-0">
              {teamA.map((participant) => (
                <p
                  key={`a-${participant.slot}`}
                  className="truncate text-sm font-black leading-5 text-neutral-950"
                >
                  {participant.displayName}
                </p>
              ))}
            </div>
            {match.status === "finished" ? (
              <p className="self-center text-lg font-black text-neutral-950">
                {getPersonalMatchOverallScore(match.sets)}
              </p>
            ) : (
              <span className="self-center rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-blue-700">
                Programado
              </span>
            )}

            <div className="col-span-2 my-1 h-px bg-neutral-100" />

            <div className="min-w-0">
              {teamB.map((participant) => (
                <p
                  key={`b-${participant.slot}`}
                  className="truncate text-sm font-black leading-5 text-neutral-950"
                >
                  {participant.displayName}
                </p>
              ))}
            </div>
          </div>
        </div>

        <ClickableChevron className="shrink-0" />
      </div>

      <p className="mt-2 truncate border-t border-neutral-100 pt-2 text-[11px] font-semibold text-neutral-500">
        {meta || "Ubicación no indicada"}
      </p>
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
