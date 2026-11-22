import { useCallback, useEffect, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/localeFormatting"
import type { CoinScene, ScreenCircle } from "@/lib/coin3d"
import {
  COIN_TOSS_TIME_WINDOW_ENABLED, getCoinTossWindow, otherCoinTossTeam, pendingCoinTossStep,
  type CoinToss, type CoinTossChoice, type CoinTossFace, type CoinTossTeam,
} from "@/lib/matchCoinToss"
import { chooseCoinTossRequest, fetchCoinToss, tossCoinRequest, type CoinTossFailure, type CoinTossKind } from "@/lib/matchCoinTossClient"

type TeamNames = [string, string]
const teamName = (names: TeamNames, team: CoinTossTeam) => names[team - 1]

/** The three parts of the coin as flat layers (CSS): edge with thickness and the two faces. */
function CoinLayers() {
  return (
    <>
      {Array.from({ length: 13 }, (_, index) => <div key={index} className="coin-edge" style={{ transform: `translateZ(${index - 6}px)` }} />)}
      <div className="coin-face coin-face-smash" />
      <div className="coin-face coin-tails coin-face-lob" />
    </>
  )
}

/**
 * The flat coin (CSS): only for devices without WebGL, in the full screen of the toss. The 3D coin (src/lib/coin3d.ts) is the
 * normal one. One face is the smash (heads) and the other the lob (tails), both in relief (images made by scripts/coin-art).
 * While it waits for the server it spins; then it lands on the face that came out.
 */
function Coin({ mode, face, variant, onLanded }: { mode: "rest" | "wait" | "land"; face: CoinTossFace; variant: number; onLanded?: () => void }) {
  return (
    <div className="coin-scene" aria-hidden="true">
      <div className={`coin-shadow ${mode === "land" ? `coin-shadow-${variant}` : ""}`} />
      <div className={`coin-arc ${mode === "land" ? `coin-arc-${variant} is-landing` : ""}`}>
        <div data-coin-mode={mode} onAnimationEnd={onLanded} style={{ "--coin-face": face === "heads" ? "0deg" : "180deg" } as CSSProperties}
          className={`coin ${mode === "wait" ? "coin-waiting" : ""} ${mode === "land" ? `coin-landing-${variant}` : ""}`}>
          <CoinLayers />
        </div>
      </div>
    </div>
  )
}

/**
 * The small coin of the panel (CSS, very light): before the toss it turns slowly on its vertical axis like a preview, and after it
 * rests on the face that came out. It stops turning while it is off the screen.
 */
function MiniCoin({ face, spinning }: { face: CoinTossFace; spinning: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = useState(true)
  // The coin is as tall as the text next to it: its size follows the height it is given.
  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === "undefined") return
    const fit = () => {
      const full = element.querySelector<HTMLElement>(".coin-scene")?.offsetWidth
      if (!full) return
      element.style.setProperty("--mini-scale", String(element.clientHeight / full))
      // Round: as wide as it is tall (the button around it takes this width).
      element.style.width = `${element.clientHeight}px`
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} aria-hidden="true" data-coin-mini={spinning ? "spinning" : face} className={`coin-mini ${spinning ? "coin-mini-spinning" : ""}`}
      style={{ "--coin-face": face === "heads" ? "0deg" : "180deg" } as CSSProperties}>
      <div className="coin-scene">
        <div className="coin-arc">
          <div className="coin" style={{ animationPlayState: onScreen ? "running" : "paused" }}><CoinLayers /></div>
        </div>
      </div>
    </div>
  )
}

type Stage = "loading" | "ready" | "fallback"

