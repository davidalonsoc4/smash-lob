import { useMemo, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { DialogCloseButton, FloatingDialog } from "@/components/ui/FloatingDialog"
import type { PersonalMatchPerson } from "@/lib/personalMatches"

export type PickedPlayer = { personKey: string | null; displayName: string }

// Pop-up to swap one player of the friendly for another registered player (searching) or for a name typed by hand.
export function PersonalMatchPlayerPicker({ open, playerName, people, usedKeys, loading, saving, error, onClose, onConfirm }: {
  open: boolean
  playerName: string
  people: PersonalMatchPerson[]
  usedKeys: Set<string>
  loading: boolean
  saving: boolean
  error: string | null
  onClose: () => void
  onConfirm: (player: PickedPlayer) => void
}) {
  const { tx } = useI18n()
  const [query, setQuery] = useState("")
  const [choice, setChoice] = useState<string | "manual" | null>(null)
  const [manualName, setManualName] = useState("")
  const filtered = useMemo(() => {
    const clean = query.trim().toLocaleLowerCase("es-ES")
    return people.filter((person) => !person.isSelf && (!clean || [person.displayName, ...person.sourceLeagueNames].join(" ").toLocaleLowerCase("es-ES").includes(clean)))
  }, [people, query])
  const picked = choice && choice !== "manual" ? people.find((person) => person.key === choice) ?? null : null
  const canConfirm = !saving && (choice === "manual" ? manualName.trim().length >= 2 : Boolean(picked))
  const confirm = () => {
    if (choice === "manual") onConfirm({ personKey: null, displayName: manualName.trim().slice(0, 60) })
    else if (picked) onConfirm({ personKey: picked.key, displayName: picked.displayName })
  }

  return (
    <FloatingDialog open={open} onClose={onClose} title={tx("Cambiar jugador")} variant="search" busy={saving}>
      <div className="shrink-0 border-b border-neutral-100 px-3 pb-2.5 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2>{tx("Cambiar jugador")}</h2>
            <p className="truncate type-caption font-semibold text-neutral-400">{tx("Sustituir a")} {playerName}</p>
          </div>
          <DialogCloseButton onClick={onClose} disabled={saving} />
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 focus-within:border-neutral-400">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx("Buscar jugador o liga...")} aria-label={tx("Buscar jugador")} className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 text-sm font-semibold outline-none" />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
        <button type="button" onClick={() => setChoice("manual")} className={`w-full rounded-lg border px-2.5 py-2 text-left ${choice === "manual" ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-900"}`}>
          <span className="block text-xs font-black">{tx("Otro jugador...")}</span>
          <span className={`mt-0.5 block type-caption font-semibold ${choice === "manual" ? "text-neutral-300" : "text-neutral-500"}`}>{tx("Introducir nombre manualmente")}</span>
        </button>
        {choice === "manual" ? <input autoFocus value={manualName} onChange={(event) => setManualName(event.target.value.slice(0, 60))} placeholder={tx("Nombre del jugador")} aria-label={tx("Nombre del jugador")} className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400" /> : null}
        {filtered.map((person) => {
          const unavailable = usedKeys.has(person.key)
          const selected = choice === person.key
          return (
            <button key={person.key} type="button" disabled={unavailable} onClick={() => setChoice(person.key)} className={`w-full rounded-lg border px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${selected ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-900 active:bg-neutral-100"}`}>
              <span className="block truncate text-xs font-black">{person.displayName}</span>
              <span className={`mt-0.5 block truncate type-caption font-semibold ${selected ? "text-neutral-300" : "text-neutral-500"}`}>
                {person.sourceLeagueNames.length > 0 ? person.sourceLeagueNames.join(" · ") : tx("Jugador conocido")}{unavailable ? ` · ${tx("Ya está en el partido")}` : ""}
              </span>
            </button>
          )
        })}
        {loading ? <p className="px-2 py-3 text-center type-caption font-semibold text-neutral-400">{tx("Cargando jugadores compartidos...")}</p> : null}
        {!loading && filtered.length === 0 ? <p className="px-2 py-4 text-center type-caption font-semibold text-neutral-500">{tx("No hay jugadores que coincidan. Usa «Otro jugador...» para escribir el nombre.")}</p> : null}
      </div>

      <div className="shrink-0 border-t border-neutral-100 p-2.5">
        {error ? <p className="mb-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">{error}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-black text-neutral-800">{tx("Cancelar")}</button>
          <button type="button" onClick={confirm} disabled={!canConfirm} className="flex-1 rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300">{saving ? tx("Guardando...") : tx("Cambiar jugador")}</button>
        </div>
      </div>
    </FloatingDialog>
  )
}
