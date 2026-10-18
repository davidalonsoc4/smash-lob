"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { selectCompetitionHighlights } from "@/lib/competitionOverview"
import { isRoundRevealedToPlayers } from "@/lib/progressiveCalendar"
import type { PersonalMatchItem, PersonalMatchesDashboardPayload } from "@/lib/personalMatches"

const actionClass = "flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-center text-sm font-black text-neutral-900 transition active:bg-neutral-100"

export function CompetitionsOverview({ view = "summary" }: { view?: "summary" | "leagues" | "tournaments" }) {
  const { t, tx, locale } = useI18n()
  const router = useRouter()
  const { activeLeagueId, changeActiveLeague } = useActiveLeague()
  const { canCreateLeagues, canAccessLeagueAdminTools, getMembershipForLeague, isLeagueAdmin, isLeagueSpectator, userLeagues } = useLeagueAccess()
  const canCreateLeaguesInCurrentView = canCreateLeagues && canAccessLeagueAdminTools(activeLeagueId)
  const canCreateCompetition = canCreateLeagues
  const memberLeagues = userLeagues.filter(league => getMembershipForLeague(league.id))
  const { matches } = useMatchData()
  const { seasons, playerProfiles, getActiveSeasonByLeagueId, getSeasonRoundSettings } = useSeasonSettings()
  const [dashboard, setDashboard] = useState<PersonalMatchesDashboardPayload | null>(null)
  const [tournaments, setTournaments] = useState<Array<{ id: string; name: string; description: string; startsAt: string; status: "draft" | "in_progress" | "finished" }>>([])
  const [tournamentLoadError, setTournamentLoadError] = useState(false)
  const [tournamentRequestVersion, setTournamentRequestVersion] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [requestVersion, setRequestVersion] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [activityIndex, setActivityIndex] = useState(0)
  useEffect(() => {
    if (view !== "summary") return
    const controller = new AbortController()
    fetch("/api/personal-matches?limit=10&offset=0&includeUpcoming=1", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("lookup_failed"); return response.json() as Promise<PersonalMatchesDashboardPayload> })
      .then(data => { if (!controller.signal.aborted) setDashboard(data) })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true) })
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [requestVersion, view])
  useEffect(() => {
    if (view === "leagues") return
    const controller = new AbortController()
    fetch("/api/tournaments", { cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("tournaments_failed"); return response.json() })
      .then((data) => { if (!controller.signal.aborted) { setTournaments(Array.isArray(data?.tournaments) ? data.tournaments : []); setTournamentLoadError(false) } })
      .catch(() => { if (!controller.signal.aborted) setTournamentLoadError(true) })
    return () => controller.abort()
  }, [tournamentRequestVersion, view])
  const ownLeagueMatches: PersonalMatchItem[] = matches.flatMap(match => {
    const league = userLeagues.find(item => item.id === match.leagueId)
    const playerId = getMembershipForLeague(match.leagueId)?.playerId
    const season = seasons.find(item => item.id === match.seasonId && item.leagueId === match.leagueId)
    if (!league || !playerId || isLeagueSpectator(league.id) || ![...match.teamA, ...match.teamB].includes(playerId) || !season || season.status === "upcoming") return []
    if (match.status !== "scheduled" && match.status !== "finished") return []
    if (!isRoundRevealedToPlayers({ round: match.round, seasonStatus: season.status, totalRounds: season.totalRounds, settings: getSeasonRoundSettings(season.id), matches: matches.filter(item => item.seasonId === season.id), now })) return []
    return [{ id: match.id, origin: "league", leagueId: league.id, leagueName: league.name, seasonId: season.id, seasonName: season.name, round: match.round,
      status: match.status, scheduledAt: match.scheduledAt, resultRecordedAt: match.resultRecordedAt, locationName: match.location, sets: match.sets, canManage: false, canDelete: false,
      participants: [match.teamA, match.teamB].flatMap((team, teamIndex) => team.map((id, slot) => ({ team: (teamIndex + 1) as 1 | 2, slot: (slot + 1) as 1 | 2, displayName: playerProfiles.find(player => player.id === id)?.displayName ?? tx("Jugador"), isCurrentUser: id === playerId }))) }]
  })
  const highlights = selectCompetitionHighlights([...ownLeagueMatches, ...(dashboard?.upcoming ?? []), ...(dashboard?.items ?? [])], now)
  const visibleActivityIndex = Math.min(activityIndex, Math.max(0, highlights.length - 1))
  const leagueRows = memberLeagues.map(league => ({ league, season: getActiveSeasonByLeagueId(league.id) }))
  const statusOrder = { active: 0, upcoming: 1, finished: 2 }
  const orderedLeagues = [...leagueRows].sort((a, b) => statusOrder[a.season.status] - statusOrder[b.season.status])
  const relevantLeagues = orderedLeagues.filter(item => item.season.status !== "finished").slice(0, 2)
  const visibleLeagues = view === "summary" ? relevantLeagues : orderedLeagues.filter(item => item.season.status !== "finished")
  const finishedLeagues = orderedLeagues.filter(item => item.season.status === "finished")
  const orderedTournaments = [...tournaments].sort((a, b) => {
    const order = { in_progress: 0, draft: 1, finished: 2 }
    return order[a.status] - order[b.status] || Date.parse(a.startsAt) - Date.parse(b.startsAt)
  })
  const finishedTournaments = orderedTournaments.filter((item) => item.status === "finished")
  const visibleTournaments = view === "summary" ? orderedTournaments.filter((item) => item.status !== "finished").slice(0, 2) : orderedTournaments.filter((item) => item.status !== "finished")
  function tournamentRow(item: (typeof tournaments)[number]) {
    const label = item.status === "in_progress" ? tx("En curso") : item.status === "finished" ? tx("Finalizado") : tx("Borrador")
    return <Link key={item.id} href={`/tournaments/${item.id}`} className="flex min-h-16 items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm transition active:scale-[0.99]"><span className="min-w-0 flex-1"><span className="block truncate text-base font-black">{item.name}</span><span className="mt-1 block text-xs font-semibold text-neutral-500">{label} · {new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.startsAt))}</span></span><span aria-hidden="true" className="text-neutral-400">›</span></Link>
  }
  function leagueRow({ league, season }: (typeof leagueRows)[number]) {
    const status = season.totalRounds === 0 ? tx("Sin temporada") : season.status === "active" ? tx("Activa") : season.status === "upcoming" ? tx("Próximamente") : tx("Terminada")
    return <button key={league.id} type="button" onClick={() => changeActiveLeague(league.id)} aria-label={tx(`Entrar en ${league.name}`)} className={`flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white text-left shadow-sm transition active:scale-[0.99] ${view === "leagues" ? "min-h-32 p-4" : "p-3"}`}>
      <LeagueLogo league={league} size={view === "leagues" ? "lg" : "md"} />
      <span className="min-w-0 flex-1"><span className={`block text-base font-black text-neutral-950 ${view === "leagues" ? "break-words" : "truncate"}`}>{league.name}</span><span className="mt-1 block text-xs font-semibold text-neutral-500">{status} · {isLeagueAdmin(league.id) ? tx("Admin") : isLeagueSpectator(league.id) ? tx("Espectador") : tx("Jugador")}</span>
        {view === "leagues" ? <>
          {league.description ? <span className="mt-2 block line-clamp-2 text-sm text-neutral-600">{league.description}</span> : null}
          {season.totalRounds > 0 ? <span className="mt-2 block text-xs font-semibold text-neutral-500"><span className="block break-words">{season.name}</span><span className="mt-1 block">{tx("Jornadas")} · {season.completedRounds}/{season.totalRounds}</span></span> : null}
        </> : null}
      </span>
      <span aria-hidden="true" className="text-neutral-400">›</span>
    </button>
  }
  return <div className="space-y-5">
    <header className="app-page-header">
      {view !== "summary" ? <BackButton fallbackHref="/leagues" label={t.common.back} /> : <button type="button" onClick={() => { setDashboard(null); setLoadError(false); setRequestVersion(value => value + 1); router.refresh() }} className="app-top-back-control text-sm font-semibold text-neutral-500">↻ {t.common.refreshApp}</button>}
      <h1 className="type-page-title mt-3 text-2xl font-black tracking-tight">{tx(view === "summary" ? "Mis Competiciones" : view === "leagues" ? "Mis ligas" : "Mis torneos")}</h1>
    </header>
    {view === "summary" ? <section aria-labelledby="personal-activity" className="space-y-2">
      <div className="flex items-center justify-between gap-2"><h2 id="personal-activity" className="type-panel-title font-black">{tx("Actividad personal")}</h2>
        <Link href="/personal-matches" className="min-h-11 inline-flex shrink-0 items-center text-sm font-black underline underline-offset-4">{tx("Ver Mis partidos")}</Link></div>
      {!dashboard && !loadError ? <AppCard><p role="status" className="text-sm text-neutral-500">{tx("Cargando tus partidos…")}</p></AppCard> : loadError ? <AppCard><p role="alert" className="text-sm text-neutral-500">{tx("No se ha podido cargar tu actividad personal.")}</p></AppCard> : highlights.length ? <>
        <div data-activity-heading className="flex items-center justify-between gap-2">
          <p className="min-w-0 type-caption font-black uppercase tracking-wide text-neutral-500">{tx(highlights[visibleActivityIndex].kind === "live" ? "Tu partido en curso" : highlights[visibleActivityIndex].kind === "next" ? "Tu próximo partido" : "Tu último encuentro")}</p>
          {highlights.length > 1 ? <button type="button" aria-label={tx(visibleActivityIndex === 0 ? "Último partido" : "Próximo partido")} title={tx(visibleActivityIndex === 0 ? "Último partido" : "Próximo partido")} onClick={() => setActivityIndex(visibleActivityIndex === 0 ? 1 : 0)} className="inline-flex h-7 w-8 shrink-0 items-center justify-center bg-transparent p-0 text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block h-5 w-5"><path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4" /></svg></button> : null}
        </div>
        <MatchSlides index={visibleActivityIndex} onChange={setActivityIndex} label={tx("Actividad personal")}>
          {highlights.map(highlight => <PersonalMatchCard key={highlight.kind} match={highlight.match} hideEventMeta={highlight.kind === "last"} />)}
        </MatchSlides>
      </> : <AppCard><p className="text-sm font-semibold text-neutral-500">{tx("Todavía no tienes encuentros para mostrar.")}</p></AppCard>}
    </section> : null}
    {(view === "leagues" || memberLeagues.length > 0 || canCreateCompetition) && (view === "summary" || view === "leagues") ? <section aria-labelledby="competitions-leagues" className="space-y-2">
      <div className="flex items-center justify-between gap-2"><h2 id="competitions-leagues" className="type-panel-title font-black">{tx("Mis ligas")} <span className="text-neutral-400">· {memberLeagues.length}</span></h2>
        {view === "summary" ? <Link href="/leagues/all" className="min-h-11 inline-flex items-center text-sm font-black underline underline-offset-4">{tx("Ver todas")}</Link> : null}</div>
      {visibleLeagues.map(leagueRow)}
      {!visibleLeagues.length ? <AppCard><p className="text-sm font-semibold text-neutral-500">{tx(memberLeagues.length ? "No tienes ligas activas o próximas." : "Aún no formas parte de ninguna liga.")}</p>{view === "summary" && canCreateCompetition ? <Link href="/league/new" className={`${actionClass} mt-3`}>{tx("Crear nueva liga")}</Link> : null}</AppCard> : null}
      {view === "leagues" ? <>
        {finishedLeagues.length ? <details className="rounded-2xl border border-neutral-200 p-3"><summary className="cursor-pointer py-2 text-sm font-black">{tx("Finalizadas")} · {finishedLeagues.length}</summary><div className="mt-2 space-y-2">{finishedLeagues.map(leagueRow)}</div></details> : null}
        <div className="grid gap-2 pt-2"><Link href="/invite" className={actionClass}>{tx("Unirme con invitación")}</Link>
          {canCreateLeaguesInCurrentView ? <Link href="/league/new" className={actionClass}>{tx("Crear nueva liga")}</Link> : null}</div>
      </> : null}
    </section> : null}
    {(view === "tournaments" || tournaments.length > 0 || canCreateCompetition) && (view === "summary" || view === "tournaments") ? <section aria-labelledby="competitions-tournaments" className="space-y-2">
      <div className="flex items-center justify-between gap-2"><h2 id="competitions-tournaments" className="type-panel-title font-black">{tx("Mis torneos")} <span className="text-neutral-400">· {tournaments.length}</span></h2>{view === "summary" ? <Link href="/tournaments" className="min-h-11 inline-flex items-center text-sm font-black underline underline-offset-4">{tx("Ver todos")}</Link> : <Link href="/tournaments/new" className="min-h-11 inline-flex shrink-0 items-center text-sm font-black underline underline-offset-4">{tx("Crear")}</Link>}</div>
      {tournamentLoadError ? <AppCard><p role="alert" className="text-sm font-semibold text-neutral-500">{tx("No se han podido cargar tus torneos.")}</p><button type="button" onClick={() => setTournamentRequestVersion((value) => value + 1)} className="mt-2 text-sm font-black underline">{tx("Reintentar")}</button></AppCard> : visibleTournaments.map(tournamentRow)}
      {!tournamentLoadError && !visibleTournaments.length ? <AppCard><p className="text-sm font-semibold text-neutral-500">{tx("Todavía no tienes torneos.")}</p>{view === "summary" ? <Link href="/tournaments/new" className={`${actionClass} mt-3`}>{tx("Crear torneo rápido")}</Link> : null}</AppCard> : null}
      {view === "tournaments" && finishedTournaments.length ? <details className="rounded-2xl border border-neutral-200 p-3"><summary className="cursor-pointer py-2 text-sm font-black">{tx("Finalizados")} · {finishedTournaments.length}</summary><div className="mt-2 space-y-2">{finishedTournaments.map(tournamentRow)}</div></details> : null}
    </section> : null}
  </div>
}
