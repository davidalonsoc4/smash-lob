import { useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { parseTournamentPoints } from "@/lib/tournamentResult"
import styles from "./Tournament.module.css"

export type TournamentMatchPreview = { id: string; court: number; teamA: readonly string[]; teamB: readonly string[]; scoreA: number | null; scoreB: number | null }
const scoreLabel = (a: number | null,b: number | null) => a === null || b === null ? "—" : `${a}–${b}`

export function TournamentMatchResult({ tournamentId, match, status, onSaved, canManage, title, onSaveResult }: { tournamentId: string; match: TournamentMatchPreview; status: "draft" | "in_progress" | "finished"; onSaved: () => void; canManage: boolean; title?: string; onSaveResult?: (scoreA: number, scoreB: number) => Promise<string | null> }) {
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
      if (onSaveResult) {
        const message = await onSaveResult(a,b)
        if (message) { setError(message); return }
      } else {
        const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(match.id)}/result`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scoreA: a, scoreB: b }) })
        if (!response.ok) { setError(tx("No se ha podido guardar el resultado.")); return }
      }
      setEditing(false)
      onSaved()
    } catch { setError(tx("No se ha podido guardar el resultado.")) }
    finally { setBusy(false) }
  }
  return <article className={styles.match} data-tournament-match={match.id} aria-label={`${title ?? `${tx("Pista")} ${match.court}`}: ${match.teamA.join(" / ")} ${tx("contra")} ${match.teamB.join(" / ")}`}>
    <div className={styles.matchHeader}><p className={`${styles.courtBadge} type-caption font-black`}>{title ?? `${tx("Pista")} ${match.court}`}</p>{match.scoreA !== null && match.scoreB !== null ? <p className={styles.score}>{scoreLabel(match.scoreA, match.scoreB)}</p> : <span className={styles.chip}>{tx("Pendiente")}</span>}</div>
    <div className={styles.teams}>
      <div className={styles.team}>{match.teamA.map((name, index) => <p key={index} className={`${styles.playerName} type-player-name`}>{name}</p>)}</div>
      <span className={styles.versus} aria-label={tx("contra")}>vs</span>
      <div className={styles.team}>{match.teamB.map((name, index) => <p key={index} className={`${styles.playerName} type-player-name`}>{name}</p>)}</div>
    </div>
    {canEdit ? <div className={styles.resultEditor}>{editing ? <><div className="grid grid-cols-[minmax(0,1fr)_1.2rem_minmax(0,1fr)] items-center gap-1"><label className="sr-only" htmlFor={`score-a-${match.id}`}>{tx("Puntos de")} {match.teamA.join(" / ")}</label><input id={`score-a-${match.id}`} className={`${styles.field} text-center text-lg font-black tabular-nums`} type="number" min="0" max="2147483647" step="1" inputMode="numeric" value={scoreA} onChange={(event) => setScoreA(event.target.value)} /><span className="text-center font-black">–</span><label className="sr-only" htmlFor={`score-b-${match.id}`}>{tx("Puntos de")} {match.teamB.join(" / ")}</label><input id={`score-b-${match.id}`} className={`${styles.field} text-center text-lg font-black tabular-nums`} type="number" min="0" max="2147483647" step="1" inputMode="numeric" value={scoreB} onChange={(event) => setScoreB(event.target.value)} /></div><div className="mt-2 flex gap-2"><button type="button" className={`${styles.secondary} flex-1`} onClick={() => setEditing(false)} disabled={busy}>{tx("Cancelar")}</button><button type="button" className={`${styles.primary} flex-1`} onClick={() => void save()} disabled={busy}>{busy ? tx("Guardando…") : tx("Guardar resultado")}</button></div>{error ? <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}</> : <button type="button" className={`${styles.secondary} w-full`} aria-expanded={false} onClick={() => setEditing(true)}>{tx(match.scoreA === null ? "Registrar resultado" : "Corregir resultado")}</button>}</div> : null}
  </article>
}
