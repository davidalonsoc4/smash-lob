"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import {
  formatPersonalMatchDate,
  getPersonalMatchOutcome,
  getPersonalMatchSetWins,
  getPersonalMatchTeamNames,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

export default function PersonalMatchDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<PersonalMatchItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/personal-matches/${encodeURIComponent(params.id)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { item?: PersonalMatchItem }
        if (!response.ok || !payload.item) throw new Error("personal_match_lookup_failed")
        return payload.item
      })
      .then((nextItem) => {
        if (!cancelled) setItem(nextItem)
      })
      .catch(() => {
        if (!cancelled) setError("No se ha podido cargar este partido.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [params.id])

  async function deleteMatch() {
    if (!item?.canDelete || deleting) return
    if (!window.confirm("¿Eliminar este amistoso del historial de todos sus participantes?")) return

    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/personal-matches/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("personal_match_delete_failed")
      router.replace("/personal-matches")
    } catch {
      setError("No se ha podido eliminar el partido.")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/personal-matches" label="Mis partidos" />
        <AppCard className="p-4">
          <p className="text-xs font-semibold text-neutral-500">Cargando partido...</p>
        </AppCard>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/personal-matches" label="Mis partidos" />
        <AppCard className="border-red-100 bg-red-50 p-4">
          <p className="text-sm font-black text-red-800">Partido no disponible</p>
          <p className="mt-1 text-xs font-semibold text-red-700">{error}</p>
        </AppCard>
      </div>
    )
  }

  const outcome = getPersonalMatchOutcome(item)
  const wins = getPersonalMatchSetWins(item.sets)

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/personal-matches" label="Mis partidos" />
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Amistoso</p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight">Detalle del partido</h1>
            <p className="mt-1 text-xs font-semibold text-neutral-500">{formatPersonalMatchDate(item.playedAt)}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${outcome === "win" ? "bg-emerald-100 text-emerald-700" : outcome === "loss" ? "bg-red-100 text-red-700" : "bg-neutral-100 text-neutral-600"}`}>
            {outcome === "win" ? "Victoria" : outcome === "loss" ? "Derrota" : "Registrado"}
          </span>
        </div>
      </header>

      <AppCard className="p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Equipo A</p>
            <p className="mt-1 text-sm font-black leading-5 text-neutral-950">{getPersonalMatchTeamNames(item.participants, 1)}</p>
          </div>
          <div className="rounded-2xl bg-neutral-950 px-3 py-2 text-xl font-black text-white">{wins.a}-{wins.b}</div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Equipo B</p>
            <p className="mt-1 text-sm font-black leading-5 text-neutral-950">{getPersonalMatchTeamNames(item.participants, 2)}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {item.sets.map((set, index) => (
            <div key={index} className="rounded-xl bg-neutral-100 px-3 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Set {index + 1}</p>
              <p className="mt-0.5 text-sm font-black text-neutral-950">{set.a}-{set.b}</p>
            </div>
          ))}
        </div>
      </AppCard>

      <AppCard className="p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">Ubicación</p>
        <p className="mt-1 text-sm font-black text-neutral-950">{item.locationName || "No indicada"}</p>
      </AppCard>

      <AppCard className="border-blue-100 bg-blue-50 p-3">
        <p className="text-xs font-black text-blue-950">Historial personal</p>
        <p className="mt-1 text-[10px] font-semibold leading-4 text-blue-700">
          Este encuentro no pertenece a ninguna liga y no afecta a clasificación, estadísticas oficiales, récords ni MVP.
        </p>
      </AppCard>

      {item.canDelete ? (
        <button
          type="button"
          disabled={deleting}
          onClick={() => void deleteMatch()}
          className="w-full rounded-xl bg-red-50 px-3 py-2.5 text-xs font-black text-red-700 disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Eliminar partido"}
        </button>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>
      ) : null}
    </div>
  )
}
