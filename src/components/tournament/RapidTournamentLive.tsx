import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { buildRapidCues, getDueRapidCues, getRapidLiveState, type RapidCue } from "@/lib/rapidTournamentTiming"
import { cancelRapidPlayback, disableRapidAudio, enableRapidAudio, playRapidAudio, playRapidCountdown, previewRapidAudio, rapidAudioEnabled, suspendRapidAudio, type RapidSpeech } from "@/lib/rapidTournamentAudio"
import { loadRapidAudio, saveRapidAudio } from "@/lib/rapidAudioSettings"
import { translateLeagueText } from "@/i18n/leagueText"
import { RapidAudioSettings } from "./RapidAudioSettings"
import styles from "./Tournament.module.css"

const speechMessage = (source: string, round?: number): RapidSpeech => Object.fromEntries((["es", "en", "eu"] as const).map((lang) => [lang, `${translateLeagueText(lang, source)}${round ? ` ${round}` : ""}`]))
const testMessage = speechMessage("Prueba de sonido. Quedan dos minutos.")
export function RapidTournamentLive({ tournamentId, startedAt, clockOffset, rounds, plannedEnd }: { tournamentId: string; startedAt: string; clockOffset: number; rounds: Record<number, ReactNode>; plannedEnd: number }) {
  const { tx, locale } = useI18n()
  const clock = useCallback(() => Date.now() + clockOffset, [clockOffset])
  const [now, setNow] = useState(clock)
  const [sound, setSound] = useState(() => rapidAudioEnabled(tournamentId))
  const [audioError, setAudioError] = useState(false)
  const [keepAwake, setKeepAwake] = useState(false)
  const [awake, setAwake] = useState(false)
  const [wakeError, setWakeError] = useState("")
  const [settings, setSettings] = useState(loadRapidAudio)
  const previous = useRef(now - (now - Date.parse(startedAt) < 3000 ? 3000 : 0))
  const announced = useRef(new Set<string>())
  const cues = useMemo(() => buildRapidCues(startedAt, settings.countdown), [startedAt, settings.countdown])
  const phase = getRapidLiveState(startedAt, now)
  const active = Boolean(phase && phase.phase !== "ended")
  const cueText = useCallback((cue: RapidCue) => speechMessage(cue.kind === "preparation" ? "Dos minutos de preparación" : cue.kind === "start" ? "Comienza la ronda" : cue.kind === "two_minutes" ? "Quedan dos minutos" : cue.kind === "finished" ? "Tiempo de torneo finalizado. Termina el punto en juego." : "Fin de ronda. Termina el punto en juego. Tres minutos de cambio.", cue.kind === "start" ? cue.round : undefined), [])

  useEffect(() => {
    let timer: number | undefined
    let disposed = false
    const resumeAudio = () => { if (rapidAudioEnabled(tournamentId)) void enableRapidAudio(tournamentId).then((ok) => { if (!disposed && !ok) { disableRapidAudio(); setSound(false); setAudioError(true) } }) }
    const update = () => {
      window.clearTimeout(timer)
      const time = clock(); setNow(time)
      if (!document.hidden && getRapidLiveState(startedAt, time)?.phase !== "ended") timer = window.setTimeout(update, 1010 - ((time - Date.parse(startedAt)) % 1000))
    }
    const visibility = () => {
      window.clearTimeout(timer)
      update()
      previous.current = clock()
      if (document.hidden) suspendRapidAudio()
      else {
        resumeAudio()
      }
    }
    if (!document.hidden) resumeAudio()
    update()
    document.addEventListener("visibilitychange", visibility)
    return () => { disposed = true; window.clearTimeout(timer); document.removeEventListener("visibilitychange", visibility); suspendRapidAudio() }
  }, [clock, startedAt, tournamentId])
  useEffect(() => {
    for (const cue of getDueRapidCues(cues, previous.current, now)) {
      if (!announced.current.has(cue.id)) { announced.current.add(cue.id); if (cue.kind === "countdown") playRapidCountdown(tournamentId, cue.count!, locale, settings); else playRapidAudio(tournamentId, cueText(cue), locale, cue.kind === "two_minutes", settings) }
    }
    previous.current = now
  }, [now, cues, cueText, locale, tournamentId, settings])
  useEffect(() => {
    if (!keepAwake || !active) return
    let cancelled = false, lock: WakeLockSentinel | null = null, requesting = false
    const acquire = async () => {
      if (cancelled || document.hidden || requesting || (lock && !lock.released)) return
      requesting = true
      try {
        if (!navigator.wakeLock) throw new Error("unsupported")
        const result = await navigator.wakeLock.request("screen")
        if (cancelled || document.hidden) { await result.release(); return }
        lock = result; setAwake(true); setWakeError("")
        result.addEventListener("release", () => { if (!cancelled) { setAwake(false); setWakeError(tx("El dispositivo ha liberado la pantalla. Vuelve a activar esta opción si lo necesitas.")) } })
      } catch { if (!cancelled) { setAwake(false); setWakeError(tx("No se ha podido mantener la pantalla encendida. Revisa el ahorro de batería del dispositivo.")) } }
      finally { requesting = false }
    }
    const visibility = () => { if (document.hidden) void lock?.release().catch(() => {}); else void acquire() }
    void acquire(); document.addEventListener("visibilitychange", visibility)
    return () => { cancelled = true; document.removeEventListener("visibilitychange", visibility); void lock?.release().catch(() => {}); setAwake(false) }
  }, [keepAwake, active, tx])

  async function toggleSound() {
    if (sound) { disableRapidAudio(); setSound(false); return }
    const ok = await enableRapidAudio(tournamentId)
    setSound(ok); setAudioError(!ok)
    if (ok) playRapidAudio(tournamentId, speechMessage("Avisos sonoros activados"), locale, false, settings)
  }
  if (!phase) return <p role="alert">{tx("No se ha podido recuperar la hora real de inicio.")}</p>
  const label = phase.phase === "preparation" ? tx("Preparación") : phase.phase === "transition" ? tx("Pausa") : phase.phase === "ended" ? tx("Tiempo de juego terminado") : `${tx("Ronda")} ${phase.round}`
  const remaining = `${String(Math.floor(phase.remaining / 60)).padStart(2, "0")}:${String(phase.remaining % 60).padStart(2, "0")}`
  const time = (value: number) => new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { hour: "2-digit", minute: "2-digit" }).format(value)
  return <>
    <section className={`${styles.panel} ${styles.liveClock}`} aria-label={tx("Temporizador del torneo")}>
      <h2 className="type-panel-title font-black" aria-live="polite">{label}</h2>
      <p className={styles.liveDigits} role="timer" aria-label={tx("Tiempo restante")}>{remaining}</p>
      <p className={styles.help}>{phase.phase === "preparation" ? tx("Preparad las pistas. La primera ronda empezará automáticamente.") : phase.phase === "transition" ? `${tx("Próxima ronda")} ${phase.round} · ${time(phase.until)}` : phase.phase === "playing" ? `${tx("Termina")} ${time(phase.until)} · ${phase.round}/6` : tx("Puedes seguir registrando resultados y finalizar desde Resumen.")}</p>
      <progress className={`${styles.progress} mt-3`} max={phase.duration || 1} value={active ? Math.max(0, phase.duration - phase.remaining) : 1} aria-label={tx("Progreso de la fase")} />
      <p className={`${styles.help} mt-3`}>{tx("Inicio real")} {time(Date.parse(startedAt))} · {tx("Fin previsto")} {time(phase.finish)}</p>
      {phase.finish > plannedEnd ? <p className={`${styles.help} mt-2`}>{tx("El fin previsto supera la hora original de la reserva.")}</p> : null}
    </section>
    <section className={`${styles.panel} p-3 space-y-3`} aria-label={tx("Controles de seguimiento")}>
      <div className="grid grid-cols-2 gap-2"><button className={styles.secondary} aria-pressed={sound} onClick={() => void toggleSound()}>{sound ? tx("Silenciar avisos") : tx("Activar avisos")}</button><button className={styles.secondary} disabled={!sound} onClick={() => previewRapidAudio(tournamentId, testMessage, locale, settings)}>{tx("Probar sonido")}</button></div>
      <RapidAudioSettings value={settings} onChange={(value) => { cancelRapidPlayback(); setSettings(value); saveRapidAudio(value) }} />
      <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-bold"><span>{tx("Evitar bloqueo durante Seguimiento")}</span><input type="checkbox" checked={keepAwake} disabled={!active} onChange={(event) => setKeepAwake(event.target.checked)} /></label>
      {awake ? <p className={styles.help} role="status">{tx("Pantalla encendida mientras Seguimiento esté visible.")}</p> : null}
      {wakeError ? <p className={styles.help} role="status">{wakeError}</p> : null}
      {audioError ? <p className={styles.help} role="alert">{tx("No se ha podido activar el sonido. Pulsa Activar avisos para reintentarlo.")}</p> : null}
      <p className={styles.help}>{tx("Tono y voz según el dispositivo. Los avisos requieren la app visible; con la pantalla bloqueada no están garantizados.")}</p>
    </section>
    {active ? <><h2 className="type-panel-title font-black">{phase.phase === "playing" ? tx("En juego") : tx("Próximos partidos")} · {tx("Ronda")} {phase.round}</h2>{rounds[phase.round]}</> : null}
  </>
}
