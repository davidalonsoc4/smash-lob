"use client"

import Link from "next/link"
import type { CSSProperties } from "react"
import styles from "./CompetitionsOverview.module.css"
import { CalendarEventButton } from "@/components/calendar/CalendarEventButton"
import { useEffect, useState } from "react"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { PersonalMatchCard } from "@/components/personal/PersonalMatchCard"
import { BackButton } from "@/components/ui/BackButton"
import { AppCard } from "@/components/ui/AppCard"
import { MatchSlides } from "@/components/ui/MatchSlides"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { selectCompetitionHighlights, selectCompetitionPreview } from "@/lib/competitionOverview"
import { calculateLeaguePairRanking } from "@/lib/leaguePairRanking"
import { calculateSeasonRanking } from "@/lib/ranking"
import { getMatchResultConfirmationState } from "@/lib/resultConfirmations"
import { isMatchCompetitionComplete } from "@/lib/matchLifecycle"
import { getSeasonStatusBadgeClassName, softStatusBadgeClassName } from "@/lib/statusStyles"
import { isRoundRevealedToPlayers } from "@/lib/progressiveCalendar"
import { getLeagueActivityMatches } from "@/lib/leagueActivity"
import type { PersonalMatchItem, PersonalMatchesDashboardPayload } from "@/lib/personalMatches"
import { normalizeAccentColor } from "@/lib/visualStyle"
import { getSeasonPreviewCountdown, SCHEDULED_SEASON_TIME_ZONE } from "@/lib/seasonScheduling"

const actionClass = "app-action-button flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-center text-sm font-black text-neutral-900 transition active:bg-neutral-100"

