"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import type { PersonalMatchItem, PersonalMatchSet } from "@/lib/personalMatches"

type SetInput = { a: string; b: string }

function initialInputs(sets: PersonalMatchSet[]) {
  const rows: SetInput[] = [
    { a: "", b: "" },
    { a: "", b: "" },
    { a: "", b: "" },
  ]
  return rows.map((row, index) =>
    sets[index] ? { a: String(sets[index].a), b: String(sets[index].b) } : row,
  )
}

function parseSet(set: SetInput): PersonalMatchSet | null {
  if (!set.a.trim() && !set.b.trim()) return null
  const a = Number.parseInt(set.a, 10)
  const b = Number.parseInt(set.b, 10)
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 99 || b > 99 || a === b) {
    return null
  }
  return { a, b }
}

export function PersonalMatchResultForm({
  match,
  mode,
  onSaved,
  onCancel,
}: {
  match: PersonalMatchItem
  mode: "create" | "edit"
  onSaved: (match: PersonalMatchItem) => void
  onCancel?: () => void
}) {
  const [sets, setSets] = useState<SetInput[]>(initialInputs(match.sets))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const parsedSets = useMemo(
    () => sets.map(parseSet).filter((set): set is PersonalMatchSet => Boolean(set)),
    [sets],
  )
  const hasInvalidTouchedSet = sets.some(
    (set) => (set.a.trim() || set.b.trim()) && !parseSet(set),
  )
  const teamAWins = parsedSets.filter((set) => set.a > set.b).length
  const teamBWins = parsedSets.filter((set) => set.b > set.a).length
  const hasWinner = teamAWins !== teamBWins
  const canSave = !saving && parsedSets.length > 0 && !hasInvalidTouchedSet && hasWinner

  function updateSet(index: number, side: "a" | "b", value: string) {
    const clean = value.replace(/[^0-9]/g, "").slice(0, 2)
    setSets((current) =>
      current.map((set, setIndex) =>
        setIndex === index ? { ...set, [side]: clean } : set,
      ),
    )
    setError(null)
  }

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/personal-matches/${encodeURIComponent(match.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "result", sets: parsedSets }),
      })
      const payload = (await response.json()) as { item?: PersonalMatchItem; error?: string }
      if (!response.ok || !payload.item) {
        throw new Error(payload.error ?? "personal_match_result_failed")
      }
      onSaved(payload.item)
    } catch {
      setError("No se ha podido guardar el resultado.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppCard>
      <div>
        <p className="text-base font-black">
          {mode === "edit" ? "Editar resultado" : "Registrar resultado"}
        </p>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          Introduce los sets disputados. El marcador general se calculará automáticamente.
        </p>
      </div>

      <div className="mt-3 rounded-xl bg-neutral-100 p-2.5">
        <div className="grid grid-cols-[34px_repeat(3,minmax(38px,1fr))_34px] items-center gap-1.5">
          <div />
          {sets.map((_, index) => (
            <p key={index} className="text-center text-[10px] font-black uppercase text-neutral-500">
              Set {index + 1}
            </p>
          ))}
          <p className="text-center text-[10px] font-black uppercase text-neutral-500">Sets</p>

          <p className="text-xs font-black text-neutral-500">A</p>
          {sets.map((set, index) => (
            <input
              key={`a-${index}`}
              inputMode="numeric"
              value={set.a}
              onChange={(event) => updateSet(index, "a", event.target.value)}
              className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2 text-center text-sm font-black outline-none focus:border-neutral-500"
              aria-label={`Equipo A set ${index + 1}`}
            />
          ))}
          <p className="text-center text-lg font-black">{teamAWins}</p>

          <p className="text-xs font-black text-neutral-500">B</p>
          {sets.map((set, index) => (
            <input
              key={`b-${index}`}
              inputMode="numeric"
              value={set.b}
              onChange={(event) => updateSet(index, "b", event.target.value)}
              className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2 text-center text-sm font-black outline-none focus:border-neutral-500"
              aria-label={`Equipo B set ${index + 1}`}
            />
          ))}
          <p className="text-center text-lg font-black">{teamBWins}</p>
        </div>
      </div>

      {hasInvalidTouchedSet ? (
        <p className="mt-2 text-xs font-semibold text-red-600">Revisa los sets: no pueden quedar empatados.</p>
      ) : !hasWinner && parsedSets.length > 0 ? (
        <p className="mt-2 text-xs font-semibold text-amber-700">El resultado debe dejar un equipo ganador.</p>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">{error}</p>
      ) : null}

      <div className="mt-3 flex gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-xl bg-neutral-100 px-3 py-2 text-sm font-black text-neutral-800"
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void save()}
          disabled={!canSave}
          className="flex-1 rounded-xl bg-neutral-950 px-3 py-2 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Guardar resultado"}
        </button>
      </div>
    </AppCard>
  )
}
