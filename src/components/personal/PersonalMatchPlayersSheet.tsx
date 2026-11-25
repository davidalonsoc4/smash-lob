/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { requestMatchDashboardRefresh, requestPersonalProfileHistoryRefresh } from "@/lib/appRefreshEvents"
import { rememberCoinToss } from "@/lib/matchCoinTossClient"
import { bestBalanced, pairId, pairingGap, shufflePairs, winChance } from "@/lib/pairingBalance"
import { PersonalMatchPlayerPicker, type PickedPlayer } from "@/components/personal/PersonalMatchPlayerPicker"
import { sortPersonalMatchParticipants, type PersonalMatchItem, type PersonalMatchParticipant, type PersonalMatchPerson } from "@/lib/personalMatches"

type Chip = { id: string; name: string; avatarUrl: string | null; personKey: string | null; locked: boolean }
const LONG_PRESS_MS = 1200

function toChip(participant: PersonalMatchParticipant, index: number): Chip {
  return {
    id: `p${index}`,
    name: participant.displayName,
    avatarUrl: participant.avatarUrl ?? null,
    personKey: participant.personKey && !participant.personKey.startsWith("external:") ? participant.personKey : null,
    locked: participant.isCurrentUser,
  }
}
type Stat = { personKey: string; elo: number | null; matches: number; provisional: boolean }

// Court seen from above, drawn wider than the real 10 x 20 m so the cards have room for the names, with the net across the middle.
// Pair A plays at the top, pair B at the bottom. The backhand player stands closer to the net, the drive player further back, one on each side.
// As in the detail screen: the first name of pair A is the backhand, the first name of pair B is the drive.
const SLOT_POSITIONS = [
  { left: 51, top: 26 }, { left: 2, top: 3 },
  { left: 51, top: 77 }, { left: 2, top: 54 },
] as const
const CHIP_WIDTH = 47
const CHIP_HEIGHT = 20
const slotStyle = (index: number) => ({ left: `${SLOT_POSITIONS[index].left}%`, top: `${SLOT_POSITIONS[index].top}%` })
const PAIR_COLORS = ["#38bdf8", "#fb923c"] as const

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("")
}

const LINE = "#ffffff"

function CourtLines() {
  // Service lines are 6.95 m from the net on a 10 m half: 34.75 % of the court length each side.
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-[3%]">
      <div className="absolute inset-0" style={{ border: `2px solid ${LINE}` }} />
      <div className="absolute inset-x-0 h-0.5 -translate-y-1/2" style={{ top: "15.25%", background: LINE }} />
      <div className="absolute inset-x-0 h-0.5 -translate-y-1/2" style={{ top: "84.75%", background: LINE }} />
      <div className="absolute left-1/2 w-0.5 -translate-x-1/2" style={{ top: "15.25%", bottom: "15.25%", background: LINE }} />
      <div className="absolute inset-x-[-3%] top-1/2 h-1.5 -translate-y-1/2" style={{ background: LINE, boxShadow: "0 0 6px rgba(0,0,0,0.45)" }} />
    </div>
  )
}

// A pair gap of this many Elo points (or more) is shown fully red; 0 is fully green.
const GAP_RED = 250

// Colour of the pair-gap pill: intense green at 0 (perfectly balanced) to intense red at 250 Elo, one continuous gradient.
function gapColor(gap: number) {
  const hue = Math.round((1 - Math.min(GAP_RED, Math.max(0, gap)) / GAP_RED) * 130)
  return `hsl(${hue} 80% 36%)`
}

// Position (0-100) on the red-amber-green gradient: the amber middle is the average Elo of this match, and
// ±150 Elo from it reaches the full red / green. It is distance in Elo points, not a rescaling of the four players.
const DOT_SPAN = 150
function dotColor(elo: number, mean: number) {
  const position = 50 + 50 * Math.max(-1, Math.min(1, (elo - mean) / DOT_SPAN))
  const hue = position <= 50 ? (position / 50) * 42 : 42 + ((position - 50) / 50) * 88
  return `hsl(${Math.round(hue)} 82% 48%)`
}