export function CompetitionsOverview({ view = "summary" }: { view?: "summary" | "leagues" | "tournaments" }) {
  const { t, tx, locale } = useI18n()
  const { changeActiveLeague } = useActiveLeague()
  const { canCreateLeagues, getMembershipForLeague, isLeagueAdmin, isLeagueSpectator, userLeagues } = useLeagueAccess()
  const canCreateCompetition = canCreateLeagues
  const memberLeagues = userLeagues.filter(league => getMembershipForLeague(league.id))
  const { matches, resultConfirmations } = useMatchData()
  const { seasons, playerProfiles, seasonPlayers, getActiveSeasonByLeagueId, getSeasonRoundSettings } = useSeasonSettings()
  const countedMatches = matches.map(match => ({
    ...match,
    resultCounts: match.rankingCounts !== false && getMatchResultConfirmationState({
      matchId: match.id,
      participantIds: [...match.teamA, ...match.teamB],
      reporterPlayerId: match.resultReportedByPlayerId,
      resultRecordedAt: match.resultRecordedAt,
      resultLocked: match.resultLocked,
      confirmations: resultConfirmations,
      mode: getSeasonRoundSettings(match.seasonId).resultConfirmationMode,
    }).countsForRanking,
  }))
  const [dashboard, setDashboard] = useState<PersonalMatchesDashboardPayload | null>(null)
  const [tournaments, setTournaments] = useState<Array<{ id: string; name: string; description: string; startsAt: string; createdAt?: string; status: "draft" | "in_progress" | "finished" }>>([])
  const [tournamentLoadError, setTournamentLoadError] = useState(false)
  const [tournamentRequestVersion, setTournamentRequestVersion] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [activityIndex, setActivityIndex] = useState(0)
  useEffect(() => {
    if (view !== "summary") return
    const controller = new AbortController()
    fetch("/api/personal-matches?limit=10&offset=0&includeUpcoming=1", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("lookup_failed"); return response.json() as Promise<PersonalMatchesDashboardPayload> })
      .then(data => { if (!controller.signal.aborted) setDashboard(data) })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true) })
    return () => { controller.abort() }
  }, [view])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (view === "leagues") return
    const controller = new AbortController()
    fetch("/api/tournaments", { cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("tournaments_failed"); return response.json() })
      .then((data) => { if (!controller.signal.aborted) { setTournaments(Array.isArray(data?.tournaments) ? data.tournaments : []); setTournamentLoadError(false) } })
      .catch(() => { if (!controller.signal.aborted) setTournamentLoadError(true) })
    return () => controller.abort()
  }, [tournamentRequestVersion, view])
  const ownLeagueMatches: PersonalMatchItem[] = seasons.flatMap(season => {
    const league = userLeagues.find(item => item.id === season.leagueId), playerId = getMembershipForLeague(season.leagueId)?.playerId
    if (!league || !playerId || isLeagueSpectator(league.id) || !seasonPlayers.some(row => row.seasonId === season.id && row.playerId === playerId && row.status !== "withdrawn")) return []
    return getLeagueActivityMatches({ league, season, settings:getSeasonRoundSettings(season.id), matches:matches.filter(match=>match.seasonId===season.id), playerId, profiles:playerProfiles, now })
  })
  const dashboardMatches = [...(dashboard?.upcoming ?? []), ...(dashboard?.items ?? [])].filter(item => {
    if(item.origin !== "league") return true
    const season=seasons.find(season=>season.id===item.seasonId)
    return season?.status !== "upcoming" && (!season || isRoundRevealedToPlayers({round:item.round??1,seasonStatus:season.status,totalRounds:season.totalRounds,settings:getSeasonRoundSettings(season.id),matches:matches.filter(match=>match.seasonId===season.id),now}))
  })
  const highlights = selectCompetitionHighlights([...ownLeagueMatches, ...dashboardMatches], now)
  const visibleActivityIndex = Math.min(activityIndex, Math.max(0, highlights.length - 1))
  const leagueRows = memberLeagues.map(league => ({ league, season: getActiveSeasonByLeagueId(league.id) }))
  const statusOrder = { active: 0, upcoming: 1, finished: 2 }
  const orderedLeagues = [...leagueRows].sort((a, b) => statusOrder[a.season.status] - statusOrder[b.season.status])
  const relevantLeagues = selectCompetitionPreview(leagueRows.map(item => {
    const settings = getSeasonRoundSettings(item.season.id)
    return { item, phase: item.season.status, startsAt: settings.scheduledStartAt ?? settings.seasonStartsAt, createdAt: item.season.createdAt }
  }))
  const visibleLeagues = view === "summary" ? relevantLeagues : orderedLeagues.filter(item => item.season.status !== "finished")
  const finishedLeagues = orderedLeagues.filter(item => item.season.status === "finished")
  const orderedTournaments = [...tournaments].sort((a, b) => {
    const order = { in_progress: 0, draft: 1, finished: 2 }
    return order[a.status] - order[b.status] || Date.parse(a.startsAt) - Date.parse(b.startsAt)
  })
  const finishedTournaments = orderedTournaments.filter((item) => item.status === "finished")
  const visibleTournaments = view === "summary" ? selectCompetitionPreview(orderedTournaments.map(item => ({
    item, phase: item.status === "in_progress" ? "active" as const : item.status === "draft" ? "upcoming" as const : "finished" as const,
    startsAt: item.startsAt, createdAt: item.createdAt,
  }))) : orderedTournaments.filter((item) => item.status !== "finished")
  function startPreviewLabel(startsAt?: string | null) {
    const countdown = getSeasonPreviewCountdown(startsAt, now)
    if (!countdown) return tx("Próximamente")
    return countdown.days > 1 ? tx("Empieza en {days} días").replace("{days}", String(countdown.days))
      : countdown.days === 1 ? tx("Mañana")
        : `${tx("Hoy")} · ${new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { hour: "2-digit", minute: "2-digit", timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(new Date(countdown.startsAt))}`
  }
  function tournamentRow(item: (typeof tournaments)[number]) {
    const label = item.status === "in_progress" ? tx("En curso") : item.status === "finished" ? tx("Finalizado") : startPreviewLabel(item.startsAt)
    return <Link key={item.id} href={`/tournaments/${item.id}`} className={`${view === "summary" ? styles.tournament : "border-neutral-200 bg-white shadow-sm"} flex min-h-16 items-center gap-3 rounded-2xl border p-3 transition active:scale-[0.99]`}>
      <span aria-hidden="true" className={`${view === "summary" ? styles.trophy : "bg-neutral-100 text-neutral-700"} flex h-11 w-11 shrink-0 items-center justify-center rounded-xl`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6"><path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v5m-4 3h8m-7-3h6v3H9z" /></svg></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-base font-black">{item.name}</span><span className="mt-1 flex items-center justify-between gap-2"><span className="min-w-0 truncate text-xs font-semibold text-neutral-500">{new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.startsAt))}</span><span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${item.status === "in_progress" ? styles.runningStatus : "text-neutral-600"}`}>{item.status === "in_progress" ? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" /> : null}{label}</span></span></span><span aria-hidden="true" className="text-neutral-400">›</span></Link>
  }
  function leagueRow({ league, season }: (typeof leagueRows)[number]) {
    const status = season.totalRounds === 0 ? tx("Sin temporada") : season.status === "active" ? tx("En curso") : season.status === "upcoming" ? tx("Próximamente") : tx("Terminada")
    const running = season.totalRounds > 0 && season.status === "active"
    const summaryStatus = running ? tx("En curso") : season.totalRounds > 0 && season.status === "upcoming"
      ? startPreviewLabel(getSeasonRoundSettings(season.id).scheduledStartAt ?? getSeasonRoundSettings(season.id).seasonStartsAt) : status
    const isAdmin = isLeagueAdmin(league.id)
    const isSpectator = isLeagueSpectator(league.id)
    const seasonMatches = countedMatches.filter(match => match.leagueId === league.id && match.seasonId === season.id)
    const finishedMatches = seasonMatches.filter(isMatchCompetitionComplete).length
    const seasonPlayerCount = seasonPlayers.filter(player => player.seasonId === season.id).length
    const ranking = (league.modality === "fixed_pairs" ? calculateLeaguePairRanking : calculateSeasonRanking)({ seasonId: season.id, playerProfiles, seasonPlayers, matches: countedMatches })
    const leader = ranking.find(player => player.points > 0) ?? null
    return <button key={league.id} type="button" onClick={() => changeActiveLeague(league.id)} aria-label={tx(`Entrar en ${league.name}`)} data-phase={season.totalRounds ? season.status : "empty"} style={{ "--league-card-accent": normalizeAccentColor(league.accentColor) } as CSSProperties} className={`${view === "summary" ? styles.league : styles.leagueCard} w-full rounded-2xl border text-left transition active:scale-[0.99] ${view === "leagues" ? "p-4" : "p-3"}`}>
      <span className={`flex min-w-0 gap-3 ${view === "summary" ? "items-center" : "items-start"}`}>
        <span className={view === "leagues" ? styles.logoWell : "shrink-0"}><LeagueLogo league={league} size={view === "leagues" ? "lg" : "md"} /></span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`min-w-0 flex-1 font-black text-neutral-950 ${view === "leagues" ? "break-words text-lg leading-tight" : "truncate text-base"}`}>{league.name}</span>
          </span>
          {view === "leagues" ? <>
            <span className="mt-1 block text-xs font-semibold text-neutral-600">{season.name}</span>
            <span className="mt-1 block text-xs text-neutral-500">{tx(league.modality === "fixed_pairs" ? "Parejas fijas" : "Individual de Smash & Lob")}</span>
          </> : <span className="mt-1 flex items-center justify-between gap-2"><span className="min-w-0 flex-1 truncate text-xs text-neutral-500">{season.name}</span><span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${running ? styles.runningStatus : "text-neutral-600"}`}>{running ? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" /> : null}{summaryStatus}</span></span>}
        </span>
        {view !== "leagues" ? <span aria-hidden="true" className="self-center text-neutral-400">›</span> : null}
      </span>
      {view === "leagues" ? <>
        {league.description ? <span className="mt-3 block line-clamp-2 text-xs leading-relaxed text-neutral-500">{league.description}</span> : null}
        <span className="my-3 flex flex-wrap items-center justify-between gap-2">
          <span className={`${getSeasonStatusBadgeClassName(season.status, season.totalRounds)} ${softStatusBadgeClassName} inline-flex items-center gap-1.5`}>
            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${running ? "bg-emerald-500" : season.totalRounds > 0 && season.status === "upcoming" ? "bg-sky-500" : "bg-neutral-400"}`} />{summaryStatus}
          </span>
          {isAdmin || isSpectator ? <span className="text-xs font-medium text-neutral-500">{tx(isAdmin ? "Admin" : "Espectador")}</span> : null}
        </span>
        <span className={`${styles.leagueMetrics} grid grid-cols-[0.8fr_1fr_1.7fr] gap-3`}>
          <span className="min-w-0"><span className="block type-caption font-medium text-neutral-500">{tx("Jugadores")}</span><span className="mt-1 block text-base font-black tabular-nums text-neutral-950">{seasonPlayerCount || "—"}</span></span>
          <span className="min-w-0"><span className="block type-caption font-medium text-neutral-500">{tx("Partidos")}</span><span className="mt-1 block text-base font-black tabular-nums text-neutral-950">{finishedMatches}<span className="text-xs font-medium text-neutral-500"> / {seasonMatches.length}</span></span></span>
          <span className="min-w-0"><span className="block type-caption font-medium text-neutral-500">{tx("Líder")}</span><span className="mt-1 block truncate text-sm font-bold leading-6 text-neutral-950">{leader?.displayName ?? "—"}</span></span>
        </span>
        {seasonMatches.length > 0 ? <span aria-hidden="true" className={styles.progressTrack}><span className={`${styles.progress} block h-full rounded-full`} style={{ width: `${Math.min(100, finishedMatches / seasonMatches.length * 100)}%` }} /></span> : null}
      </> : null}
    </button>
  }
  return <div className={`${styles.overview} space-y-5`}>
    <header className="app-page-header">
      {view !== "summary" ? <BackButton fallbackHref="/leagues" label={t.common.back} /> : null}
      <h1 id="competitions-page-title" className="type-page-title mt-3 text-2xl font-black tracking-tight">{tx(view === "summary" ? "Mis Competiciones" : view === "leagues" ? "Mis ligas" : "Mis torneos")}{view === "leagues" ? <span className="ml-2 text-base font-medium text-neutral-400">{memberLeagues.length}</span> : null}</h1>
    </header>
    {view === "summary" ? <section aria-labelledby="personal-activity" className={`${styles.activityHero} space-y-2`}>
      <div data-activity-heading className="app-section-header flex items-center justify-between gap-2">
        <h2 id="personal-activity" className="type-panel-title min-w-0 font-black">{tx("Actividad personal")}</h2>
        {highlights.length ? <p className="min-w-0 text-right text-xs font-semibold text-neutral-500">{tx(highlights[visibleActivityIndex].kind === "live" ? "Tu partido en curso" : highlights[visibleActivityIndex].kind === "next" ? "Tu próximo partido" : "Tu último encuentro")}</p> : null}
      </div>
      {!dashboard && !loadError ? <AppCard><p role="status" className="text-sm text-neutral-500">{tx("Cargando tus partidos…")}</p></AppCard> : loadError ? <AppCard><p role="alert" className="text-sm text-neutral-500">{tx("No se ha podido cargar tu actividad personal.")}</p></AppCard> : highlights.length ? <>
        <div className={styles.activitySlides}><MatchSlides index={visibleActivityIndex} onChange={setActivityIndex} label={tx("Actividad personal")}>
          {highlights.map(highlight => <div key={highlight.kind} className={`relative h-full ${highlight.kind === "next" ? styles.withCalendar : ""}`}>
            <PersonalMatchCard match={highlight.match} hideEventMeta={highlight.kind === "last"} compactBadges />
            {highlight.kind === "next" && highlight.match.scheduledAt ? <div className="absolute bottom-3 right-3 z-10"><CalendarEventButton event={{ title: `${highlight.match.leagueName ?? tx("Partido")}: ${highlight.match.participants.filter(player => player.team === 1).map(player => player.displayName).join(" / ")} vs ${highlight.match.participants.filter(player => player.team === 2).map(player => player.displayName).join(" / ")}`, description: highlight.match.seasonName ?? "Smash & Lob", start: highlight.match.scheduledAt, location: highlight.match.locationName }} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-neutral-500 transition hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2"><span className="sr-only">{tx("Añadir al calendario")}</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M8 2v4m8-4v4M3 10h18M14 17h6m-3-3v6M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></svg></CalendarEventButton></div> : null}
          </div>)}
        </MatchSlides></div>
        {highlights.length > 1 ? <div className="match-preview-pagination flex justify-center gap-1.5 pt-1" aria-hidden="true">{highlights.map((highlight, index) => <span key={highlight.kind} className={`h-1.5 rounded-full transition-all ${index === visibleActivityIndex ? "w-5 bg-foreground" : "w-1.5 bg-neutral-300"}`} />)}</div> : null}
      </> : <AppCard><p className="text-sm font-semibold text-neutral-500">{tx("Todavía no tienes encuentros para mostrar.")}</p></AppCard>}
    </section> : null}
    {(view === "leagues" || memberLeagues.length > 0 || canCreateCompetition) && (view === "summary" || view === "leagues") ? <section aria-labelledby={view === "summary" ? "competitions-leagues" : "competitions-page-title"} className={`${styles.competitionSection} space-y-2`}>
      {view === "summary" ? <div className="app-section-header flex items-center justify-between gap-2"><h2 id="competitions-leagues" className="type-panel-title font-black">{tx("Mis ligas")}</h2>
        <Link href="/leagues/all" className="app-section-action inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">{tx("Ver todas")} <span aria-hidden="true">›</span></Link></div> : null}
      {visibleLeagues.map(leagueRow)}
      {!visibleLeagues.length ? <AppCard><p className="text-sm font-semibold text-neutral-500">{tx(memberLeagues.length ? "No tienes ligas activas o próximas." : "Aún no formas parte de ninguna liga.")}</p>{view === "summary" && canCreateCompetition ? <Link href="/league/new" className={`${actionClass} mt-3`}>{tx("Crear nueva liga")}</Link> : null}</AppCard> : null}
      {view === "leagues" ? <>
        {finishedLeagues.length ? <details className={`${styles.archive} rounded-2xl border p-3`}><summary className="cursor-pointer py-2 text-sm font-black">{tx("Finalizadas")} · {finishedLeagues.length}</summary><div className="mt-2 space-y-2">{finishedLeagues.map(leagueRow)}</div></details> : null}
        <div className="grid gap-2 pt-2"><Link href="/invite" className={actionClass}>{tx("Unirme con invitación")}</Link>
          {canCreateLeagues ? <Link href="/league/new" className={actionClass}>{tx("Crear nueva liga")}</Link> : null}</div>
      </> : null}
    </section> : null}
    {(view === "tournaments" || tournaments.length > 0 || canCreateCompetition) && (view === "summary" || view === "tournaments") ? <section aria-labelledby="competitions-tournaments" className={`${view === "summary" ? styles.competitionSection : ""} space-y-2`}>
      <div className="app-section-header flex items-center justify-between gap-2"><h2 id="competitions-tournaments" className="type-panel-title font-black">{tx("Mis torneos")} {view !== "summary" ? <span className="text-neutral-400">· {tournaments.length}</span> : null}</h2>{view === "summary" ? <Link href="/tournaments" className="app-section-action inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">{tx("Ver todos")} <span aria-hidden="true">›</span></Link> : <Link href="/tournaments/new" className="min-h-11 inline-flex shrink-0 items-center text-sm font-black underline underline-offset-4">{tx("Crear")}</Link>}</div>
      {tournamentLoadError ? <AppCard><p role="alert" className="text-sm font-semibold text-neutral-500">{tx("No se han podido cargar tus torneos.")}</p><button type="button" onClick={() => setTournamentRequestVersion((value) => value + 1)} className="mt-2 text-sm font-black underline">{tx("Reintentar")}</button></AppCard> : visibleTournaments.map(tournamentRow)}
      {!tournamentLoadError && !visibleTournaments.length ? <AppCard><p className="text-sm font-semibold text-neutral-500">{tx("Todavía no tienes torneos.")}</p>{view === "summary" ? <Link href="/tournaments/new" className={`${actionClass} mt-3`}>{tx("Crear torneo rápido")}</Link> : null}</AppCard> : null}
      {view === "tournaments" && finishedTournaments.length ? <details className="rounded-2xl border border-neutral-200 p-3"><summary className="cursor-pointer py-2 text-sm font-black">{tx("Finalizados")} · {finishedTournaments.length}</summary><div className="mt-2 space-y-2">{finishedTournaments.map(tournamentRow)}</div></details> : null}
    </section> : null}
  </div>
}
