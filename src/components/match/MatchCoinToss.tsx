import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react"
import { createPortal } from "react-dom"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/localeFormatting"
import type { CoinScene } from "@/lib/coin3d"
import {
  COIN_TOSS_TIME_WINDOW_ENABLED, faceCalledByTeam, getCoinTossWindow, otherCoinTossTeam, pendingCoinTossStep,
  type CoinToss, type CoinTossChoice, type CoinTossFace, type CoinTossTeam,
} from "@/lib/matchCoinToss"
import { chooseCoinTossRequest, fetchCoinToss, tossCoinRequest, type CoinTossFailure, type CoinTossKind } from "@/lib/matchCoinTossClient"

type TeamNames = [string, string]
const teamName = (names: TeamNames, team: CoinTossTeam) => names[team - 1]

/**
 * The flat coin (CSS): only for devices without WebGL. The 3D coin (src/lib/coin3d.ts) is the normal one.
 * The coin: gold, with real thickness and a reeded edge. One face is the smash (heads) and the other the lob (tails), both in relief
 * (images made by scripts/coin-art/build.mjs). While it waits for the server it spins; then it lands on the face that came out.
 */
function Coin({ mode, face, variant, onLanded }: { mode: "rest" | "wait" | "land"; face: CoinTossFace; variant: number; onLanded?: () => void }) {
  return (
    <div className="coin-scene" aria-hidden="true">
      <div className={`coin-shadow ${mode === "land" ? `coin-shadow-${variant}` : ""}`} />
      <div className={`coin-arc ${mode === "land" ? `coin-arc-${variant} is-landing` : ""}`}>
        <div data-coin-mode={mode} onAnimationEnd={onLanded} style={{ "--coin-face": face === "heads" ? "0deg" : "180deg" } as React.CSSProperties}
          className={`coin ${mode === "wait" ? "coin-waiting" : ""} ${mode === "land" ? `coin-landing-${variant}` : ""}`}>
          {Array.from({ length: 13 }, (_, index) => <div key={index} className="coin-edge" style={{ transform: `translateZ(${index - 6}px)` }} />)}
          <div className="coin-face coin-face-smash" />
          <div className="coin-face coin-tails coin-face-lob" />
        </div>
      </div>
    </div>
  )
}

type Stage = "loading" | "ready" | "fallback"

/** Where the coin is: the 3D coin on a canvas (drawn on demand), or the flat one when the device cannot do WebGL. */
function CoinStage({ sceneRef, stage, onStage, initialFace, face, mode, variant, interactive, waiting, onLanded }: {
  sceneRef: MutableRefObject<CoinScene | null>
  stage: Stage
  onStage: (stage: Stage) => void
  initialFace: CoinTossFace
  face: CoinTossFace
  mode: "rest" | "wait" | "land"
  variant: number
  interactive: boolean
  waiting: boolean
  onLanded: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let active = true
    let created: CoinScene | null = null
    import("@/lib/coin3d")
      .then(({ createCoinScene }) => createCoinScene(canvas))
      .then((scene) => {
        if (!active) { scene?.dispose(); return }
        if (!scene) { onStage("fallback"); return }
        created = scene
        sceneRef.current = scene
        scene.setFace(initialFace)
        onStage("ready")
      })
      .catch(() => { if (active) onStage("fallback") })
    return () => {
      active = false
      created?.dispose()
      if (sceneRef.current === created) sceneRef.current = null
    }
    // The scene is made once per screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (stage !== "ready") return
    sceneRef.current?.setInteractive(interactive)
    sceneRef.current?.setWaiting(waiting)
  }, [stage, interactive, waiting, sceneRef])
  useEffect(() => {
    if (stage === "ready" && mode === "rest") sceneRef.current?.setFace(face)
  }, [stage, mode, face, sceneRef])
  return (
    <div className="coin-stage" data-coin-stage={stage}>
      <canvas ref={canvasRef} data-coin-canvas className={stage === "fallback" ? "hidden" : "absolute inset-0 h-full w-full"} />
      {stage === "fallback" ? <div className="flex h-full items-center justify-center"><Coin mode={mode} face={face} variant={variant} onLanded={onLanded} /></div> : null}
    </div>
  )
}

type Phase = "call" | "flipping" | "result" | "winner" | "other" | "done"
const phaseFor = (toss: CoinToss | null): Phase => {
  if (!toss) return "call"
  const step = pendingCoinTossStep(toss)
  return step === "winner" ? "winner" : step === "other" ? "other" : "done"
}
const bigButton = "coin-btn flex min-h-14 w-full flex-col items-center justify-center rounded-2xl px-4 py-3 text-center text-base font-black active:scale-[0.98] disabled:opacity-50"

