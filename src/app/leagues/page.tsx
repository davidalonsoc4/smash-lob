"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { PersonalMatchCard } from "@/components/personal/PersonalMatchCard"
import { AppCard } from "@/components/ui/AppCard"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { selectCompetitionHighlight } from "@/lib/competitionOverview"
import { isRoundRevealedToPlayers } from "@/lib/progressiveCalendar"
import type { PersonalMatchItem, PersonalMatchesDashboardPayload } from "@/lib/personalMatches"

const views = [{ id: "summary", label: "Resumen" }, { id: "leagues", label: "Ligas" }, { id: "tournaments", label: "Torneos" }, { id: "friendlies", label: "Amistosos" }] as const
const actionClass = "flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-center text-sm font-black text-neutral-900 transition active:bg-neutral-100"

export default function LeaguesPage() {
  const { t, tx, locale } = useI18n()
  const router = useRouter()
  const { activeLeagueId, changeActiveLeague } = useActiveLeague()
  const { canCreateLeagues, canAccessLeagueAdminTools, getMembershipForLeague, isLeagueAdmin, isLeagueSpectator, userLeagues } = useLeagueAccess()
  const canCreateLeaguesInCurrentView = canCreateLeagues && canAccessLeagueAdminTools(activeLeagueId)
  const { matches } = useMatchData()
  const { seasons, playerProfiles, getActiveSeasonByLeagueId, getSeasonRoundSettings } = useSeasonSettings()
  const [view, setView] = useState<(typeof views)[number]["id"]>("summary")
  const [dashboard, setDashboard] = useState<PersonalMatchesDashboardPayload | null>(null)
  const [tournaments, setTournaments] = useState<Array<{ id: string; name: string; description: string; startsAt: string; status: "draft" | "in_progress" | "finished" }>>([])
  const [tournamentLoadError, setTournamentLoadError] = useState(false)
  const [tournamentRequestVersion, setTournamentRequestVersion] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [requestVersion, setRequestVersion] = useState(0)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/personal-matches?limit=10&offset=0&includeUpcoming=1", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("lookup_failed"); return response.json() as Promise<PersonalMatchesDashboardPayload> })
      .then(data => { if (!controller.signal.aborted) setDashboard(data) })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true) })
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [requestVersion])
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/tournaments", { cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("tournaments_failed"); return response.json() })
      .then((data) => { if (!controller.signal.aborted) { setTournaments(Array.isArray(data?.tournaments) ? data.tournaments : []); setTournamentLoadError(false) } })
      .catch(() => { if (!controller.signal.aborted) setTournamentLoadError(true) })
    return () => controller.abort()
  }, [tournamentRequestVersion])
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
  const highlight = selectCompetitionHighlight([...ownLeagueMatches, ...(dashboard?.upcoming ?? []), ...(dashboard?.items ?? [])], now)
  const leagueRows = userLeagues.map(league => ({ league, season: getActiveSeasonByLeagueId(league.id) }))
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
    return <button key={league.id} type="button" onClick={() => changeActiveLeague(league.id)} aria-label={tx(`Entrar en ${league.name}`)} className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition active:scale-[0.99] ${activeLeagueId === league.id ? "border-neutral-950" : "border-neutral-200"}`}>
      <LeagueLogo league={league} size="md" />
      <span className="min-w-0 flex-1"><span className="block truncate text-base font-black text-neutral-950">{league.name}</span><span className="mt-1 block text-xs font-semibold text-neutral-500">{status} · {isLeagueAdmin(league.id) ? tx("Admin") : isLeagueSpectator(league.id) ? tx("Espectador") : tx("Jugador")}</span></span>
      <span aria-hidden="true" className="text-neutral-400">›</span>
    </button>
  }
  return <div className="space-y-5">
    <header className="app-page-header">
      <button type="button" onClick={() => { setDashboard(null); setLoadError(false); setRequestVersion(value => value + 1); router.refresh() }} className="app-top-back-control text-sm font-semibold text-neutral-500">↻ {t.common.refreshApp}</button>
      <h1 className="type-page-title mt-3 text-2xl font-black tracking-tight">{tx("Mis Competiciones")}</h1>
    </header>
    <nav aria-label={tx("Mis Competiciones")} className="grid grid-cols-4 gap-1 rounded-2xl border border-neutral-200 bg-white p-1">
      {views.map(item => <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => setView(item.id)} className={`min-h-11 rounded-xl px-1 py-2 text-xs font-black transition ${view === item.id ? "app-accent-surface bg-neutral-950 text-white shadow-sm" : "text-neutral-500 active:bg-neutral-100"}`}>{tx(item.label)}</button>)}
    </nav>
    {view === "summary" ? <section aria-labelledby="personal-activity" className="space-y-2">
      <div className="flex items-center justify-between gap-2"><h2 id="personal-activity" className="type-panel-title font-black">{tx("Actividad personal")}</h2>
        <Link href="/personal-matches" className="min-h-11 inline-flex shrink-0 items-center text-sm font-black underline underline-offset-4">{tx("Ver Mis partidos")}</Link></div>
      {!dashboard && !loadError ? <AppCard><p role="status" className="text-sm text-neutral-500">{tx("Cargando tus partidos…")}</p></AppCard> : loadError ? <AppCard><p role="alert" className="text-sm text-neutral-500">{tx("No se ha podido cargar tu actividad personal.")}</p></AppCard> : highlight ? <>
        <p className="type-caption font-black uppercase tracking-widest text-neutral-500">{tx(highlight.kind === "live" ? "Tu partido en curso" : highlight.kind === "next" ? "Tu próximo partido" : "Tu último encuentro")}</p>
        <PersonalMatchCard match={highlight.match} hideEventMeta={highlight.kind === "last"} />
      </> : <AppCard><p className="text-sm font-semibold text-neutral-500">{tx("Todavía no tienes encuentros para mostrar.")}</p></AppCard>}
    </section> : null}
    {view === "summary" || view === "leagues" ? <section aria-labelledby="competitions-leagues" className="space-y-2">
      <div className="flex items-center justify-between gap-2"><h2 id="competitions-leagues" className="type-panel-title font-black">{tx("Tus ligas")} <span className="text-neutral-400">· {userLeagues.length}</span></h2>
        {view === "summary" ? <button type="button" onClick={() => setView("leagues")} className="min-h-11 text-sm font-black underline underline-offset-4">{tx("Ver todas")}</button> : null}</div>
      {visibleLeagues.map(leagueRow)}
      {!visibleLeagues.length ? <AppCard><p className="text-sm font-semibold text-neutral-500">{tx(userLeagues.length ? "No tienes ligas activas o próximas." : "Todavía no perteneces a ninguna liga. Puedes seguir usando Mis partidos.")}</p></AppCard> : null}
      {view === "leagues" ? <>
        {finishedLeagues.length ? <details className="rounded-2xl border border-neutral-200 p-3"><summary className="cursor-pointer py-2 text-sm font-black">{tx("Finalizadas")} · {finishedLeagues.length}</summary><div className="mt-2 space-y-2">{finishedLeagues.map(leagueRow)}</div></details> : null}
        <div className="grid gap-2 pt-2"><Link href="/invite" className={actionClass}>{tx("Unirme con invitación")}</Link>
          {canCreateLeaguesInCurrentView ? <Link href="/league/new" className={actionClass}>{tx("Crear nueva liga")}</Link> : null}</div>
      </> : null}
    </section> : null}
    {view === "summary" || view === "tournaments" ? <section aria-labelledby="competitions-tournaments" className="space-y-2">
      <div className="flex items-center justify-between gap-2"><h2 id="competitions-tournaments" className="type-panel-title font-black">{tx("Torneos")} <span className="text-neutral-400">· {tournaments.length}</span></h2><Link href="/tournaments/new" className="min-h-11 inline-flex shrink-0 items-center text-sm font-black underline underline-offset-4">{tx("Crear")}</Link></div>
      {tournamentLoadError ? <AppCard><p role="alert" className="text-sm font-semibold text-neutral-500">{tx("No se han podido cargar tus torneos.")}</p><button type="button" onClick={() => setTournamentRequestVersion((value) => value + 1)} className="mt-2 text-sm font-black underline">{tx("Reintentar")}</button></AppCard> : visibleTournaments.map(tournamentRow)}
      {!tournamentLoadError && !visibleTournaments.length ? <AppCard><p className="text-sm font-semibold text-neutral-500">{tx("Todavía no tienes torneos.")}</p>{view === "summary" ? <Link href="/tournaments/new" className={`${actionClass} mt-3`}>{tx("Crear torneo rápido")}</Link> : null}</AppCard> : null}
      {view === "tournaments" && finishedTournaments.length ? <details className="rounded-2xl border border-neutral-200 p-3"><summary className="cursor-pointer py-2 text-sm font-black">{tx("Finalizados")} · {finishedTournaments.length}</summary><div className="mt-2 space-y-2">{finishedTournaments.map(tournamentRow)}</div></details> : null}
      {view === "summary" && tournaments.length > visibleTournaments.length ? <button type="button" onClick={() => setView("tournaments")} className="min-h-11 text-sm font-black underline underline-offset-4">{tx("Ver todos los torneos")}</button> : null}
    </section> : null}
    {view === "summary" || view === "friendlies" ? <section aria-labelledby="competitions-friendlies" className="space-y-2">
      <h2 id="competitions-friendlies" className="type-panel-title font-black">{tx("Amistosos")}</h2>
      <p className="text-xs font-semibold text-neutral-500">{tx("Consulta tus partidos de liga y registra los amistosos que juegas fuera de competición.")}</p>
      <div className="grid gap-2"><Link href="/personal-matches/new" className={actionClass}>{tx("+ Registrar encuentro amistoso")}</Link><Link href="/personal-matches" className={actionClass}>{tx("Mis partidos")}</Link></div>
    </section> : null}
  </div>
}