/** The whole screen is the stage: the 3D coin on a canvas (drawn on demand), or the flat coin when the device cannot do WebGL. */
function CoinStage({ sceneRef, stage, onStage, initialFace, face, mode, variant, onLanded }: {
  sceneRef: MutableRefObject<CoinScene | null>
  stage: Stage
  onStage: (stage: Stage) => void
  initialFace: CoinTossFace
  face: CoinTossFace
  mode: "rest" | "wait" | "land"
  variant: number
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
  return (
    <div className="coin-stage" data-coin-stage={stage}>
      <canvas ref={canvasRef} data-coin-canvas className={stage === "fallback" ? "hidden" : "absolute inset-0 h-full w-full"} />
      {stage === "fallback" ? <div className="absolute inset-x-0 top-[14%] flex justify-center"><Coin mode={mode} face={face} variant={variant} onLanded={onLanded} /></div> : null}
    </div>
  )
}

/** call: who picks what; throw: the coin waits to be tossed; flipping: it is in the air; winner: the face that came out and what the winner picks; done: all chosen. */
type Phase = "call" | "throw" | "flipping" | "winner" | "done"
const phaseFor = (toss: CoinToss | null): Phase => {
  if (!toss) return "call"
  return pendingCoinTossStep(toss) ? "winner" : "done"
}
/** More than one player in the team ("Ana + Luis"): the verbs go in the plural. */
const isPair = (name: string) => name.includes(" + ")
const bigButton = "coin-btn flex min-h-14 w-full flex-col items-center justify-center rounded-2xl px-4 py-3 text-center text-base font-black active:scale-[0.98] disabled:opacity-50"
const smallButton = "coin-close inline-flex min-h-9 items-center justify-center rounded-full px-4 text-center text-sm font-bold"
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** The two faces of the coin carry the names of the app, the same in every language: Smash and Lob. */
const SHOT_NAME = { smash: "Smash", lob: "Lob" } as const

/** "Smash" or "Lob" and, except in English, its translation below it in small letters: (remate), (globo). */
function ShotLabel({ shot }: { shot: "smash" | "lob" }) {
  const { tx, locale } = useI18n()
  return (
    <>
      <span>{SHOT_NAME[shot]}</span>
      {locale !== "en" ? <span className="text-xs font-bold coin-btn-sub">({tx(shot === "smash" ? "remate" : "globo")})</span> : null}
    </>
  )
}

/** Where the panel and its coin are on the screen: the full screen opens from there and closes back into it. */
type Origin = { card: DOMRect | null; coin: DOMRect | null }
const circleOf = (rect: DOMRect | null): ScreenCircle | null => (rect && rect.width > 0 ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, size: Math.min(rect.width, rect.height) } : null)
const isInView = (rect: DOMRect | null) => Boolean(rect && rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth)
const clipOf = (rect: DOMRect) => `inset(${Math.max(0, rect.top)}px ${Math.max(0, window.innerWidth - rect.right)}px ${Math.max(0, window.innerHeight - rect.bottom)}px ${Math.max(0, rect.left)}px round 12px)`
const FULL_CLIP = "inset(0px round 0px)"
const CLOSE_MS = 560

/**
 * Full screen, for the court: what each team picks (remate or globo), the toss (a swipe upwards: the coin goes up to the top of
 * the screen and falls to the bottom), and what the winning team picks (the other team picks what is left). It opens from the
 * small coin of the panel and, two seconds after the last choice, closes back into it.
 */
