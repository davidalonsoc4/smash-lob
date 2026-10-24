"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { RapidTournamentCreateForm } from "@/components/tournament/RapidTournamentCreateForm"
import { useI18n } from "@/i18n/I18nProvider"
import { buildRapidScheduleChecks, calculateRapidStandings, getRapidRoundAt, getTournamentChampions, type RapidStanding } from "@/lib/rapidTournament"
import { readLegacyRapidConfiguration } from "@/lib/tournamentConfiguration"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { tournamentAccentStyle } from "@/lib/tournamentStyles"
import { calculateMexicanoStandings } from "@/lib/dynamicMexicano"
import { calculateFixedRapidStandings, fixedTeamsFromPlayers } from "@/lib/fixedRapidTournament"
import { parseTournamentPoints } from "@/lib/tournamentResult"
import styles from "./Tournament.module.css"
import { RapidTournamentLive } from "./RapidTournamentLive"
import { disableRapidAudio, enableRapidAudio } from "@/lib/rapidTournamentAudio"
import { signIn, useSession } from "next-auth/react"
type TournamentData = {
  access: { role: "creator" | "participant" }
  serverNow?: string
  canRestartForTesting?: boolean
  tournament: { id: string; name: string; description: string; logoUrl?: string | null; accentColor?: string | null; startsAt: string; startedAt: string | null; courtNames: string[]; status: "draft" | "in_progress" | "finished"; createdByUserId: string; finishedAt: string | null; configuration: Record<string, number | string> }
  players: Array<{ id: string; slot: string; name: string; userId?: string | null; hasAccount?: boolean; pairNumber?: number | null }>
  rounds: Array<{ id: string; round: number; startsAt: string; endsAt: string; status?: "pending" | "generated" | "completed" }>
  matches: Array<{ id: string; round: number; court: number; courtName: string; teamA: [string, string]; teamB: [string, string]; teamAIds: [string, string]; teamBIds: [string, string]; scoreA: number | null; scoreB: number | null }>
}
type View = "summary" | "calendar" | "standings" | "players" | "live"
const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-center text-sm font-black text-neutral-900 active:bg-neutral-100 disabled:opacity-50"
const primaryClass = "inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
function formatTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}
function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" }).format(new Date(value))
}
function scoreLabel(scoreA: number | null, scoreB: number | null) {
  return scoreA === null || scoreB === null ? "—" : `${scoreA}–${scoreB}`
}
function MatchResult({ tournamentId, match, status, onSaved, canManage }: { tournamentId: string; match: TournamentData["matches"][number]; status: TournamentData["tournament"]["status"]; onSaved: () => void; canManage: boolean }) {
  const { tx } = useI18n()
  const [scoreA, setScoreA] = useState(match.scoreA === null ? "" : String(match.scoreA))
  const [scoreB, setScoreB] = useState(match.scoreB === null ? "" : String(match.scoreB))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(false)
  const canEdit = canManage && status === "in_progress"
  async function save() {
    const a = Number(scoreA), b = Number(scoreB)
    if (!scoreA.trim() || !scoreB.trim() || !parseTournamentPoints(a,b)) { setError(tx("Introduce dos números enteros no negativos y una suma mayor que cero.")); return }
    setBusy(true); setError("")
    try {
      const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(match.id)}/result`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scoreA: a, scoreB: b }) })
      if (!response.ok) { setError(tx("No se ha podido guardar el resultado.")); return }
      setEditing(false)
      onSaved()
    } catch { setError(tx("No se ha podido guardar el resultado.")) }
    finally { setBusy(false) }
  }
  return <article className={styles.match} data-tournament-match={match.id} aria-label={`${tx("Pista")} ${match.court}: ${match.teamA.join(" / ")} ${tx("contra")} ${match.teamB.join(" / ")}`}>
    <div className={styles.matchHeader}><p className={`${styles.courtBadge} type-caption font-black`}>{tx("Pista")} {match.court}</p>{match.scoreA !== null && match.scoreB !== null ? <p className={styles.score}>{scoreLabel(match.scoreA, match.scoreB)}</p> : <span className={styles.chip}>{tx("Pendiente")}</span>}</div>
    <div className={styles.teams}>
      <div className={styles.team}>{match.teamA.map((name, index) => <p key={index} className={`${styles.playerName} type-player-name`}>{name}</p>)}</div>
      <span className={styles.versus} aria-label={tx("contra")}>vs</span>
      <div className={styles.team}>{match.teamB.map((name, index) => <p key={index} className={`${styles.playerName} type-player-name`}>{name}</p>)}</div>
    </div>
    {canEdit ? <div className={styles.resultEditor}>{editing ? <><div className="grid grid-cols-[minmax(0,1fr)_1.2rem_minmax(0,1fr)] items-center gap-1"><label className="sr-only" htmlFor={`score-a-${match.id}`}>{tx("Puntos de")} {match.teamA.join(" / ")}</label><input id={`score-a-${match.id}`} className={`${styles.field} text-center text-lg font-black tabular-nums`} type="number" min="0" max="2147483647" step="1" inputMode="numeric" value={scoreA} onChange={(event) => setScoreA(event.target.value)} /><span className="text-center font-black">–</span><label className="sr-only" htmlFor={`score-b-${match.id}`}>{tx("Puntos de")} {match.teamB.join(" / ")}</label><input id={`score-b-${match.id}`} className={`${styles.field} text-center text-lg font-black tabular-nums`} type="number" min="0" max="2147483647" step="1" inputMode="numeric" value={scoreB} onChange={(event) => setScoreB(event.target.value)} /></div><div className="mt-2 flex gap-2"><button type="button" className={`${styles.secondary} flex-1`} onClick={() => setEditing(false)} disabled={busy}>{tx("Cancelar")}</button><button type="button" className={`${styles.primary} flex-1`} onClick={() => void save()} disabled={busy}>{busy ? tx("Guardando…") : tx("Guardar resultado")}</button></div>{error ? <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}</> : <button type="button" className={`${styles.secondary} w-full`} aria-expanded={false} onClick={() => setEditing(true)}>{tx(match.scoreA === null ? "Registrar resultado" : "Corregir resultado")}</button>}</div> : null}
  </article>
}
export function RapidTournamentPage({ tournamentId, view }: { tournamentId: string; view: View }) {
  const { tx, locale } = useI18n()
  const router = useRouter()
  const [data, setData] = useState<TournamentData | null>(null)
  const [error, setError] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [busyAction, setBusyAction] = useState("")
  const [now,setNow] = useState(() => new Date())
  const [clockOffset, setClockOffset] = useState<number | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [actionError, setActionError] = useState("")
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])
  const summaryRounds=data?.rounds, summaryRunning=data?.tournament.status==="in_progress"
  useEffect(()=>{
    if(view!=="summary"||!summaryRunning||!summaryRounds)return
    let timer:number|undefined
    const update=()=>{
      window.clearTimeout(timer)
      const time=Date.now()+(clockOffset??0);setNow(new Date(time))
      if(document.hidden)return
      const next=Math.min(...summaryRounds.flatMap(round=>[Date.parse(round.startsAt),Date.parse(round.endsAt)]).filter(at=>at>time))
      if(Number.isFinite(next))timer=window.setTimeout(update,Math.min(2_147_483_647,next-time+50))
    }
    update();document.addEventListener("visibilitychange",update)
    return()=>{window.clearTimeout(timer);document.removeEventListener("visibilitychange",update)}
  },[view,summaryRounds,summaryRunning,clockOffset])
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("read_failed"); return response.json() as Promise<TournamentData> })
      .then((result) => { if (!controller.signal.aborted) { if (result.serverNow && Number.isFinite(Date.parse(result.serverNow))) setClockOffset((value) => value ?? Date.parse(result.serverNow!) - Date.now()); setData(result); setError(false) } })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [refreshKey, tournamentId])
  const isDynamic = data?.tournament.configuration.format === "dynamic_mexicano"
  const isFixed = data?.tournament.configuration.pairing === "fixed"
  const generatedRoundCount = data?.matches.reduce((maximum, match) => Math.max(maximum, match.round), 0) ?? 0
  const fixedRanking = useMemo(() => {
    if (!data || !isFixed) return null
    try {
      const teams = fixedTeamsFromPlayers(data.players), names = new Map(data.players.map(player => [player.id,player.name]))
      return calculateFixedRapidStandings(teams, data.matches, isDynamic ? "dynamic_mexicano" : "balanced_americana", generatedRoundCount).map(row => ({ ...row, name: row.playerIds.map(id => names.get(id) ?? "").join(" / ") }))
    } catch { return null }
  }, [data,isFixed,isDynamic,generatedRoundCount])
  const mexicanoStandings = useMemo(() => data && isDynamic ? isFixed ? fixedRanking ?? [] : calculateMexicanoStandings(data.players, data.matches, generatedRoundCount) : [], [data, generatedRoundCount, isDynamic,isFixed,fixedRanking])
  const standings = useMemo(() => data && !isDynamic ? isFixed ? (fixedRanking ?? []).map((row): RapidStanding => ({ player: row.name, played: row.played, pending: row.pending, wins: row.wins, pointsFor: row.pointsFor, pointsAgainst: row.pointsAgainst, averagePercent: row.averagePercent, globalPercent: row.globalPercent, position: row.position })) : calculateRapidStandings(data.players.map((player) => player.name), data.matches) : [], [data, isDynamic,isFixed,fixedRanking])
  const scoredMatches = data?.matches.filter((match) => match.scoreA !== null && match.scoreB !== null).length ?? 0
  const champions = data ? isDynamic ? data.tournament.status === "finished" ? mexicanoStandings.filter((item) => item.position === 1) : [] : getTournamentChampions(standings, data.tournament.status, scoredMatches, data.matches.length) : []
  const championNames = champions.map((item) => "name" in item ? item.name : item.player)
  const championScore = champions[0] ? "rating" in champions[0] ? champions[0].rating : champions[0].averagePercent : 0
  const selectedPlayer = data?.players.find((player) => player.id === selectedPlayerId) ?? data?.players[0]
  const firstDraftRound=data?.tournament.status==="draft"?data.rounds[0]:null
  const scheduledRoundState = firstDraftRound ? {...firstDraftRound,phase:"upcoming" as const} : data && data.tournament.status!=="finished" ? getRapidRoundAt(data.rounds, now) : null
  const roundState = scheduledRoundState && (!isDynamic || scheduledRoundState.round <= generatedRoundCount) ? scheduledRoundState : null
  const roundCountdownTarget = roundState?.phase === "playing" ? roundState.endsAt : roundState?.startsAt
  async function performAction(action: "draw" | "start" | "next-round" | "finish" | "restart" | "delete") {
    if (action === "restart" && !window.confirm(tx("Se borrarán todos los resultados y empezarán dos minutos de preparación. Se conservan jugadores y cruces. ¿Reiniciar el torneo?"))) return
    if (action === "delete" && !window.confirm(tx("Se eliminarán definitivamente este torneo, sus jugadores y resultados. ¿Eliminar el torneo?"))) return
    setBusyAction(action); setActionError("")
    try {
      if (action === "start" || action === "restart") await enableRapidAudio(tournamentId)
      const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}${action === "delete" ? "" : `/${action}`}`, { method: action === "delete" ? "DELETE" : "POST" })
      if (!response.ok) { if (action === "start" || action === "restart") disableRapidAudio(); setActionError(tx(action === "draw" ? "El sorteo está bloqueado porque el torneo ya ha comenzado." : action === "start" ? "No se ha podido iniciar el torneo." : action === "next-round" ? "Completa todos los resultados de la ronda actual antes de generar la siguiente." : action === "finish" ? "Registra todos los resultados antes de finalizar." : "No se ha podido completar la acción. Comprueba tu conexión e inténtalo de nuevo.")); return }
      if (action === "delete") { disableRapidAudio(); router.replace("/leagues"); return }
      if (action === "start" || action === "restart") { refresh(); router.push(`/tournaments/${tournamentId}/live`) }
      else refresh()
    } catch { if (action === "start" || action === "restart") disableRapidAudio(); setActionError(tx("No se ha podido completar la acción. Comprueba tu conexión e inténtalo de nuevo.")) }
    finally { setBusyAction("") }
  }
  if (!data) return <div className="space-y-3 py-8"><Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500"><span aria-hidden="true" className="mr-1 inline-block">←</span>{tx("Competiciones")}</Link><AppCard><p role={error ? "alert" : "status"} className="text-sm font-semibold text-neutral-600">{error ? tx("No se ha podido cargar este torneo o no tienes acceso.") : tx("Cargando torneo…")}</p>{error ? <button className={`${buttonClass} mt-3`} onClick={refresh}>{tx("Reintentar")}</button> : null}</AppCard></div>
  if (isFixed && !fixedRanking) return <AppCard><p role="alert">{tx("Las parejas guardadas no son válidas. Revisa la configuración del torneo.")}</p></AppCard>
  const tournament = data.tournament
  const canManage = data.access.role === "creator"
  const venue = [...new Set(tournament.courtNames.flatMap((courtName) => {
    const location = courtName.match(/^(.*) · Pista [1-4]$/)?.[1]?.trim()
    return location ? [location] : []
  }))].join(" · ")
  const matchesByRound = (roundNumber: number) => data.matches.filter((match) => match.round === roundNumber)
  const matchCards = (matches: TournamentData["matches"]) => matches.map((match) => <MatchResult key={match.id} tournamentId={tournamentId} match={match} status={tournament.status} onSaved={refresh} canManage={canManage && (!isDynamic || match.round === generatedRoundCount)} />)
  const statusLabel = tournament.status === "draft" ? tx("Borrador") : tournament.status === "in_progress" ? tx("En curso") : tx("Finalizado")
  const currentRoundMatches = data.matches.filter((match) => match.round === generatedRoundCount)
  const currentRoundComplete = currentRoundMatches.length > 0 && currentRoundMatches.every((match) => match.scoreA !== null && match.scoreB !== null)
  const complete = isDynamic ? generatedRoundCount === Number(tournament.configuration.rounds) && currentRoundComplete : data.matches.length > 0 && scoredMatches === data.matches.length
  const canGenerateNextRound = isDynamic && tournament.status === "in_progress" && generatedRoundCount < Number(tournament.configuration.rounds) && currentRoundComplete
  const displayStart = tournament.startedAt ?? tournament.startsAt
  const config = readLegacyRapidConfiguration(data.tournament.configuration)
  const formatLabel = `${isDynamic ? tx("Torneo rápido · Mexicano dinámico") : tx("Torneo rápido · Americana equilibrada")}${isFixed ? ` · ${tx("Parejas fijas")}` : ""}`
  const visibleRounds = isDynamic ? data.rounds.filter((round) => round.round <= generatedRoundCount) : data.rounds
  const expectedMatchCount = Number(config.rounds) * Math.min(Number(config.courts), Math.floor(data.players.length / 4))
  const rawChecks = isDynamic ? { passed: true, allPassed: true, checks: [], players: [] } : buildRapidScheduleChecks(data.players, data.matches, config)
  const auditChecks = rawChecks.checks.map(check => isFixed && check.id === "partners-and-opponents" ? { id: "fixed-pairs", passed: Boolean(fixedRanking) } : check)
  const scheduleChecks = { ...rawChecks, checks: auditChecks, allPassed: auditChecks.every(check => check.passed) }
  const configMatches = data.matches.length
  const checkLabels: Record<string, string> = {
    "complete-calendar": `${configMatches} ${tx("partidos")} · ${data.rounds.length} ${tx("rondas")} · ${tx("sin jugadores duplicados")}`,
    "equal-participation": tx("Participación equilibrada, descansos y minutos por jugador"),
    "breaks-and-streaks": tx("Descansos y rachas de juego equilibrados"),
    "partners-and-opponents": tx("Se minimizan repeticiones de compañeros y rivales"),
    "court-balance": tx("Mismo número de partidos programados en cada pista"),
    "player-court-balance": tx("Reparto de pistas por jugador; puede no ser exacto con pocas rondas"),
    "fixed-pairs": tx("Las parejas se mantienen durante todo el torneo"),
  }
      const scheduleValidation = <section className={`${styles.panel} p-3`} aria-labelledby="schedule-validation"><div className="flex items-center justify-between gap-2"><h2 id="schedule-validation" className="type-panel-title font-black">{tx("Validación del sorteo")}</h2><span className={`${styles.chip} ${scheduleChecks.allPassed ? "text-emerald-800" : scheduleChecks.passed ? "text-amber-800" : "text-red-800"}`}>{scheduleChecks.allPassed ? tx("Todo correcto") : scheduleChecks.passed ? tx("Con observaciones") : tx("Revisar")}</span></div><ul className="mt-2 space-y-1.5">{scheduleChecks.checks.map((check) => <li key={check.id} className="flex items-start gap-2 text-xs font-semibold"><span aria-hidden="true" className={check.passed ? "text-emerald-700" : "text-red-700"}>{check.passed ? "✓" : "!"}</span><span>{checkLabels[check.id]}</span></li>)}</ul><details className="mt-2"><summary className="cursor-pointer text-xs font-bold">{tx("Detalle por jugador")}</summary><div className="mt-2 overflow-x-auto" role="region" aria-label={tx("Detalle por jugador")} tabIndex={0}><table className="w-full min-w-[430px] text-left text-xs"><thead><tr>{[tx("Jugador"),tx("Partidos"),tx("Descansos"),tx("Minutos"),tx("Máx. seguidos"),`${tx("Compañeros")} / ${tx("Rivales")}`,tx("Pistas")].map((label) => <th className="px-1 py-1 font-black" key={label}>{label}</th>)}</tr></thead><tbody>{scheduleChecks.players.map((player) => <tr key={player.id} className="border-t border-neutral-100"><td className="px-1 py-1 font-bold">{player.name}</td><td className="px-1 py-1">{player.played}</td><td className="px-1 py-1">{player.rested}</td><td className="px-1 py-1">{player.playedMinutes}</td><td className="px-1 py-1">{player.maxConsecutivePlayed} / {player.maxConsecutiveRested}</td><td className="px-1 py-1">{player.uniquePartners} / {player.uniqueOpponents}</td><td className="px-1 py-1">{player.courts.slice(0, Math.min(tournament.courtNames.length, Math.floor(data.players.length / 4))).join(" / ")}</td></tr>)}</tbody></table></div><p className="mt-1 text-xs text-neutral-500">{tx("Máx. seguidos: jugando / descansando · Pistas en orden")}</p></details></section>
  return <div className={`${styles.theme} ${styles.page}`} style={tournamentAccentStyle(tournament.accentColor)}>
    <header className={`app-page-header ${styles.header}`} style={tournament.accentColor ? { borderLeft: `0.25rem solid ${tournament.accentColor}` } : undefined}><Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500"><span aria-hidden="true" className="mr-1 inline-block">←</span>{tx("Competiciones")}</Link><div className="flex min-w-0 items-center gap-2">{tournament.logoUrl ? <LeagueLogo league={tournament} label={tx("Logo del torneo")} size="sm" /> : null}<h1 className={`type-page-title font-black ${styles.headerTitle}`}>{tournament.name}</h1></div><div className={styles.headerContext}><span>{formatDate(displayStart, locale)} · {tournament.startedAt ? `${tx("Inicio real")} ` : ""}{formatTime(displayStart, locale)}</span><span>· {statusLabel}</span></div>{venue ? <p className={styles.headerLocation}>{venue}</p> : null}</header>
    {view === "summary" && tournament.description ? <p className={`${styles.help} break-words`}>{tournament.description}</p> : null}
    {canManage && tournament.status === "finished" && (view === "summary" || view === "live") ? <section className={`${styles.panel} p-3 space-y-2`} aria-label={tx("Gestionar torneo finalizado")}><h2 className="type-panel-title font-black">{tx("Gestionar torneo finalizado")}</h2>{data.canRestartForTesting ? <><p className={styles.help}>{tx("Reinicio temporal para pruebas hasta el 25 de octubre. Borra resultados y conserva jugadores y cruces.")}</p><button className={`${styles.secondary} w-full`} disabled={busyAction !== ""} onClick={() => void performAction("restart")}>{busyAction === "restart" ? tx("Iniciando…") : tx("Reiniciar para pruebas")}</button></> : null}<button className={`${buttonClass} w-full text-red-700`} disabled={busyAction !== ""} onClick={() => void performAction("delete")}>{tx("Eliminar torneo")}</button></section> : null}
    {view === "summary" ? <>
      <AppCard><p className="text-xs font-black uppercase tracking-wider text-neutral-500">{formatLabel}</p><p className="mt-2 text-sm font-bold">{data.players.length} {tx("jugadores")} · {tournament.courtNames.length} {tx("pistas")} · {data.rounds.length} {tx("rondas")}</p><p className="mt-1 text-xs font-semibold text-neutral-500">{config.roundMinutes} min + {config.transitionMinutes} min · {config.reservationMinutes} min {tx("de reserva")}</p>{tournament.status === "in_progress" && roundState ? <p className="mt-3 rounded-lg bg-neutral-50 p-2 text-sm font-black">{tx("Ronda actual")} {roundState.round} · {roundState.phase === "playing" ? tx("En juego") : tx("Próxima")} · {roundState.phase === "playing" ? tx("Termina") : tx("Empieza")} {formatTime(roundCountdownTarget!, locale)}</p> : null}</AppCard>
      {canManage && tournament.status === "draft" ? <AppCard><p className="text-sm font-black">{tx(isDynamic ? "La primera ronda se generará al iniciar" : "Revisa el calendario antes de empezar")}</p><p className="mt-1 text-xs text-neutral-600">{tx(isDynamic ? "Las siguientes rondas se crearán con los resultados de la anterior." : "Puedes volver a sortear hasta que inicies el torneo.")}</p>{!isDynamic ? <Link href={`/tournaments/${tournamentId}/calendar`} className={`${primaryClass} mt-3 w-full`}>{tx("Revisar calendario")}</Link> : null}<button className={`${buttonClass} mt-2 w-full`} disabled={busyAction !== "" || (!isDynamic && !scheduleChecks.passed)} onClick={() => void performAction("start")}>{busyAction === "start" ? tx("Iniciando…") : tx("Iniciar torneo")}</button></AppCard> : null}
      {canManage && tournament.status === "draft" && !isDynamic ? scheduleValidation : null}
      {tournament.status === "in_progress" ? <AppCard><p className="text-sm font-black">{tx("Resultados registrados")} · {scoredMatches}/{isDynamic ? expectedMatchCount : configMatches}</p><Link href={`/tournaments/${tournamentId}/live`} className={`${primaryClass} mt-3 w-full`}>{tx("Ir al seguimiento")}</Link>{canManage && canGenerateNextRound ? <button className={`${buttonClass} mt-2 w-full`} disabled={busyAction !== ""} onClick={() => void performAction("next-round")}>{busyAction === "next-round" ? tx("Generando…") : tx("Generar siguiente ronda")}</button> : null}{canManage && complete ? <button className={`${buttonClass} mt-2 w-full`} disabled={busyAction !== ""} onClick={() => void performAction("finish")}>{busyAction === "finish" ? tx("Finalizando…") : tx("Finalizar torneo")}</button> : null}</AppCard> : null}
      {champions.length ? <AppCard className="border-amber-300 bg-amber-50"><p className="text-xs font-black uppercase tracking-wider text-amber-900">{champions.length > 1 ? tx("Campeones") : tx("Campeón")}</p><p className="mt-1 text-lg font-black">{championNames.join(" · ")}</p><p className="mt-1 text-sm font-bold">{championScore.toFixed(2)}%</p></AppCard> : tournament.status === "finished" ? <AppCard className="border-amber-300 bg-amber-50"><p className="text-xs font-black uppercase tracking-wider text-amber-900">{tx("Campeón")}</p><p className="mt-1 text-lg font-black">{tx("Posición compartida")}</p></AppCard> : null}
      <AppCard><p className="text-sm font-black">{tx("Próximos partidos")}</p>{roundState ? <div className="mt-2 space-y-2">{matchCards(matchesByRound(roundState.round))}</div> : <p className="mt-2 text-sm text-neutral-500">{tx(isDynamic && tournament.status === "draft" ? "La primera ronda se genera al iniciar el torneo." : "Todas las rondas han terminado.")}</p>}</AppCard>
      <div className="grid grid-cols-2 gap-2"><Link className={buttonClass} href={`/tournaments/${tournamentId}/standings`}>{tx("Ver clasificación")}</Link><Link className={buttonClass} href={`/tournaments/${tournamentId}/calendar`}>{tx("Calendario completo")}</Link><Link className={buttonClass} href={`/tournaments/${tournamentId}/players`}>{tx("Mis partidos y descansos")}</Link><Link className={buttonClass} href={`/tournaments/${tournamentId}/live`}>{tx("Seguimiento")}</Link></div>
    </> : null}
    {view === "calendar" ? <>
      <div className="flex items-center justify-between gap-2"><h2 className="type-panel-title font-black">{tx("Calendario completo")}</h2><span className={styles.chip}>{isDynamic ? `${generatedRoundCount}/${config.rounds}` : data.rounds.length} {tx("rondas")}</span></div>
      {canManage && tournament.status === "draft" ? <div className={`${styles.panel} ${styles.draft}`}><p className="text-sm font-black">{tx(isDynamic ? "Calendario dinámico" : "Sorteo provisional")}</p><p className={`${styles.help} mt-1`}>{tx(isDynamic ? "La primera ronda se genera al iniciar el torneo." : "Puedes volver a sortear antes de empezar.")}</p><div className={`mt-3 grid gap-2 ${isDynamic ? "grid-cols-1" : "grid-cols-2"}`}>{!isDynamic ? <button className={styles.secondary} disabled={busyAction !== ""} onClick={() => void performAction("draw")}>{busyAction === "draw" ? tx("Sorteando…") : tx("Volver a sortear")}</button> : null}<button className={styles.primary} disabled={busyAction !== "" || (!isDynamic && !scheduleChecks.passed)} onClick={() => void performAction("start")}>{busyAction === "start" ? tx("Iniciando…") : tx("Iniciar torneo")}</button></div></div> : null}
      {canManage && tournament.status === "draft" && !isDynamic ? scheduleValidation : null}
      {visibleRounds.map((round) => {
        const matches = matchesByRound(round.round)
        const playingIds = new Set(matches.flatMap((match) => [...match.teamAIds, ...match.teamBIds]))
        const resting = data.players.filter((player) => !playingIds.has(player.id))
        return <section key={round.round} aria-labelledby={`round-${round.round}`} className={`${styles.panel} ${styles.round}`}><header className={styles.roundHeader}><div className="flex items-center gap-2"><span className={styles.roundNumber} aria-hidden="true">{round.round}</span><h3 id={`round-${round.round}`} aria-label={`${tx("Ronda")} ${round.round} · ${formatTime(round.startsAt, locale)}–${formatTime(round.endsAt, locale)}`} className="text-sm font-black">{tx("Ronda")} {round.round}</h3></div><p className={`${styles.roundTime} type-caption font-bold`}>{formatTime(round.startsAt, locale)}–{formatTime(round.endsAt, locale)}</p></header><div className={styles.roundMatches}>{matchCards(matches)}</div><div className={styles.rest}><p className={styles.eyebrow}>{tx("Descansan")} · {resting.length}</p><div className={styles.restPlayers}>{resting.map((player) => <span key={player.id}>{player.name}</span>)}</div></div></section>
      })}
      {canManage && canGenerateNextRound ? <button className={`${primaryClass} w-full`} disabled={busyAction !== ""} onClick={() => void performAction("next-round")}>{busyAction === "next-round" ? tx("Generando…") : tx("Generar siguiente ronda")}</button> : null}
    </> : null}
    {view === "standings" ? <>
      <AppCard><p className="text-sm font-black">{complete ? tx("Clasificación final") : tx("Clasificación provisional")}</p><p className="mt-1 text-xs font-semibold text-neutral-500">{tx("Resultados registrados")} · {scoredMatches}/{isDynamic ? expectedMatchCount : configMatches}</p></AppCard>
      <div className={`${styles.standingsTable} overflow-x-auto`}><table className="w-full min-w-[520px] border-collapse text-left text-xs"><thead><tr>{(isDynamic ? [tx("Pos."), tx(isFixed ? "Pareja" : "Jugador"), tx("PJ"), tx("Descansos"), tx("V/E/D"), tx("A favor"), tx("En contra"), tx("Dif."), tx("Rendimiento")] : [tx("Pos."), tx(isFixed ? "Pareja" : "Jugador"), tx("PJ"), tx("Victorias"), tx("A favor"), tx("En contra"), tx("% medio")]).map((label) => <th key={label} className="px-2 py-3 font-black">{label}</th>)}</tr></thead><tbody>{isDynamic ? mexicanoStandings.map((item) => <tr key={item.id} className={`${styles.standingRow} ${item.position === 1 ? styles.standingLeader : ""} font-semibold`}><td className="px-2 py-2.5">{item.position}</td><td className="px-2 py-2.5">{item.name}</td><td className="px-2 py-2.5">{item.played}</td><td className="px-2 py-2.5">{item.rests}</td><td className="px-2 py-2.5">{item.wins}/{item.draws}/{item.losses}</td><td className="px-2 py-2.5">{item.pointsFor}</td><td className="px-2 py-2.5">{item.pointsAgainst}</td><td className="px-2 py-2.5">{item.difference}</td><td className="px-2 py-2.5 tabular-nums">{item.rating.toFixed(2)}</td></tr>) : standings.map((item: RapidStanding) => <tr key={item.player} className={`${styles.standingRow} ${item.position === 1 ? styles.standingLeader : ""} font-semibold`}><td className="px-2 py-2.5">{item.position}</td><td className="px-2 py-2.5">{item.player}</td><td className="px-2 py-2.5">{item.played}/{data.players.length ? Math.ceil(configMatches * 4 / data.players.length) : 0}</td><td className="px-2 py-2.5">{item.wins}</td><td className="px-2 py-2.5">{item.pointsFor}</td><td className="px-2 py-2.5">{item.pointsAgainst}</td><td className="px-2 py-2.5 tabular-nums">{item.averagePercent.toFixed(2)}%</td></tr>)}</tbody></table></div>
      {champions.length ? <AppCard className="border-amber-300 bg-amber-50"><p className="text-xs font-black uppercase text-amber-900">{champions.length > 1 ? tx("Campeones") : tx("Campeón")}</p><p className="mt-1 text-lg font-black">{championNames.join(" · ")}</p></AppCard> : null}
    </> : null}
    {view === "players" ? <>
      {data.players.some((player) => player.userId) ? <p className="text-xs font-semibold text-emerald-800">{tx("Los jugadores vinculados a una cuenta ya ven este torneo en Competiciones.")}</p> : null}
      <label className="block space-y-1"><span className="text-sm font-black">{tx("Selecciona un jugador")}</span><select className="min-h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 font-bold" value={selectedPlayer?.id ?? ""} onChange={(event) => setSelectedPlayerId(event.target.value)}>{data.players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label>
      {selectedPlayer ? data.rounds.map((round) => {
        const match = matchesByRound(round.round).find((item) => [...item.teamAIds, ...item.teamBIds].includes(selectedPlayer.id))
        if (!match) return <AppCard key={round.round}><p className="text-sm font-black">{tx("Ronda")} {round.round} · {formatTime(round.startsAt, locale)}–{formatTime(round.endsAt, locale)}</p><p className="mt-2 text-sm font-bold text-neutral-600">{tx("Descansas esta ronda")}</p></AppCard>
        const isTeamA = match.teamAIds.includes(selectedPlayer.id)
        const ownTeam = isTeamA ? match.teamA : match.teamB
        const partner = ownTeam.find((_, index) => (isTeamA ? match.teamAIds : match.teamBIds)[index] !== selectedPlayer.id)
        const rivals = isTeamA ? match.teamB : match.teamA
        const ownScore = isTeamA ? match.scoreA : match.scoreB
        const rivalScore = isTeamA ? match.scoreB : match.scoreA
        return <AppCard key={round.round}><p className="text-sm font-black">{tx("Ronda")} {round.round} · {formatTime(round.startsAt, locale)}–{formatTime(round.endsAt, locale)}</p><p className="mt-2 text-xs font-black uppercase text-neutral-500">{match.courtName}</p><p className="mt-1 text-sm font-bold">{tx("Tu compañero")}: {partner}</p><p className="text-sm font-semibold">{tx("Rivales")}: {rivals.join(" / ")}</p><p className="mt-1 text-sm font-black">{scoreLabel(ownScore, rivalScore)}</p></AppCard>
      }) : null}
    </> : null}
    {view === "live" ? <>
      {tournament.status === "in_progress" && tournament.startedAt ? <RapidTournamentLive key={tournament.startedAt} tournamentId={tournamentId} startedAt={tournament.startedAt} clockOffset={clockOffset ?? 0} plannedEnd={Date.parse(tournament.startsAt) + config.reservationMinutes * 60_000} config={config} rounds={Object.fromEntries(data.rounds.map((round) => [round.round, <div key={round.round} className="space-y-2">{matchCards(matchesByRound(round.round))}</div>]))} /> : <AppCard><p className="text-sm font-semibold">{tournament.status === "draft" ? tx("El seguimiento estará disponible al iniciar el torneo.") : tournament.status === "in_progress" ? tx("No se ha podido recuperar la hora real de inicio.") : tx("El torneo ha terminado.")}</p></AppCard>}
      {canManage && canGenerateNextRound ? <button className={`${primaryClass} w-full`} disabled={busyAction !== ""} onClick={() => void performAction("next-round")}>{busyAction === "next-round" ? tx("Generando…") : tx("Generar siguiente ronda")}</button> : null}
      {canManage && complete && tournament.status === "in_progress" ? <button className={`${primaryClass} w-full`} disabled={busyAction !== ""} onClick={() => void performAction("finish")}>{busyAction === "finish" ? tx("Finalizando…") : tx("Finalizar torneo")}</button> : null}
    </> : null}
    {actionError ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{actionError}</p> : null}
  </div>
}
type TournamentInvite = { tournament: { id: string; name: string; startsAt: string }; players: Array<{ id: string; name: string }>; expiresAt: string }
export function TournamentInviteFlow({ code }: { code: string }) {
  const { tx, locale } = useI18n()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invite, setInvite] = useState<TournamentInvite | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const callbackUrl = `/tournament-invite/${encodeURIComponent(code)}`
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/tournament-invites/${encodeURIComponent(code)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("invite_not_found"); return response.json() as Promise<TournamentInvite> })
      .then((result) => { setInvite(result); setSelectedPlayerId(result.players[0]?.id ?? "") })
      .catch(() => { if (!controller.signal.aborted) setError(tx("Esta invitación ha caducado o ya no está disponible.")) })
    return () => controller.abort()
  }, [code, tx])
  async function claim() {
    if (!selectedPlayerId) return
    setBusy(true); setError("")
    try {
      const response = await fetch(`/api/tournament-invites/${encodeURIComponent(code)}/claim`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: selectedPlayerId }) })
      const result = await response.json().catch(() => null)
      if (!response.ok || typeof result?.tournamentId !== "string") throw new Error("invite_not_available")
      router.replace(`/tournaments/${result.tournamentId}/players`)
    } catch { setError(tx("No se ha podido aceptar la invitación. Puede que el jugador ya esté vinculado o que el enlace haya caducado.")) }
    finally { setBusy(false) }
  }
  return <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-8"><AppCard className="w-full space-y-3"><p className="text-xs font-black uppercase tracking-wider text-neutral-500">{tx("Invitación a torneo")}</p>{invite ? <><h1 className="text-xl font-black">{invite.tournament.name}</h1><p className="text-sm leading-5 font-semibold">{tx("Elige tu nombre para vincularlo a tu cuenta. Solo selecciona el perfil que te corresponde.")}</p><p className="text-xs text-neutral-500">{new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(invite.tournament.startsAt))}</p>{status === "loading" ? <p role="status" className="text-sm">{tx("Comprobando tu cuenta…")}</p> : session?.user ? <><div className="grid grid-cols-2 gap-2">{invite.players.map((player) => <button key={player.id} type="button" disabled={busy} onClick={() => setSelectedPlayerId(player.id)} className={`min-h-11 rounded-xl px-3 py-2 text-sm font-black ${selectedPlayerId === player.id ? "bg-neutral-950 text-white" : "border border-neutral-200 bg-white text-neutral-800"}`}>{player.name}</button>)}</div><button className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-950 px-4 text-center font-black text-white disabled:opacity-50" disabled={busy || !selectedPlayerId} onClick={() => void claim()}>{busy ? tx("Aceptando…") : tx("Vincular mi perfil")}</button></> : <button className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-950 px-4 text-center font-black text-white" onClick={() => void signIn("google", { callbackUrl })}>{tx("Entrar con Google para continuar")}</button>}</> : <p role={error ? "alert" : "status"} className="text-sm font-semibold">{error || tx("Cargando invitación…")}</p>}{error && invite ? <p role="alert" className="text-sm font-semibold text-red-700">{error}</p> : null}</AppCard></main>
}
export { RapidTournamentCreateForm }
