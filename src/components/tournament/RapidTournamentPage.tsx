"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { RapidTournamentCreateForm } from "@/components/tournament/RapidTournamentCreateForm"
import { useI18n } from "@/i18n/I18nProvider"
import { calculateRapidStandings, getRapidRoundAt, getTournamentChampions, RAPID_TOURNAMENT, type RapidStanding } from "@/lib/rapidTournament"
import styles from "./Tournament.module.css"
import { RapidTournamentLive } from "./RapidTournamentLive"
import { disableRapidAudio, enableRapidAudio } from "@/lib/rapidTournamentAudio"

type TournamentData = {
  serverNow?: string
  canRestartForTesting?: boolean
  tournament: { id: string; name: string; description: string; startsAt: string; startedAt: string | null; courtNames: string[]; status: "draft" | "in_progress" | "finished"; createdByUserId: string; finishedAt: string | null; configuration: Record<string, number | string> }
  players: Array<{ id: string; slot: string; name: string }>
  rounds: Array<{ id: string; round: number; startsAt: string; endsAt: string }>
  matches: Array<{ id: string; round: number; court: 1 | 2; courtName: string; teamA: [string, string]; teamB: [string, string]; teamAIds: [string, string]; teamBIds: [string, string]; scoreA: number | null; scoreB: number | null }>
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

function MatchResult({ tournamentId, match, status, onSaved }: { tournamentId: string; match: TournamentData["matches"][number]; status: TournamentData["tournament"]["status"]; onSaved: () => void }) {
  const { tx } = useI18n()
  const [scoreA, setScoreA] = useState(match.scoreA === null ? "" : String(match.scoreA))
  const [scoreB, setScoreB] = useState(match.scoreB === null ? "" : String(match.scoreB))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(false)
  const canEdit = status === "in_progress"

  async function save() {
    const a = Number(scoreA), b = Number(scoreB)
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a + b <= 0) { setError(tx("Introduce dos números enteros no negativos y una suma mayor que cero.")); return }
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
  const [now] = useState(() => new Date())
  const [clockOffset, setClockOffset] = useState<number | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [actionError, setActionError] = useState("")
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("read_failed"); return response.json() as Promise<TournamentData> })
      .then((result) => { if (!controller.signal.aborted) { if (result.serverNow && Number.isFinite(Date.parse(result.serverNow))) setClockOffset((value) => value ?? Date.parse(result.serverNow!) - Date.now()); setData(result); setError(false) } })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [refreshKey, tournamentId])

  const standings = useMemo(() => data ? calculateRapidStandings(data.players.map((player) => player.name), data.matches) : [], [data])
  const scoredMatches = data?.matches.filter((match) => match.scoreA !== null && match.scoreB !== null).length ?? 0
  const champions = data ? getTournamentChampions(standings, data.tournament.status, scoredMatches) : []
  const selectedPlayer = data?.players.find((player) => player.id === selectedPlayerId) ?? data?.players[0]
  const roundState = data ? getRapidRoundAt(data.rounds, now) : null
  const roundCountdownTarget = roundState?.phase === "playing" ? roundState.endsAt : roundState?.startsAt

  async function performAction(action: "draw" | "start" | "finish" | "restart" | "delete") {
    if (action === "restart" && !window.confirm(tx("Se borrarán todos los resultados y empezarán dos minutos de preparación. Se conservan jugadores y cruces. ¿Reiniciar el torneo?"))) return
    if (action === "delete" && !window.confirm(tx("Se eliminarán definitivamente este torneo, sus jugadores y resultados. ¿Eliminar el torneo?"))) return
    setBusyAction(action); setActionError("")
    try {
      if (action === "start" || action === "restart") await enableRapidAudio(tournamentId)
      const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}${action === "delete" ? "" : `/${action}`}`, { method: action === "delete" ? "DELETE" : "POST" })
      if (!response.ok) { if (action === "start" || action === "restart") disableRapidAudio(); setActionError(tx(action === "draw" ? "El sorteo está bloqueado porque el torneo ya ha comenzado." : action === "start" ? "No se ha podido iniciar el torneo." : action === "finish" ? "Registra los doce resultados antes de finalizar." : "No se ha podido completar la acción. Comprueba tu conexión e inténtalo de nuevo.")); return }
      if (action === "delete") { disableRapidAudio(); router.replace("/leagues"); return }
      if (action === "start" || action === "restart") { refresh(); router.push(`/tournaments/${tournamentId}/live`) }
      else refresh()
    } catch { if (action === "start" || action === "restart") disableRapidAudio(); setActionError(tx("No se ha podido completar la acción. Comprueba tu conexión e inténtalo de nuevo.")) }
    finally { setBusyAction("") }
  }

  if (!data) return <div className="space-y-3 py-8"><Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500">‹ {tx("Mis Competiciones")}</Link><AppCard><p role={error ? "alert" : "status"} className="text-sm font-semibold text-neutral-600">{error ? tx("No se ha podido cargar este torneo o no tienes acceso.") : tx("Cargando torneo…")}</p>{error ? <button className={`${buttonClass} mt-3`} onClick={refresh}>{tx("Reintentar")}</button> : null}</AppCard></div>

  const tournament = data.tournament
  const venue = [...new Set(tournament.courtNames.flatMap((courtName) => {
    const location = courtName.match(/^(.*) · Pista [12]$/)?.[1]?.trim()
    return location ? [location] : []
  }))].join(" · ")
  const matchesByRound = (roundNumber: number) => data.matches.filter((match) => match.round === roundNumber)
  const matchCards = (matches: TournamentData["matches"]) => matches.map((match) => <MatchResult key={match.id} tournamentId={tournamentId} match={match} status={tournament.status} onSaved={refresh} />)
  const statusLabel = tournament.status === "draft" ? tx("Borrador") : tournament.status === "in_progress" ? tx("En curso") : tx("Finalizado")
  const complete = scoredMatches === 12
  const displayStart = tournament.startedAt ?? tournament.startsAt

  return <div className={`${styles.theme} ${styles.page}`}>
    <header className={`app-page-header ${styles.header}`}><Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500">‹ {tx("Mis Competiciones")}</Link><h1 className={`type-page-title font-black ${styles.headerTitle}`}>{tournament.name}</h1><div className={styles.headerContext}><span>{formatDate(displayStart, locale)} · {tournament.startedAt ? `${tx("Inicio real")} ` : ""}{formatTime(displayStart, locale)}</span><span>· {statusLabel}</span></div>{venue ? <p className={styles.headerLocation}>{venue}</p> : null}</header>
    {view === "summary" && tournament.description ? <p className={`${styles.help} break-words`}>{tournament.description}</p> : null}
    {tournament.status === "finished" && (view === "summary" || view === "live") ? <section className={`${styles.panel} p-3 space-y-2`} aria-label={tx("Gestionar torneo finalizado")}><h2 className="type-panel-title font-black">{tx("Gestionar torneo finalizado")}</h2>{data.canRestartForTesting ? <><p className={styles.help}>{tx("Reinicio temporal para pruebas hasta el 25 de octubre. Borra resultados y conserva jugadores y cruces.")}</p><button className={`${styles.secondary} w-full`} disabled={busyAction !== ""} onClick={() => void performAction("restart")}>{busyAction === "restart" ? tx("Iniciando…") : tx("Reiniciar para pruebas")}</button></> : null}<button className={`${buttonClass} w-full text-red-700`} disabled={busyAction !== ""} onClick={() => void performAction("delete")}>{tx("Eliminar torneo")}</button></section> : null}

    {view === "summary" ? <>
      <AppCard><p className="text-xs font-black uppercase tracking-wider text-neutral-500">{tx("Torneo rápido · Americana equilibrada")}</p><p className="mt-2 text-sm font-bold">12 {tx("jugadores")} · 2 {tx("pistas")} · 6 {tx("rondas")}</p><p className="mt-1 text-xs font-semibold text-neutral-500">16 min + 3 min · 120 min {tx("de reserva")}</p>{tournament.status === "in_progress" && roundState ? <p className="mt-3 rounded-lg bg-neutral-50 p-2 text-sm font-black">{tx("Ronda actual")} {roundState.round} · {roundState.phase === "playing" ? tx("En juego") : tx("Próxima")} · {roundState.phase === "playing" ? tx("Termina") : tx("Empieza")} {formatTime(roundCountdownTarget!, locale)}</p> : null}</AppCard>
      {tournament.status === "draft" ? <AppCard><p className="text-sm font-black">{tx("Revisa el calendario antes de empezar")}</p><p className="mt-1 text-xs text-neutral-600">{tx("Puedes volver a sortear hasta que inicies el torneo.")}</p><Link href={`/tournaments/${tournamentId}/calendar`} className={`${primaryClass} mt-3 w-full`}>{tx("Revisar calendario")}</Link><button className={`${buttonClass} mt-2 w-full`} disabled={busyAction !== ""} onClick={() => void performAction("start")}>{busyAction === "start" ? tx("Iniciando…") : tx("Iniciar torneo")}</button></AppCard> : null}
      {tournament.status === "in_progress" ? <AppCard><p className="text-sm font-black">{tx("Resultados registrados")} · {scoredMatches}/12</p><Link href={`/tournaments/${tournamentId}/live`} className={`${primaryClass} mt-3 w-full`}>{tx("Ir al seguimiento")}</Link>{complete ? <button className={`${buttonClass} mt-2 w-full`} disabled={busyAction !== ""} onClick={() => void performAction("finish")}>{busyAction === "finish" ? tx("Finalizando…") : tx("Finalizar torneo")}</button> : null}</AppCard> : null}
      {champions.length ? <AppCard className="border-amber-300 bg-amber-50"><p className="text-xs font-black uppercase tracking-wider text-amber-900">{champions.length > 1 ? tx("Campeones") : tx("Campeón")}</p><p className="mt-1 text-lg font-black">{champions.map((item) => item.player).join(" · ")}</p><p className="mt-1 text-sm font-bold">{champions[0].averagePercent.toFixed(2)}%</p></AppCard> : tournament.status === "finished" ? <AppCard className="border-amber-300 bg-amber-50"><p className="text-xs font-black uppercase tracking-wider text-amber-900">{tx("Campeón")}</p><p className="mt-1 text-lg font-black">{champions.length ? champions.map((item) => item.player).join(" · ") : tx("Posición compartida")}</p></AppCard> : null}
      <AppCard><p className="text-sm font-black">{tx("Próximos partidos")}</p>{roundState ? <div className="mt-2 space-y-2">{matchCards(matchesByRound(roundState.round))}</div> : <p className="mt-2 text-sm text-neutral-500">{tx("Todas las rondas han terminado.")}</p>}</AppCard>
      <div className="grid grid-cols-2 gap-2"><Link className={buttonClass} href={`/tournaments/${tournamentId}/standings`}>{tx("Ver clasificación")}</Link><Link className={buttonClass} href={`/tournaments/${tournamentId}/calendar`}>{tx("Calendario completo")}</Link><Link className={buttonClass} href={`/tournaments/${tournamentId}/players`}>{tx("Mis partidos y descansos")}</Link><Link className={buttonClass} href={`/tournaments/${tournamentId}/live`}>{tx("Seguimiento")}</Link></div>
    </> : null}

    {view === "calendar" ? <>
      <div className="flex items-center justify-between gap-2"><h2 className="type-panel-title font-black">{tx("Calendario completo")}</h2><span className={styles.chip}>6 {tx("rondas")}</span></div>
      {tournament.status === "draft" ? <div className={`${styles.panel} ${styles.draft}`}><p className="text-sm font-black">{tx("Sorteo provisional")}</p><p className={`${styles.help} mt-1`}>{tx("Puedes volver a sortear antes de empezar.")}</p><div className="mt-3 grid grid-cols-2 gap-2"><button className={styles.secondary} disabled={busyAction !== ""} onClick={() => void performAction("draw")}>{busyAction === "draw" ? tx("Sorteando…") : tx("Volver a sortear")}</button><button className={styles.primary} disabled={busyAction !== ""} onClick={() => void performAction("start")}>{busyAction === "start" ? tx("Iniciando…") : tx("Iniciar torneo")}</button></div></div> : null}
      {data.rounds.map((round) => {
        const matches = matchesByRound(round.round)
        const playingIds = new Set(matches.flatMap((match) => [...match.teamAIds, ...match.teamBIds]))
        const resting = data.players.filter((player) => !playingIds.has(player.id))
        return <section key={round.round} aria-labelledby={`round-${round.round}`} className={`${styles.panel} ${styles.round}`}><header className={styles.roundHeader}><div className="flex items-center gap-2"><span className={styles.roundNumber} aria-hidden="true">{round.round}</span><h3 id={`round-${round.round}`} aria-label={`${tx("Ronda")} ${round.round} · ${formatTime(round.startsAt, locale)}–${formatTime(round.endsAt, locale)}`} className="text-sm font-black">{tx("Ronda")} {round.round}</h3></div><p className={`${styles.roundTime} type-caption font-bold`}>{formatTime(round.startsAt, locale)}–{formatTime(round.endsAt, locale)}</p></header><div className={styles.roundMatches}>{matchCards(matches)}</div><div className={styles.rest}><p className={styles.eyebrow}>{tx("Descansan")} · {resting.length}</p><div className={styles.restPlayers}>{resting.map((player) => <span key={player.id}>{player.name}</span>)}</div></div></section>
      })}
    </> : null}

    {view === "standings" ? <>
      <AppCard><p className="text-sm font-black">{tournament.status === "finished" ? tx("Clasificación final") : tx("Clasificación provisional")}</p><p className="mt-1 text-xs font-semibold text-neutral-500">{tx("Resultados registrados")} · {scoredMatches}/12</p></AppCard>
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white"><table className="w-full min-w-[580px] border-collapse text-left text-xs"><thead className="bg-neutral-50"><tr>{[tx("Pos."), tx("Jugador"), tx("PJ"), tx("Victorias"), tx("A favor"), tx("En contra"), tx("% medio")].map((label) => <th key={label} className="px-2 py-3 font-black">{label}</th>)}</tr></thead><tbody>{standings.map((item: RapidStanding) => <tr key={item.player} className={`border-t border-neutral-100 ${item.position === 1 ? "bg-amber-50 font-black" : "font-semibold"}`}><td className="px-2 py-2.5">{item.position}</td><td className="px-2 py-2.5">{item.player}</td><td className="px-2 py-2.5">{item.played}/{RAPID_TOURNAMENT.matchesPerPlayer}</td><td className="px-2 py-2.5">{item.wins}</td><td className="px-2 py-2.5">{item.pointsFor}</td><td className="px-2 py-2.5">{item.pointsAgainst}</td><td className="px-2 py-2.5 tabular-nums">{item.averagePercent.toFixed(2)}%</td></tr>)}</tbody></table></div>
      {champions.length ? <AppCard className="border-amber-300 bg-amber-50"><p className="text-xs font-black uppercase text-amber-900">{champions.length > 1 ? tx("Campeones") : tx("Campeón")}</p><p className="mt-1 text-lg font-black">{champions.map((item) => item.player).join(" · ")}</p></AppCard> : null}
    </> : null}

    {view === "players" ? <>
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
      {tournament.status === "in_progress" && tournament.startedAt ? <RapidTournamentLive key={tournament.startedAt} tournamentId={tournamentId} startedAt={tournament.startedAt} clockOffset={clockOffset ?? 0} plannedEnd={Date.parse(tournament.startsAt) + 120 * 60_000} rounds={Object.fromEntries(data.rounds.map((round) => [round.round, <div key={round.round} className="space-y-2">{matchCards(matchesByRound(round.round))}</div>]))} /> : <AppCard><p className="text-sm font-semibold">{tournament.status === "draft" ? tx("El seguimiento estará disponible al iniciar el torneo.") : tournament.status === "in_progress" ? tx("No se ha podido recuperar la hora real de inicio.") : tx("El torneo ha terminado.")}</p></AppCard>}
      {complete && tournament.status === "in_progress" ? <button className={`${primaryClass} w-full`} disabled={busyAction !== ""} onClick={() => void performAction("finish")}>{busyAction === "finish" ? tx("Finalizando…") : tx("Finalizar torneo")}</button> : null}
    </> : null}

    {actionError ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{actionError}</p> : null}
  </div>
}

export { RapidTournamentCreateForm }