function CoinTossDialog({ kind, matchId, teamNames, myTeam, initialToss, repeat, canRepeat, origin, getOrigin, onChange, onClose, onCoinShown }: {
  kind: CoinTossKind
  matchId: string
  teamNames: TeamNames
  /** The team of the person holding the phone, when they play this match. */
  myTeam: CoinTossTeam | null
  initialToss: CoinToss | null
  repeat: boolean
  /** The toss can be done again (while the feature is being tested). */
  canRepeat: boolean
  origin: Origin
  getOrigin: () => Origin
  onChange: (toss: CoinToss) => void
  onClose: () => void
  /** The coin of the screen is already showing: the small one of the panel can go (not before, or the coin would blink out). */
  onCoinShown: () => void
}) {
  const { tx, locale } = useI18n()
  const [toss, setToss] = useState<CoinToss | null>(initialToss)
  const [phase, setPhase] = useState<Phase>(repeat ? "call" : phaseFor(initialToss))
  const [landing, setLanding] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<CoinTossFailure | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const sceneRef = useRef<CoinScene | null>(null)
  const [stage, setStage] = useState<Stage>("loading")
  const [startFace] = useState<CoinTossFace>(initialToss?.result ?? "heads")
  /** The team that called the smash, once the pick is made and the coin waits to be tossed. */
  const [headsTeam, setHeadsTeam] = useState<CoinTossTeam | null>(null)
  // Opening and closing: the screen grows from the panel and shrinks back into it.
  const [opensFromPanel] = useState(() => !reducedMotion() && isInView(origin.card))
  const [anim, setAnim] = useState<"wait" | "enter" | "open" | "leave" | "fade">(opensFromPanel ? "wait" : "open")
  const [leaveRect, setLeaveRect] = useState<DOMRect | null>(null)
  const closing = useRef(false)
  const closeTimer = useRef<number | null>(null)

  // The screen does not start to open until the 3D coin is ready (at most 0.9 s): the small coin of the panel stays in sight until then,
  // so the coin does not blink out while the big one loads.
  useEffect(() => {
    if (anim !== "wait") return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stage !== "loading") { setAnim("enter"); return }
    const timer = window.setTimeout(() => setAnim("enter"), 900)
    return () => window.clearTimeout(timer)
  }, [anim, stage])
  useEffect(() => { if (anim !== "wait") onCoinShown() }, [anim, onCoinShown])
  useEffect(() => {
    if (anim !== "enter" || !opensFromPanel) return
    const circle = circleOf(origin.coin)
    if (circle) sceneRef.current?.appear(circle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim])
  useEffect(() => {
    if (anim !== "enter") return
    // One frame with the screen as small as the panel, so the transition has a starting point.
    let second = 0
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setAnim("open")) })
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second) }
  }, [anim])
  useEffect(() => () => { if (closeTimer.current) window.clearTimeout(closeTimer.current) }, [])

  const requestClose = useCallback(() => {
    if (closing.current) return
    closing.current = true
    const fresh = getOrigin()
    if (!reducedMotion() && isInView(fresh.card)) {
      setLeaveRect(fresh.card)
      setAnim("leave")
      const circle = circleOf(fresh.coin)
      if (circle) void sceneRef.current?.dismiss(circle)
      closeTimer.current = window.setTimeout(onClose, CLOSE_MS)
    } else {
      setAnim("fade")
      closeTimer.current = window.setTimeout(onClose, 200)
    }
  }, [getOrigin, onClose])
  const requestCloseRef = useRef(requestClose)
  useEffect(() => { requestCloseRef.current = requestClose })

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") requestCloseRef.current() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const landed = useCallback(() => {
    navigator.vibrate?.(40)
    setPhase("winner")
  }, [])
  // The flat coin: if the browser never reports the end of its animation, the result still comes out.
  useEffect(() => {
    if (landing === null || phase !== "flipping") return
    const timer = window.setTimeout(landed, 3800)
    return () => window.clearTimeout(timer)
  }, [landing, phase, landed])

  /** The toss through the server, for the flat coin and for people who prefer less motion. */
  async function call(team: CoinTossTeam) {
    if (busy) return
    setBusy(true); setError(null); setLanding(null); setPhase("flipping")
    const result = await tossCoinRequest(kind, matchId, team)
    setBusy(false)
    if (!result.ok) { setError(result.error); setPhase("call"); return }
    const next = result.state.coinToss!
    setToss(next); onChange(next)
    if (reducedMotion()) {
      sceneRef.current?.setFace(next.result)
      setPhase("winner")
      return
    }
    setLanding(1 + (crypto.getRandomValues(new Uint32Array(1))[0] % 3))
  }

  /** The 3D coin: the pick is made, now it is tossed with a swipe (or the small button). */
  function pick(team: CoinTossTeam) {
    if (busy) return
    if (stage === "ready" && !reducedMotion()) {
      setError(null)
      setHeadsTeam(team)
      setPhase("throw")
    } else void call(team)
  }

  /** The coin is in the air (the swipe started it, or the button does it now) and the server decides at the same time. */
  async function launch(power: number, startedByGesture: boolean) {
    if (!headsTeam || busy) return
    const scene = sceneRef.current
    if (!scene) return
    if (!startedByGesture) scene.launch(power)
    setBusy(true); setError(null); setPhase("flipping")
    const result = await tossCoinRequest(kind, matchId, headsTeam)
    setBusy(false)
    if (!result.ok) { scene.cancel(); setError(result.error); setPhase("throw"); return }
    const next = result.state.coinToss!
    setToss(next); onChange(next)
    await scene.land(next.result)
    setPhase("winner")
  }
  const launchRef = useRef(launch)
  useEffect(() => { launchRef.current = launch })

  // What the finger does on the coin, and where the coin waits, depend on the step.
  useEffect(() => {
    if (stage !== "ready") return
    const scene = sceneRef.current
    if (!scene) return
    scene.setLayout(phase === "throw" || phase === "flipping" ? "center" : "top")
    if (phase === "call") scene.setMode("turn")
    else if (phase === "throw") scene.setMode("throw", (power) => void launchRef.current(power, true))
    else scene.setMode("off")
  }, [stage, phase])

  async function choose(choice: CoinTossChoice) {
    if (busy) return
    setBusy(true); setError(null)
    const result = await chooseCoinTossRequest(kind, matchId, choice)
    if (!result.ok) { setBusy(false); setError(result.error); return }
    const next = result.state.coinToss!
    setToss(next); onChange(next)
    // Everything is chosen: the screen closes into the panel, which already says it all (the buttons stay off meanwhile).
    if (!pendingCoinTossStep(next)) { requestCloseRef.current(); return }
    setBusy(false)
    setPhase(phaseFor(next))
  }

  /** Start again (for as long as the toss is being tested). */
  function repeatNow() {
    setHeadsTeam(null)
    setError(null)
    setPhase("call")
  }

  const winner = toss?.winnerTeam
  const rawName = (team: CoinTossTeam) => teamName(teamNames, team)
  /** "Ana García + Luis Pérez" is shown as "Ana y Luis": first names only (they read big on the court) and joined, not added ("e" before a name that starts with i in Spanish). */
  const nm = (team: CoinTossTeam) => rawName(team).split(" + ").map((name) => name.trim().split(/\s+/)[0]).reduce((text, name, index) => {
    if (index === 0) return name
    const and = locale === "es" && /^h?i(?!e)/i.test(name.trim()) ? "e" : tx("y")
    return `${text} ${and} ${name}`
  }, "")
  const coinFace: CoinTossFace = toss?.result ?? "heads"
  const coinMode = phase === "flipping" ? (landing === null ? "wait" : "land") : phase === "winner" && landing !== null ? "land" : "rest"
  const inTheAir = phase === "throw" || phase === "flipping"
  const open = anim === "open"

  // In the body, not inside the card: a card with its own stacking or transform would stop it from covering the screen.
  if (typeof document === "undefined") return null
  const clip = open || anim === "fade" ? FULL_CLIP : clipOf((anim === "leave" ? leaveRect : origin.card) ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight))
  const motion = reducedMotion() || anim === "wait" || anim === "enter" ? "none" : anim === "fade" ? "opacity 180ms ease" : "clip-path 520ms cubic-bezier(0.25, 0.8, 0.25, 1), opacity 220ms ease 320ms"
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={tx("Sorteo del saque")} data-coin-toss-dialog data-coin-anim={anim} className="coin-toss-screen fixed inset-0 z-[200] overflow-hidden"
      style={{ clipPath: clip, opacity: anim === "leave" || anim === "fade" || anim === "wait" ? 0 : 1, transition: motion }}>
      <CoinStage sceneRef={sceneRef} stage={stage} onStage={setStage} initialFace={startFace}
        face={coinFace} mode={coinMode} variant={landing ?? 1} onLanded={landed} />

      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-between px-5 pb-8 pt-4"
        style={{ opacity: open ? 1 : 0, transition: reducedMotion() ? "none" : open ? "opacity 300ms ease 220ms" : "opacity 160ms ease" }}>
        <div className="pointer-events-auto flex w-full max-w-md justify-end">
          <button ref={closeRef} type="button" onClick={requestClose} className={smallButton}>{tx(phase === "done" ? "Listo" : "Cerrar")}</button>
        </div>

        <div className={`w-full max-w-md space-y-3 text-center ${inTheAir ? "pointer-events-none" : "pointer-events-auto"}`} aria-live="polite">
          {phase === "call" && myTeam ? <>
            <h2 className="text-2xl font-black">{tx("¿Qué elige tu equipo?")}</h2>
            <p className="text-sm font-semibold coin-muted">{nm(myTeam)}</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" data-coin-pick="smash" disabled={busy} onClick={() => pick(myTeam)} className={bigButton}><ShotLabel shot="smash" /></button>
              <button type="button" data-coin-pick="lob" disabled={busy} onClick={() => pick(otherCoinTossTeam(myTeam))} className={bigButton}><ShotLabel shot="lob" /></button>
            </div>
            <p className="text-xs font-semibold coin-dim">{tx("Quien acierte elige sacar o restar")}</p>
            {stage === "ready" ? <p className="text-xs font-semibold coin-dim">{tx("Arrastra la moneda para girarla")}</p> : null}
          </> : null}

          {phase === "call" && !myTeam ? <>
            <h2 className="text-2xl font-black">{tx("¿Quién canta smash?")}</h2>
            <p className="text-sm font-semibold coin-muted">{tx("Poneos de acuerdo y elegid. La moneda decide quién elige.")}</p>
            {([1, 2] as CoinTossTeam[]).map((team) => (
              <button key={team} type="button" data-coin-call={team} disabled={busy} onClick={() => pick(team)} className={bigButton}>
                <span>{SHOT_NAME.smash}: {nm(team)}</span>
                <span className="text-sm font-bold coin-btn-sub">{SHOT_NAME.lob}: {nm(otherCoinTossTeam(team))}</span>
              </button>
            ))}
            <p className="text-xs font-semibold coin-dim">{tx("Quien acierte elige sacar o restar")}</p>
          </> : null}

          {phase === "throw" && headsTeam ? <>
            <div data-coin-called className="space-y-0.5 text-sm font-semibold coin-muted">
              <p><FitText text={`${nm(headsTeam)}: ${SHOT_NAME.smash}`} maxPx={14}>{nm(headsTeam)}: <span className="coin-gold font-black">{SHOT_NAME.smash}</span></FitText></p>
              <p><FitText text={`${nm(otherCoinTossTeam(headsTeam))}: ${SHOT_NAME.lob}`} maxPx={14}>{nm(otherCoinTossTeam(headsTeam))}: <span className="coin-gold font-black">{SHOT_NAME.lob}</span></FitText></p>
            </div>
            <p data-coin-throw-hint className="text-xl font-black">{tx("Desliza hacia arriba para lanzar")}</p>
            <p className="text-xs font-semibold coin-dim">{tx("o")}</p>
            {/* For whoever cannot swipe (keyboard, assistive technology) or when the swipe does not register. */}
            <button type="button" data-coin-throw-button onClick={() => void launch(0.6, false)}
              className="coin-close pointer-events-auto flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-center text-base font-bold">{tx("Lanzar")}</button>
          </> : null}
          {phase === "flipping" && stage !== "ready" ? <p className="text-xl font-black">{tx("Lanzando…")}</p> : null}

          {phase === "winner" && toss && winner ? <>
            <h2 data-coin-result={toss.result} className="text-4xl font-black uppercase tracking-wide">{toss.result === "heads" ? SHOT_NAME.smash : SHOT_NAME.lob}</h2>
            {locale !== "en" ? <p className="-mt-2 text-sm font-bold coin-muted">({tx(toss.result === "heads" ? "remate" : "globo")})</p> : null}
            <p data-coin-winner className="text-lg font-bold">{tx(isPair(rawName(winner)) ? "Ganan" : "Gana")} <span className="coin-gold">{nm(winner)}</span></p>
            <p className="text-sm font-semibold coin-muted">{tx(isPair(rawName(winner)) ? "¿Qué eligen?" : "¿Qué elige?")}</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" data-coin-choice="serve" disabled={busy} onClick={() => void choose("serve")} className={bigButton}>
                <span>{tx("Sacar")}</span>
                <span className="text-xs font-bold coin-btn-sub first-letter:uppercase">{tx(isPair(rawName(winner)) ? "empiezan sacando" : "empieza sacando")}</span>
              </button>
              <button type="button" data-coin-choice="return" disabled={busy} onClick={() => void choose("return")} className={bigButton}>
                <span>{tx("Restar")}</span>
                <span className="text-xs font-bold coin-btn-sub first-letter:uppercase">{tx(isPair(rawName(winner)) ? "empiezan restando" : "empieza restando")}</span>
              </button>
            </div>
          </> : null}

          {phase === "done" && toss?.servingTeam ? <>
            <p className="text-sm font-black uppercase tracking-widest coin-dim">{tx(isPair(rawName(toss.servingTeam)) ? "Sacan primero" : "Saca primero")}</p>
            <h2 data-coin-serving={toss.servingTeam} className="font-black coin-gold"><FitText text={nm(toss.servingTeam)} maxPx={30} /></h2>
            <p className="text-base font-bold coin-muted">
              {nm(otherCoinTossTeam(toss.servingTeam))} {tx(isPair(rawName(otherCoinTossTeam(toss.servingTeam))) ? "restan" : "resta")}
            </p>
            {canRepeat ? <button type="button" data-coin-repeat onClick={repeatNow} className={smallButton}>{tx("Repetir sorteo")}</button> : null}
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

/** A text that always fits on one line: it is as big as `maxPx` and shrinks only as much as it needs for the width it has. */
function FitText({ text, maxPx, children }: { text: string; maxPx: number; children?: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const element = ref.current
    const box = element?.parentElement
    if (!element || !box) return
    const fit = () => {
      element.style.fontSize = `${maxPx}px`
      const room = box.clientWidth
      const need = element.scrollWidth
      if (need > room && room > 0) element.style.fontSize = `${Math.max(9, Math.floor((maxPx * room * 0.97) / need))}px`
    }
    fit()
    // The letters can arrive after the first measure (the font loads late) and change the width.
    let active = true
    void document.fonts?.ready.then(() => { if (active) fit() })
    if (typeof ResizeObserver === "undefined") return () => { active = false }
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => { active = false; observer.disconnect() }
  }, [text, maxPx])
  return <span ref={ref} className="block whitespace-nowrap" style={{ fontSize: maxPx }}>{children ?? text}</span>
}

