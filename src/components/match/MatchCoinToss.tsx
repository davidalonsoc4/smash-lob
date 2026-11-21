import { useCallback, useEffect, useRef, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/localeFormatting"
import {
  COIN_TOSS_TIME_WINDOW_ENABLED, faceCalledByTeam, getCoinTossWindow, otherCoinTossTeam, pendingCoinTossStep,
  type CoinToss, type CoinTossChoice, type CoinTossFace, type CoinTossTeam,
} from "@/lib/matchCoinToss"
import { chooseCoinTossRequest, fetchCoinToss, tossCoinRequest, type CoinTossFailure, type CoinTossKind } from "@/lib/matchCoinTossClient"

type TeamNames = [string, string]
const teamName = (names: TeamNames, team: CoinTossTeam) => names[team - 1]

/** The coin: a gold disc with "S&L" on heads and a ball on tails. While it waits for the server it spins; then it lands on the face that came out. */
function Coin({ mode, face, variant, onLanded }: { mode: "rest" | "wait" | "land"; face: CoinTossFace; variant: number; onLanded?: () => void }) {
  const { tx } = useI18n()
  return (
    <div className="coin-scene" aria-hidden="true">
      <div className={`coin-arc ${mode === "land" ? `coin-arc-${variant} is-landing` : ""}`}>
        <div data-coin-mode={mode} onAnimationEnd={onLanded} style={{ "--coin-face": face === "heads" ? "0deg" : "180deg" } as React.CSSProperties}
          className={`coin ${mode === "wait" ? "coin-waiting" : ""} ${mode === "land" ? `coin-landing-${variant}` : ""}`}>
          <div className="coin-face"><span className="text-4xl font-black tracking-tight">S&amp;L</span><span className="mt-1 text-xs font-black uppercase tracking-widest">{tx("Cara")}</span></div>
          <div className="coin-face coin-tails"><span className="text-5xl leading-none">🎾</span><span className="mt-1 text-xs font-black uppercase tracking-widest">{tx("Cruz")}</span></div>
        </div>
      </div>
    </div>
  )
}

type Phase = "call" | "flipping" | "result" | "winner" | "other" | "done"
const phaseFor = (toss: CoinToss | null): Phase => {
  if (!toss) return "call"
  const step = pendingCoinTossStep(toss)
  return step === "winner" ? "winner" : step === "other" ? "other" : "done"
}
const bigButton = "flex min-h-14 w-full flex-col items-center justify-center rounded-2xl bg-white px-4 py-3 text-center text-base font-black text-neutral-950 active:scale-[0.98] disabled:opacity-50"

/** Full screen, for the court: who calls heads, the toss, and what the winning team picks (the other team picks what is left). */
function CoinTossDialog({ kind, matchId, teamNames, initialToss, repeat, onChange, onClose }: {
  kind: CoinTossKind
  matchId: string
  teamNames: TeamNames
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPhase("result")
    else setLanding(1 + (crypto.getRandomValues(new Uint32Array(1))[0] % 3))
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

  return (
    <div role="dialog" aria-modal="true" aria-label={tx("Sorteo del saque")} data-coin-toss-dialog
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between overflow-y-auto bg-neutral-950 px-5 pb-8 pt-4 text-white">
      <div className="flex w-full max-w-md justify-end">
        <button ref={closeRef} type="button" onClick={onClose} className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/10 text-center px-4 text-sm font-bold text-white">{tx(phase === "done" ? "Listo" : "Cerrar")}</button>
      </div>

      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 py-4">
        <Coin mode={coinMode} face={coinFace} variant={landing ?? 1} onLanded={landed} />

        <div className="w-full space-y-3 text-center" aria-live="polite">
          {phase === "call" ? <>
            <h2 className="text-2xl font-black">{tx("¿Quién canta cara?")}</h2>
            <p className="text-sm font-semibold text-neutral-300">{tx("Poneos de acuerdo y elegid. La moneda decide quién elige.")}</p>
            {([1, 2] as CoinTossTeam[]).map((headsTeam) => (
              <button key={headsTeam} type="button" data-coin-call={headsTeam} disabled={busy} onClick={() => void call(headsTeam)} className={bigButton}>
                <span>{tx("Cara")}: {teamName(teamNames, headsTeam)}</span>
                <span className="text-sm font-bold text-neutral-600">{tx("Cruz")}: {teamName(teamNames, otherCoinTossTeam(headsTeam))}</span>
              </button>
            ))}
          </> : null}

          {phase === "flipping" ? <p className="text-xl font-black">{tx("Lanzando…")}</p> : null}

          {phase === "result" && toss ? <>
            <h2 data-coin-result={toss.result} className="text-4xl font-black uppercase tracking-wide">{tx(toss.result === "heads" ? "Cara" : "Cruz")}</h2>
            <p className="text-lg font-bold">{tx("Gana")} <span className="text-amber-300">{teamName(teamNames, toss.winnerTeam)}</span></p>
            <button type="button" onClick={() => setPhase(phaseFor(toss))} className={bigButton}>{tx("Elegir")}</button>
          </> : null}

          {phase === "winner" && winner ? <>
            <h2 className="text-2xl font-black">{tx("Elige")} <span className="text-amber-300">{teamName(teamNames, winner)}</span></h2>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" data-coin-choice="serve" disabled={busy} onClick={() => void choose("serve")} className={bigButton}>{tx("Sacar")}</button>
              <button type="button" data-coin-choice="return" disabled={busy} onClick={() => void choose("return")} className={bigButton}>{tx("Restar")}</button>
            </div>
            <button type="button" data-coin-choice="side" disabled={busy} onClick={() => void choose("side")} className={bigButton}>{tx("Elegir lado")}</button>
            <p className="text-xs font-semibold text-neutral-400">{tx("El otro equipo elige lo que queda.")}</p>
          </> : null}

          {phase === "other" && winner ? <>
            <h2 className="text-2xl font-black">{tx("Elige")} <span className="text-amber-300">{teamName(teamNames, otherCoinTossTeam(winner))}</span></h2>
            <p className="text-sm font-semibold text-neutral-300">{teamName(teamNames, winner)} {tx("ha elegido el lado")}</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" data-coin-choice="serve" disabled={busy} onClick={() => void choose("serve")} className={bigButton}>{tx("Sacar")}</button>
              <button type="button" data-coin-choice="return" disabled={busy} onClick={() => void choose("return")} className={bigButton}>{tx("Restar")}</button>
            </div>
          </> : null}

          {phase === "done" && toss?.servingTeam && winner ? <>
            <p className="text-sm font-black uppercase tracking-widest text-neutral-400">{tx("Saca primero")}</p>
            <h2 data-coin-serving={toss.servingTeam} className="text-3xl font-black text-amber-300">{teamName(teamNames, toss.servingTeam)}</h2>
            <p className="text-base font-bold text-neutral-200">
              {teamName(teamNames, toss.winnerChoice === "side" ? winner : otherCoinTossTeam(winner))} {tx("elige el lado")}
            </p>
          </> : null}

          {error ? <p role="alert" className="rounded-xl bg-red-500/20 px-3 py-2 text-sm font-bold text-red-200">
            {tx(error === "closed" ? "La moneda ya no está disponible para este partido." : error === "forbidden" ? "No tienes permiso para tirar la moneda en este partido." : "No se ha podido completar. Comprueba la conexión e inténtalo de nuevo.")}
          </p> : null}
        </div>
      </div>
    </div>
  )
}

/**
 * The coin toss in the detail of a match (league or friendly): a button that opens the full screen, and the summary of
 * what came out. Available from 30 minutes before the booked time, so it is done at the court and not at home.
 */
export function MatchCoinTossPanel({ kind, matchId, scheduledAt, teamNames, canToss, matchOpen }: {
  kind: CoinTossKind
  matchId: string
  scheduledAt: string | null
  teamNames: TeamNames
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
        <p>🪙 {tx(toss.result === "heads" ? "Cara" : "Cruz")} · {tx("Gana")} <span className="font-black text-neutral-950">{teamName(teamNames, toss.winnerTeam)}</span> ({tx(faceCalledByTeam(toss.calledHeadsTeam, toss.winnerTeam) === "heads" ? "cara" : "cruz")})</p>
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
      {dialog ? <CoinTossDialog kind={kind} matchId={matchId} teamNames={teamNames} initialToss={toss} repeat={dialog.repeat} onChange={setToss} onClose={() => setDialog(null)} /> : null}
    </AppCard>
  )
}