/** Full screen, for the court: who calls heads, the toss, and what the winning team picks (the other team picks what is left). */
function CoinTossDialog({ kind, matchId, teamNames, myTeam, initialToss, repeat, onChange, onClose }: {
  kind: CoinTossKind
  matchId: string
  teamNames: TeamNames
  /** The team of the person holding the phone, when they play this match. */
  myTeam: CoinTossTeam | null
  initialToss: CoinToss | null
  repeat: boolean
  onChange: (toss: CoinToss) => void
  onClose: () => void
}) {
  const { tx } = useI18n()
  const [toss, setToss] = useState<CoinToss | null>(initialToss)
  const [phase, setPhase] = useState<Phase>(repeat ? "call" : phaseFor(initialToss))
  const [landing, setLanding] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<CoinTossFailure | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const sceneRef = useRef<CoinScene | null>(null)
  const [stage, setStage] = useState<Stage>("loading")
  const [startFace] = useState<CoinTossFace>(initialToss?.result ?? "heads")

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const landed = useCallback(() => {
    navigator.vibrate?.(40)
    setPhase("result")
  }, [])
  // If the browser never reports the end of the animation, the result still comes out.
  useEffect(() => {
    if (landing === null || phase !== "flipping") return
    const timer = window.setTimeout(landed, 3800)
    return () => window.clearTimeout(timer)
  }, [landing, phase, landed])

  async function call(headsTeam: CoinTossTeam) {
    if (busy) return
    setBusy(true); setError(null); setLanding(null); setPhase("flipping")
    const result = await tossCoinRequest(kind, matchId, headsTeam)
    setBusy(false)
    if (!result.ok) { setError(result.error); setPhase("call"); return }
    const next = result.state.coinToss!
    setToss(next); onChange(next)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sceneRef.current?.setFace(next.result)
      setPhase("result")
      return
    }
    const variant = 1 + (crypto.getRandomValues(new Uint32Array(1))[0] % 3)
    setLanding(variant)
    // The 3D coin tells when it has stopped; the flat one does it through its animation.
    void sceneRef.current?.toss(next.result, variant).then(landed)
  }

  async function choose(choice: CoinTossChoice) {
    if (busy) return
    setBusy(true); setError(null)
    const result = await chooseCoinTossRequest(kind, matchId, choice)
    setBusy(false)
    if (!result.ok) { setError(result.error); return }
    setToss(result.state.coinToss!); onChange(result.state.coinToss!)
    setPhase(phaseFor(result.state.coinToss))
  }

  const winner = toss?.winnerTeam
  const coinFace: CoinTossFace = toss?.result ?? "heads"
  const coinMode = phase === "flipping" ? (landing === null ? "wait" : "land") : phase === "result" && landing !== null ? "land" : "rest"

  // In the body, not inside the card: a card with its own stacking or transform would stop it from covering the screen.
  if (typeof document === "undefined") return null
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={tx("Sorteo del saque")} data-coin-toss-dialog
      className="coin-toss-screen fixed inset-0 z-[200] flex flex-col items-center justify-between overflow-y-auto px-5 pb-8 pt-4">
      <div className="flex w-full max-w-md justify-end">
        <button ref={closeRef} type="button" onClick={onClose} className="coin-close inline-flex min-h-10 items-center justify-center rounded-full px-4 text-center text-sm font-bold">{tx(phase === "done" ? "Listo" : "Cerrar")}</button>
      </div>

      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 py-4">
        <CoinStage sceneRef={sceneRef} stage={stage} onStage={setStage} initialFace={startFace} face={coinFace} mode={coinMode} variant={landing ?? 1}
          interactive={phase === "call"} waiting={phase === "flipping" && landing === null} onLanded={landed} />
        {stage === "ready" && phase === "call" ? <p className="-mt-3 text-xs font-semibold coin-dim">{tx("Arrastra la moneda para girarla")}</p> : null}

        <div className="w-full space-y-3 text-center" aria-live="polite">
          {phase === "call" && myTeam ? <>
            <h2 className="text-2xl font-black">{tx("¿Qué elige tu equipo?")}</h2>
            <p className="text-sm font-semibold coin-muted">{teamName(teamNames, myTeam)}</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" data-coin-pick="smash" disabled={busy} onClick={() => void call(myTeam)} className={bigButton}>{tx("Remate")}</button>
              <button type="button" data-coin-pick="lob" disabled={busy} onClick={() => void call(otherCoinTossTeam(myTeam))} className={bigButton}>{tx("Globo")}</button>
            </div>
          </> : null}

          {phase === "call" && !myTeam ? <>
            <h2 className="text-2xl font-black">{tx("¿Quién canta remate?")}</h2>
            <p className="text-sm font-semibold coin-muted">{tx("Poneos de acuerdo y elegid. La moneda decide quién elige.")}</p>
            {([1, 2] as CoinTossTeam[]).map((headsTeam) => (
              <button key={headsTeam} type="button" data-coin-call={headsTeam} disabled={busy} onClick={() => void call(headsTeam)} className={bigButton}>
                <span>{tx("Remate")}: {teamName(teamNames, headsTeam)}</span>
                <span className="text-sm font-bold coin-btn-sub">{tx("Globo")}: {teamName(teamNames, otherCoinTossTeam(headsTeam))}</span>
              </button>
            ))}
          </> : null}

          {phase === "flipping" ? <p className="text-xl font-black">{tx("Lanzando…")}</p> : null}

          {phase === "result" && toss ? <>
            <h2 data-coin-result={toss.result} className="text-4xl font-black uppercase tracking-wide">{tx(toss.result === "heads" ? "Remate" : "Globo")}</h2>
            <p className="text-lg font-bold">{tx("Gana")} <span className="coin-gold">{teamName(teamNames, toss.winnerTeam)}</span></p>
            <button type="button" onClick={() => setPhase(phaseFor(toss))} className={bigButton}>{tx("Elegir")}</button>
          </> : null}

          {phase === "winner" && winner ? <>
            <h2 className="text-2xl font-black">{tx("Elige")} <span className="coin-gold">{teamName(teamNames, winner)}</span></h2>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" data-coin-choice="serve" disabled={busy} onClick={() => void choose("serve")} className={bigButton}>{tx("Sacar")}</button>
              <button type="button" data-coin-choice="return" disabled={busy} onClick={() => void choose("return")} className={bigButton}>{tx("Restar")}</button>
            </div>
            <button type="button" data-coin-choice="side" disabled={busy} onClick={() => void choose("side")} className={bigButton}>{tx("Elegir lado")}</button>
            <p className="text-xs font-semibold coin-dim">{tx("El otro equipo elige lo que queda.")}</p>
          </> : null}

          {phase === "other" && winner ? <>
            <h2 className="text-2xl font-black">{tx("Elige")} <span className="coin-gold">{teamName(teamNames, otherCoinTossTeam(winner))}</span></h2>
            <p className="text-sm font-semibold coin-muted">{teamName(teamNames, winner)} {tx("ha elegido el lado")}</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" data-coin-choice="serve" disabled={busy} onClick={() => void choose("serve")} className={bigButton}>{tx("Sacar")}</button>
              <button type="button" data-coin-choice="return" disabled={busy} onClick={() => void choose("return")} className={bigButton}>{tx("Restar")}</button>
            </div>
          </> : null}

          {phase === "done" && toss?.servingTeam && winner ? <>
            <p className="text-sm font-black uppercase tracking-widest coin-dim">{tx("Saca primero")}</p>
            <h2 data-coin-serving={toss.servingTeam} className="text-3xl font-black coin-gold">{teamName(teamNames, toss.servingTeam)}</h2>
            <p className="text-base font-bold coin-muted">
              {teamName(teamNames, toss.winnerChoice === "side" ? winner : otherCoinTossTeam(winner))} {tx("elige el lado")}
            </p>
          </> : null}

          {error ? <p role="alert" className="coin-error rounded-xl px-3 py-2 text-sm font-bold">
            {tx(error === "closed" ? "La moneda ya no está disponible para este partido." : error === "forbidden" ? "No tienes permiso para tirar la moneda en este partido." : "No se ha podido completar. Comprueba la conexión e inténtalo de nuevo.")}
          </p> : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * The coin toss in the detail of a match (league or friendly): a button that opens the full screen, and the summary of
 * what came out. Available from 30 minutes before the booked time, so it is done at the court and not at home.
 */
export function MatchCoinTossPanel({ kind, matchId, scheduledAt, teamNames, myTeam = null, canToss, matchOpen }: {
  kind: CoinTossKind
  matchId: string
  scheduledAt: string | null
  teamNames: TeamNames
  /** The team of the person who is looking, if they play the match: the screen asks what their team picks. */
  myTeam?: CoinTossTeam | null
  /** The person may toss and choose (a player of the match, an administrator). */
  canToss: boolean
  /** The match has not been played yet. */
  matchOpen: boolean
}) {
  const { tx, locale } = useI18n()
  const [toss, setToss] = useState<CoinToss | null>(null)
  const [visible, setVisible] = useState(false)
  const [dialog, setDialog] = useState<{ repeat: boolean } | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let active = true
    void fetchCoinToss(kind, matchId).then((state) => {
      if (!active || !state) return
      setToss(state.coinToss)
      setVisible(true)
    })
    return () => { active = false }
  }, [kind, matchId])
  // The window can open while the screen is on (people wait outside before the time).
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  // The two faces are images: load them before the screen opens so the coin does not spin blank.
  const canPreload = canToss && matchOpen
  useEffect(() => {
    if (!canPreload) return
    for (const name of ["smash", "lob", "smash-height", "lob-height"]) new Image().src = `/coin/${name}.webp`
    // The 3D engine is its own chunk: fetch it now, so the coin shows as soon as the screen opens.
    void import("@/lib/coin3d")
  }, [canPreload])

  const tossWindow = getCoinTossWindow({ scheduledAt, now, requireTime: kind === "league", enforce: COIN_TOSS_TIME_WINDOW_ENABLED })
  const canStart = canToss && matchOpen && tossWindow.state === "open"
  if (!visible) return null
  if (!toss && !canStart && !(canToss && matchOpen && tossWindow.state === "early")) return null

  const step = toss ? pendingCoinTossStep(toss) : null
  const opensAt = tossWindow.opensAt
    ? new Intl.DateTimeFormat(getIntlLocale(locale), { hour: "2-digit", minute: "2-digit" }).format(new Date(tossWindow.opensAt))
    : null

  return (
    <AppCard data-coin-toss-panel>
      <p className="type-panel-title">{tx("Sorteo del saque")}</p>
      {toss ? <div className="mt-1 space-y-0.5 text-sm font-semibold text-neutral-700">
        <p>🪙 {tx(toss.result === "heads" ? "Remate" : "Globo")} · {tx("Gana")} <span className="font-black text-neutral-950">{teamName(teamNames, toss.winnerTeam)}</span> ({tx(faceCalledByTeam(toss.calledHeadsTeam, toss.winnerTeam) === "heads" ? "remate" : "globo")})</p>
        {toss.servingTeam ? <p data-coin-summary-serving>{tx("Saca primero")}: <span className="font-black text-neutral-950">{teamName(teamNames, toss.servingTeam)}</span></p> : null}
        {step === "other" ? <p>{teamName(teamNames, otherCoinTossTeam(toss.winnerTeam))} {tx("tiene que elegir sacar o restar")}</p> : null}
        {step === "winner" ? <p>{teamName(teamNames, toss.winnerTeam)} {tx("tiene que elegir")}</p> : null}
        {toss.servingTeam ? <p>{teamName(teamNames, toss.winnerChoice === "side" ? toss.winnerTeam : otherCoinTossTeam(toss.winnerTeam))} {tx("elige el lado")}</p> : null}
      </div> : <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {canStart ? tx("Para decidir en la pista quién empieza sacando.") : `${tx("La moneda se activa a las")} ${opensAt ?? ""} · ${tx("30 minutos antes del partido")}`}
      </p>}
      {canStart && !toss ? <button type="button" data-coin-start onClick={() => setDialog({ repeat: false })} className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-950 px-4 text-center text-sm font-black text-white">🪙 {tx("Tirar la moneda")}</button> : null}
      {toss && canToss && matchOpen && step ? <button type="button" data-coin-continue onClick={() => setDialog({ repeat: false })} className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-950 px-4 text-center text-sm font-black text-white">{tx("Continuar")}</button> : null}
      {toss && canStart ? <button type="button" data-coin-repeat onClick={() => setDialog({ repeat: true })} className="mt-2 inline-flex min-h-9 w-full items-center justify-center rounded-xl bg-neutral-100 px-3 text-center text-xs font-black text-neutral-700">{tx("Repetir sorteo")}</button> : null}
      {dialog ? <CoinTossDialog kind={kind} matchId={matchId} teamNames={teamNames} myTeam={myTeam} initialToss={toss} repeat={dialog.repeat} onChange={setToss} onClose={() => setDialog(null)} /> : null}
    </AppCard>
  )
}