/** First names of a team, for the panel ("Alain y David"), and whether the team has more than one player. */
function shortTeam(names: TeamNames, team: CoinTossTeam, and: string) {
  const firstNames = teamName(names, team).split(" + ").map((name) => name.trim().split(/\s+/)[0]).filter(Boolean)
  return { text: firstNames.join(` ${and} `), plural: firstNames.length > 1 }
}

/**
 * The coin toss in the detail of a match (league or friendly): before the toss, a short text and the small coin turning slowly;
 * after it, what each team chose and the coin resting on the face that came out. Pressing it opens the full screen (and, while it
 * is being tested, lets the toss be done again). Available from 30 minutes before the booked time when that rule is on.
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
  const [dialog, setDialog] = useState<{ repeat: boolean; origin: Origin } | null>(null)
  const [coinHidden, setCoinHidden] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const cardRef = useRef<HTMLDivElement>(null)
  const coinRef = useRef<HTMLButtonElement>(null)

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

  /** Where the panel and its coin are right now. */
  const measure = useCallback((): Origin => ({
    card: cardRef.current?.getBoundingClientRect() ?? null,
    coin: coinRef.current?.getBoundingClientRect() ?? null,
  }), [])
  const closeDialog = useCallback(() => { setDialog(null); setCoinHidden(false) }, [])
  const showBigCoin = useCallback(() => setCoinHidden(true), [])

  const tossWindow = getCoinTossWindow({ scheduledAt, now, requireTime: kind === "league", enforce: COIN_TOSS_TIME_WINDOW_ENABLED })
  const canStart = canToss && matchOpen && tossWindow.state === "open"
  if (!visible) return null
  if (!toss && !canStart && !(canToss && matchOpen && tossWindow.state === "early")) return null

  const step = toss ? pendingCoinTossStep(toss) : null
  const opensAt = tossWindow.opensAt
    ? new Intl.DateTimeFormat(getIntlLocale(locale), { hour: "2-digit", minute: "2-digit" }).format(new Date(tossWindow.opensAt))
    : null
  const openDialog = (repeat: boolean) => setDialog({ repeat, origin: measure() })

  // What each team chose, in short: the choice of the team that won the coin in big, what is left for the other team below.
  const and = tx("y")
  const winnerTeam = toss ? shortTeam(teamNames, toss.winnerTeam, and) : null
  const otherTeam = toss ? shortTeam(teamNames, otherCoinTossTeam(toss.winnerTeam), and) : null
  // Two lines always. Big: what the team that won the coin chose (the verb in the accent colour). Small: what is left for the other team.
  const verb = (choice: "serve" | "return", plural: boolean) => tx(choice === "serve" ? (plural ? "sacan" : "saca") : plural ? "restan" : "resta")
  let lead = ""
  let accent = ""
  let detail = ""
  if (toss && winnerTeam && otherTeam) {
    if (!toss.winnerChoice) {
      lead = tx("Gana")
      accent = winnerTeam.text
      detail = tx(winnerTeam.plural ? "tienen que elegir" : "tiene que elegir")
    } else {
      // The choice of the winner, and what is left for the other team.
      lead = winnerTeam.text
      accent = tx(toss.winnerChoice === "serve" ? (winnerTeam.plural ? "empiezan sacando" : "empieza sacando") : winnerTeam.plural ? "empiezan restando" : "empieza restando")
      detail = `${otherTeam.text} ${verb(toss.winnerChoice === "serve" ? "return" : "serve", otherTeam.plural)}`
    }
  }
  const canOpen = canToss && matchOpen && (canStart || Boolean(toss))

  return (
    <div ref={cardRef}>
      <AppCard data-coin-toss-panel className="!pb-2.5">
        <div className="flex items-stretch gap-3">
          <div className="min-w-0 flex-1">
            <p className="type-panel-title app-panel-title">{tx("Sorteo del saque")}</p>
            {/* The lines sit between the title and the bottom edge with the same room above and below (the card has 10px at the bottom). */}
            {toss ? <div className="mt-2.5">
              <p data-coin-panel-main className="text-sm font-semibold leading-snug text-neutral-950">{lead} <span className="coin-panel-verb">{accent}</span></p>
              <p data-coin-panel-detail className="mt-0.5 text-xs font-semibold leading-snug text-neutral-600 first-letter:uppercase">{detail}</p>
            </div> : <div className="mt-2.5">
              <p className="text-sm font-semibold leading-snug text-neutral-950">{canStart ? tx("Tira la moneda para empezar el partido") : `${tx("La moneda se activa a las")} ${opensAt ?? ""} · ${tx("30 minutos antes del partido")}`}</p>
              {canStart ? <p data-coin-panel-hint className="mt-0.5 text-xs font-semibold uppercase leading-snug tracking-wide text-neutral-600">{tx("toca la moneda para lanzarla")} →</p> : null}
            </div>}
          </div>
          <button ref={coinRef} type="button" data-coin-open {...(canStart && !toss ? { "data-coin-start": "" } : {})} {...(toss && canOpen && step ? { "data-coin-continue": "" } : {})} disabled={!canOpen} onClick={() => openDialog(false)} aria-label={tx("Sorteo del saque")}
            className="shrink-0 self-stretch rounded-full disabled:cursor-default" style={{ visibility: dialog && coinHidden ? "hidden" : "visible" }}>
            <MiniCoin face={toss?.result ?? "heads"} spinning={!toss} />
          </button>
        </div>
      </AppCard>
      {dialog ? <CoinTossDialog kind={kind} matchId={matchId} teamNames={teamNames} myTeam={myTeam} initialToss={toss} repeat={dialog.repeat} canRepeat={canStart}
        origin={dialog.origin} getOrigin={measure} onChange={setToss} onClose={closeDialog} onCoinShown={showBigCoin} /> : null}
    </div>
  )
}
