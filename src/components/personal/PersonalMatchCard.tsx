"use client"

import { MatchOutcomeBadge } from "@/components/matches/MatchOutcomeBadge"
import type { ReactNode } from "react"

import Link from "next/link"
import { useI18n } from "@/i18n/I18nProvider"
import { useRouter } from "next/navigation"
import { MatchEventMeta } from "@/components/matches/MatchEventMeta"
import { SetGameScore } from "@/components/matches/SetGameScore"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { AppCard } from "@/components/ui/AppCard"
import { FitText } from "@/components/ui/FitText"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { normalizeAccentColor } from "@/lib/visualStyle"
import { getMatchDisplayStatus } from "@/lib/matchLifecycle"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
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

type PersonalMatchCardProps = { match: PersonalMatchItem; hideEventMeta?: boolean; compactBadges?: boolean }

function MatchCardContent({ match, hideEventMeta = false, compactBadges = false, navigation }: PersonalMatchCardProps & { navigation: ReactNode }) {
  const { tx } = useI18n()
  const { userLeagues } = useLeagueAccess()
  const league = userLeagues.find(item => item.id === match.leagueId)
  const teamA = getPersonalMatchTeamPlayers(match.participants, 1)
  const teamB = getPersonalMatchTeamPlayers(match.participants, 2)
  const setWins = getPersonalMatchSetWins(match.sets)
  const outcome = getPersonalMatchOutcome(match)
  const displayStatus = getMatchDisplayStatus({
    status: match.status,
    scheduledAt: match.scheduledAt,
    resultRecordedAt: match.resultRecordedAt,
  })
  const isFinished = displayStatus === "finished"

  return (
    <AppCard className="relative !p-3 transition active:scale-[0.99]">
      <div className={`mb-2 flex justify-between gap-3 ${!isFinished ? "items-start" : "items-center"}`}>
        <span
          data-personal-match-origin={match.origin}
          data-league-accent={match.origin === "league" && league ? normalizeAccentColor(league.accentColor) : undefined}
          className={`min-w-0 max-w-[58%] shrink rounded-xl type-caption ${compactBadges ? "px-2 py-0.5 font-semibold tracking-normal !border-0" : "border px-2 py-1 font-black uppercase tracking-wide"} ${getPersonalMatchOriginBadgeClass(match)}`}
          style={getPersonalMatchOriginBadgeStyle(match, league ? normalizeAccentColor(league.accentColor) : undefined)}
        >
          <FitText>{getPersonalMatchOriginLabel(match)}</FitText>
        </span>

        {isFinished ? (
          <MatchOutcomeBadge outcome={outcome === "win" ? "victory" : outcome === "loss" ? "defeat" : "finished"} />
        ) : (
          <MatchStatusBadge
            variant="dot"
            status={match.status}
            scheduledAt={match.scheduledAt}
            resultRecordedAt={match.resultRecordedAt}
            isParticipant={match.participants.some(participant => participant.isCurrentUser)}
          />
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
                  aria-label={tx("Juegos por set de la pareja A")}
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
                  aria-label={tx("Sets ganados por la pareja A")}
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
                  aria-label={tx("Juegos por set de la pareja B")}
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
                  aria-label={tx("Sets ganados por la pareja B")}
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
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 type-caption font-black uppercase text-neutral-600">
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

      {!hideEventMeta ? <MatchEventMeta
        eventAt={match.scheduledAt}
        locationText={match.scheduleLocation ?? match.locationName}
        locationFallback={null}
        hideMissingRows
      /> : null}
      {navigation}
    </AppCard>
  )
}

export function PersonalMatchCard({ match, hideEventMeta = false, compactBadges = false }: PersonalMatchCardProps) {
  const { tx } = useI18n()
  const router = useRouter()
  const { activateLeague } = useActiveLeague()

  if (match.origin === "friendly") {
    return (
      <MatchCardContent match={match} hideEventMeta={hideEventMeta} compactBadges={compactBadges} navigation={<Link href={`/personal-matches/${encodeURIComponent(match.id)}`} className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={tx(`Abrir partido de ${tx("Amistoso")}`)} />} />
    )
  }

  return (
    <MatchCardContent match={match} hideEventMeta={hideEventMeta} compactBadges={compactBadges} navigation={<button
      type="button"
      className="absolute inset-0 w-full rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-offset-2"
      onClick={() => {
        if (!match.leagueId || !activateLeague(match.leagueId)) return
        router.push(`/match/${encodeURIComponent(match.id)}`)
      }}
      aria-label={tx(`Abrir partido de ${match.leagueName ?? tx("liga")}`)}
    />} />
  )
}
