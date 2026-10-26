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
import { formatShortDate } from "@/lib/rounds"
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
  const { tx, locale } = useI18n()
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
            status={match.preview && !match.scheduledAt ? "scheduling" : match.status}
            scheduledAt={match.scheduledAt}
            resultRecordedAt={match.resultRecordedAt}
            isParticipant={match.participants.some(participant => participant.isCurrentUser)}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        {match.preview?.hidden ? <div className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 px-3 py-4 text-center"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 text-neutral-500"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><p className="text-sm font-semibold text-neutral-600">{tx("Emparejamientos por revelar")}</p></div> : isFinished ? (
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

      {!hideEventMeta && match.preview && !match.scheduledAt ? <div className="mt-3 flex min-h-10 items-center text-xs font-semibold text-neutral-500"><p>{match.preview.currentRound && !match.preview.hidden ? tx("Te toca jugar esta jornada. Acuerda fecha con los demás.") : tx("Próxima jornada")}{match.preview.startsAt ? <span className="mt-1 block">{match.preview.startsAt.includes("T") ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale === "eu" ? "eu-ES" : "es-ES",{dateStyle:"medium",timeStyle:"short"}).format(new Date(match.preview.startsAt)) : `${formatShortDate(match.preview.startsAt,locale)}${match.preview.endsAt ? ` · ${formatShortDate(match.preview.endsAt,locale)}` : ""}`}</span> : null}</p></div> : null}
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
        router.push(match.preview?.hidden ? "/" : `/match/${encodeURIComponent(match.id)}`)
      }}
      aria-label={tx(`Abrir partido de ${match.leagueName ?? tx("liga")}`)}
    />} />
  )
}