// Elo of the player: a colour dot (how far above or below the average of the match) and the number.
function EloPill({ elo, mean, label }: { elo: number | null; mean: number; label: string }) {
  return (
    <span className="-mt-0.5 flex items-center justify-center gap-1.5 type-caption font-bold leading-none text-neutral-500" title={elo === null ? label : undefined}>
      {elo === null ? "–" : (<><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dotColor(elo, mean) }} />{elo} Elo</>)}
    </span>
  )
}

export function PersonalMatchPlayersSheet({ match, onClose, onUpdated }: { match: PersonalMatchItem; onClose: () => void; onUpdated: (match: PersonalMatchItem) => void }) {
  const { tx } = useI18n()
  const [order, setOrder] = useState<Chip[]>(() => sortPersonalMatchParticipants(match.participants).map(toChip))
  const [stats, setStats] = useState<Stat[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [drag, setDrag] = useState<{ index: number; x: number; y: number; startX: number; startY: number } | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entered, setEntered] = useState(false)
  const [closing, setClosing] = useState(false)
  const [sheetY, setSheetY] = useState(0)
  const [sheetDragging, setSheetDragging] = useState(false)
  const sheetStart = useRef(0)
  const pressTimer = useRef<number | null>(null)
  const longFired = useRef(false)
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const [people, setPeople] = useState<PersonalMatchPerson[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [pickerSaving, setPickerSaving] = useState(false)
  const [pickerError, setPickerError] = useState<string | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  // The page behind must not scroll while the sheet is open.
  useEffect(() => {
    const html = document.documentElement.style.overflow
    const body = document.body.style.overflow
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => { document.documentElement.style.overflow = html; document.body.style.overflow = body }
  }, [])

  function requestClose() {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 280)
  }
  function startSheetDrag(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return
    event.currentTarget.setPointerCapture(event.pointerId)
    sheetStart.current = event.clientY
    setSheetDragging(true)
  }
  function moveSheetDrag(event: React.PointerEvent) {
    if (sheetDragging) setSheetY(Math.max(0, event.clientY - sheetStart.current))
  }
  function endSheetDrag() {
    if (!sheetDragging) return
    setSheetDragging(false)
    if (sheetY > 110) requestClose()
    else setSheetY(0)
  }

  function loadStats() {
    fetch(`/api/personal-matches/${encodeURIComponent(match.id)}/pairing-stats`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { stats?: Stat[] } | null) => { if (payload?.stats) setStats(payload.stats) })
      .catch(() => undefined)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadStats() }, [match.id])

  async function openPicker(index: number) {
    setPickerError(null)
    setPickerIndex(index)
    if (people.length > 0 || loadingPeople) return
    setLoadingPeople(true)
    try {
      const response = await fetch("/api/personal-matches/people", { cache: "no-store" })
      const payload = (await response.json()) as { people?: PersonalMatchPerson[] }
      if (!response.ok) throw new Error("people_failed")
      const available = payload.people ?? []
      const known = new Set(available.map((person) => person.key))
      // People of this match that come from leagues the editor cannot see stay selectable.
      const existing = match.participants.flatMap((participant): PersonalMatchPerson[] => {
        const key = participant.personKey
        if (!key || key.startsWith("external:") || known.has(key)) return []
        known.add(key)
        return [{ key, displayName: participant.displayName, avatarUrl: participant.avatarUrl ?? null, sourceLeagueNames: [], isSelf: participant.isCurrentUser }]
      })
      setPeople([...available, ...existing])
    } catch {
      setPickerError(tx("No se han podido cargar los jugadores disponibles."))
    } finally {
      setLoadingPeople(false)
    }
  }

  async function changePlayer(pick: PickedPlayer) {
    if (pickerIndex === null) return
    setPickerSaving(true)
    setPickerError(null)
    try {
      const next = order.map((chip, index) => (index === pickerIndex ? { personKey: pick.personKey, name: pick.displayName } : { personKey: chip.personKey, name: chip.name }))
      const response = await fetch(`/api/personal-matches/${encodeURIComponent(match.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "participants", participants: next.map((entry, index) => ({ team: index < 2 ? 1 : 2, slot: (index % 2) + 1, personKey: entry.personKey, displayName: entry.name })) }),
      })
      const payload = (await response.json()) as { item?: PersonalMatchItem; coinTossReset?: boolean }
      if (!response.ok || !payload.item) throw new Error("change_failed")
      if (payload.coinTossReset) rememberCoinToss("friendly", match.id, null)
      requestMatchDashboardRefresh()
      onUpdated(payload.item)
      setOrder(sortPersonalMatchParticipants(payload.item.participants).map(toChip))
      setSelected(null)
      setPickerIndex(null)
      loadStats()
    } catch {
      setPickerError(tx("No se ha podido cambiar el jugador."))
    } finally {
      setPickerSaving(false)
    }
  }

  const players = useMemo(() => order.map((chip) => {
    const stat = stats.find((item) => item.personKey === chip.personKey)
    return { ...chip, elo: stat?.elo ?? null, provisional: stat?.provisional ?? false }
  }), [order, stats])
  const pairPlayers = players.map((player) => ({ key: player.id, elo: player.elo }))
  const hasRates = players.some((player) => player.elo !== null)
  const knownElos = players.flatMap((player) => (player.elo === null ? [] : [player.elo]))
  const meanElo = knownElos.length ? knownElos.reduce((total, value) => total + value, 0) / knownElos.length : 1000
  const teamElo = (a: number, b: number) => Math.round(((players[a].elo ?? 1000) + (players[b].elo ?? 1000)) / 2)
  const original = useMemo(() => sortPersonalMatchParticipants(match.participants).map((participant) => `${participant.team}-${participant.slot}-${participant.displayName}`).join("|"), [match.participants])
  const current = order.map((chip, index) => `${index < 2 ? 1 : 2}-${(index % 2) + 1}-${chip.name}`).join("|")
  const changed = original !== current

  function swap(from: number, to: number) {
    if (from === to) return
    setOrder((list) => { const next = [...list]; ;[next[from], next[to]] = [next[to], next[from]]; return next })
    setNote(null)
  }
  function tapSlot(index: number) {
    if (selected === null) setSelected(index)
    else { swap(selected, index); setSelected(null) }
  }
  function mix() {
    // Always moves players between pairs, never inside the same pair.
    const next = shufflePairs(pairPlayers)
    setOrder(next.map((player) => order.find((chip) => chip.id === player.key)!))
    setSelected(null)
    setNote(null)
  }
  function balance() {
    // A single option: the split with the smallest gap between pairs.
    const next = bestBalanced(pairPlayers)
    const same = pairId(next) === pairId(pairPlayers)
    if (!same) setOrder(next.map((player) => order.find((chip) => chip.id === player.key)!))
    setSelected(null)
    setNote(same ? tx("Estas parejas ya son las más equilibradas.") : null)
  }

  function slotFromPoint(x: number, y: number) {
    for (const element of document.elementsFromPoint(x, y)) {
      const slot = element.closest("[data-slot-index]")?.getAttribute("data-slot-index")
      if (slot !== undefined && slot !== null && Number(slot) !== drag?.index) return Number(slot)
    }
    return null
  }
  function finishDrag(event: React.PointerEvent) {
    if (!drag) return
    const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 8
    const target = slotFromPoint(event.clientX, event.clientY)
    if (moved && target !== null) { swap(drag.index, target); setSelected(null) }
    else if (!moved) tapSlot(drag.index)
    setDrag(null)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/personal-matches/${encodeURIComponent(match.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "participants", participants: order.map((chip, index) => ({ team: index < 2 ? 1 : 2, slot: (index % 2) + 1, personKey: chip.personKey, displayName: chip.name })) }),
      })
      const payload = (await response.json()) as { item?: PersonalMatchItem; coinTossReset?: boolean }
      if (!response.ok || !payload.item) throw new Error("save_failed")
      if (payload.coinTossReset) rememberCoinToss("friendly", match.id, null)
      if (payload.item.status === "finished") requestPersonalProfileHistoryRefresh()
      else requestMatchDashboardRefresh()
      onUpdated(payload.item)
      requestClose()
    } catch {
      setError(tx("No se han podido guardar las parejas."))
    } finally {
      setSaving(false)
    }
  }

  const pairHeader = (pair: 0 | 1) => (
    <div className={`flex items-center gap-1.5 type-caption font-black text-neutral-700 ${pair === 1 ? "justify-end" : ""}`}>
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PAIR_COLORS[pair] }} />
      <span>{tx(pair === 0 ? "Pareja A" : "Pareja B")}</span>
      {hasRates ? <span className="font-semibold text-neutral-500">{pair === 0 ? teamElo(0, 1) : teamElo(2, 3)} Elo</span> : null}
    </div>
  )

  return (
    <div role="dialog" aria-modal="true" aria-label={tx("Gestionar jugadores")} data-players-sheet className={`fixed inset-x-0 top-0 z-[150] flex h-[100dvh] items-end justify-center transition-colors duration-300 ${entered && !closing ? "bg-black/55" : "bg-black/0"}`} onClick={requestClose}>
      <div
        className={`flex h-[90dvh] w-full max-w-md flex-col overflow-y-auto overscroll-contain rounded-t-[28px] bg-white px-4 pt-1 shadow-2xl ${sheetDragging ? "" : "transition-transform duration-300 ease-out"}`}
        style={{ transform: closing || !entered ? "translateY(100%)" : `translateY(${sheetY}px)`, paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div data-sheet-handle className="shrink-0 touch-none" onPointerDown={startSheetDrag} onPointerMove={moveSheetDrag} onPointerUp={endSheetDrag} onPointerCancel={endSheetDrag}>
          <div className="flex justify-center py-2"><div aria-hidden="true" className="h-1.5 w-12 rounded-full bg-neutral-300" /></div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="type-panel-title text-neutral-950">{tx("Gestionar jugadores")}</p>
              <p className="mt-0.5 type-caption font-semibold text-neutral-500">{tx("Toca un jugador y luego otro para intercambiarlos, o arrástralo. Mantén pulsado uno para cambiarlo por otro jugador.")}</p>
            </div>
            <button type="button" onClick={requestClose} aria-label={tx("Cerrar")} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 active:scale-95">✕</button>
          </div>
        </div>

        <div className="relative mt-2 flex min-h-[22rem] w-full flex-1 select-none flex-col overflow-hidden rounded-2xl bg-slate-900 p-1.5 shadow-inner">
          <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-xl" style={{ background: "linear-gradient(180deg,#2f7fd1 0%,#2563b0 50%,#2f7fd1 100%)" }}>
            <CourtLines />
            {[0, 1, 2, 3].map((index) => <div key={`slot-${index}`} data-slot-index={index} aria-hidden="true" className="absolute rounded-lg bg-white/10" style={{ ...slotStyle(index), width: `${CHIP_WIDTH}%`, height: `${CHIP_HEIGHT}%` }} />)}
            {order.map((chip, index) => {
              const player = players[index]
              const dragging = drag?.index === index
              const color = PAIR_COLORS[index < 2 ? 0 : 1]
              return (
                <button
                  key={chip.id}
                  type="button"
                  data-slot-index={index}
                  data-player-chip
                  aria-pressed={selected === index}
                  aria-label={chip.name}
                  onPointerDown={(event) => {
                    setDrag({ index, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY })
                    longFired.current = false
                    if (pressTimer.current) window.clearTimeout(pressTimer.current)
                    if (!chip.locked) pressTimer.current = window.setTimeout(() => { longFired.current = true; setDrag(null); void openPicker(index) }, LONG_PRESS_MS)
                  }}
                  onPointerMove={(event) => {
                    if (drag?.index !== index) return
                    if (pressTimer.current && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 8) { window.clearTimeout(pressTimer.current); pressTimer.current = null }
                    setDrag({ ...drag, x: event.clientX, y: event.clientY })
                  }}
                  onPointerUp={(event) => {
                    if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null }
                    if (longFired.current) { longFired.current = false; setDrag(null); return }
                    finishDrag(event)
                  }}
                  onPointerCancel={() => { if (pressTimer.current) window.clearTimeout(pressTimer.current); setDrag(null) }}
                  onContextMenu={(event) => event.preventDefault()}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); tapSlot(index) } }}
                  className={`absolute flex touch-none cursor-grab flex-col items-center justify-center gap-1 rounded-lg bg-white px-2 pb-1.5 text-center ${dragging ? "z-20 cursor-grabbing shadow-2xl" : "z-10 shadow-lg transition-all duration-500 ease-out"} ${selected === index ? "ring-4 ring-amber-400" : ""}`}
                  style={{ ...slotStyle(index), width: `${CHIP_WIDTH}%`, height: `${CHIP_HEIGHT}%`, borderTop: `4px solid ${color}`, ...(dragging && drag ? { transform: `translate(${drag.x - drag.startX}px, ${drag.y - drag.startY}px) scale(1.05)` } : {}) }}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-100 text-sm font-black text-neutral-600">
                    {chip.avatarUrl ? <img src={chip.avatarUrl} alt="" draggable={false} className="h-full w-full object-cover" /> : initials(chip.name)}
                  </span>
                  <span className="block w-full truncate text-sm font-black leading-tight text-neutral-950">{chip.name}</span>
                  <EloPill elo={player.elo} mean={meanElo} label={tx("sin datos")} />
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-1.5 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
          {pairHeader(0)}
          {hasRates ? (
            <span title={tx("Diferencia de Elo entre parejas y probabilidad de ganar de la pareja con más Elo")} className="flex flex-col items-center rounded-2xl px-3 py-0.5 leading-tight" style={{ background: gapColor(pairingGap(pairPlayers)), color: "#ffffff" }}>
              <span className="text-sm font-black">{Math.round(pairingGap(pairPlayers))}</span>
              <span className="type-micro font-bold opacity-90">{Math.round(winChance(pairingGap(pairPlayers)) * 100)} %</span>
            </span>
          ) : <span />}
          {pairHeader(1)}
        </div>

        <div className="mt-1.5 grid shrink-0 grid-cols-2 gap-2">
          <button type="button" onClick={mix} className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-black text-neutral-900 transition active:scale-[0.97] active:bg-neutral-100">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
            {tx("Mezclar")}
          </button>
          <button type="button" onClick={balance} className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-black text-neutral-900 transition active:scale-[0.97] active:bg-neutral-100">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7ZM19 7l-3 7a3 3 0 0 0 6 0l-3-7Z" /></svg>
            {tx("Equilibrar")}
          </button>
        </div>
        {note ? <p className="mt-1 shrink-0 type-caption font-semibold text-neutral-500">{note}</p> : null}
        {error ? <p className="mt-1 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">{error}</p> : null}
        <div className="mt-1.5 flex shrink-0 gap-2">
          <button type="button" onClick={requestClose} disabled={saving} className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-black text-neutral-800">{tx("Cancelar")}</button>
          <button type="button" onClick={() => void save()} disabled={saving || !changed} className="flex-1 rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300">{saving ? tx("Guardando...") : tx("Guardar")}</button>
        </div>
      </div>
      {/* The pop-up is rendered in a portal, but React events still bubble through the tree: without this a click inside it would close the sheet. */}
      {pickerIndex !== null ? (
        <div className="contents" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
        <PersonalMatchPlayerPicker
          open
          playerName={order[pickerIndex].name}
          people={people}
          usedKeys={new Set(order.flatMap((chip, index) => (chip.personKey && index !== pickerIndex ? [chip.personKey] : [])))}
          loading={loadingPeople}
          saving={pickerSaving}
          error={pickerError}
          onClose={() => setPickerIndex(null)}
          onConfirm={(player) => void changePlayer(player)}
        />
        </div>
      ) : null}
    </div>
  )
}
