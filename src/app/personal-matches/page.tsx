"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { PersonalMatchCard } from "@/components/personal/PersonalMatchCard"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  getPersonalMatchOutcome,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

export default function PersonalMatchesPage() {
  const [items, setItems] = useState<PersonalMatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch("/api/personal-matches", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as {
          items?: PersonalMatchItem[]
          error?: string
        }
        if (!response.ok) throw new Error(payload.error ?? "personal_matches_lookup_failed")
        return payload.items ?? []
      })
      .then((nextItems) => {
        if (!cancelled) setItems(nextItems)
      })
      .catch(() => {
        if (!cancelled) setError("No se ha podido cargar tu historial personal.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const summary = useMemo(() => {
    let wins = 0
    let losses = 0
    for (const item of items) {
      const outcome = getPersonalMatchOutcome(item)
      if (outcome === "win") wins += 1
      if (outcome === "loss") losses += 1
    }
    return { wins, losses }
  }, [items])

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/leagues" label="Mis ligas" />
        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Actividad personal
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Mis partidos</h1>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
              Tu historial de amistosos fuera de las competiciones de liga.
            </p>
          </div>
          <Link
            href="/personal-matches/new"
            className="shrink-0 rounded-xl bg-neutral-950 px-3 py-2.5 text-xs font-black text-white"
          >
            + Partido
          </Link>
        </div>
      </header>

      <AppCard className="p-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-neutral-100 px-2 py-2">
            <p className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Partidos</p>
            <p className="mt-0.5 text-lg font-black text-neutral-950">{items.length}</p>
          </div>
          <div className="rounded-xl bg-neutral-100 px-2 py-2">
            <p className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Victorias</p>
            <p className="mt-0.5 text-lg font-black text-neutral-950">{summary.wins}</p>
          </div>
          <div className="rounded-xl bg-neutral-100 px-2 py-2">
            <p className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Derrotas</p>
            <p className="mt-0.5 text-lg font-black text-neutral-950">{summary.losses}</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] font-semibold leading-4 text-neutral-500">
          Estos datos son personales y no modifican clasificaciones, estadísticas, récords ni MVP de tus ligas.
        </p>
      </AppCard>

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            Historial
          </p>
          {items.length > 0 ? (
            <span className="text-[10px] font-bold text-neutral-400">Más recientes primero</span>
          ) : null}
        </div>

        {loading ? (
          <AppCard className="p-4">
            <p className="text-xs font-semibold text-neutral-500">Cargando partidos...</p>
          </AppCard>
        ) : error ? (
          <AppCard className="border-red-100 bg-red-50 p-3">
            <p className="text-xs font-bold text-red-700">{error}</p>
          </AppCard>
        ) : items.length === 0 ? (
          <EmptyState
            title="Todavía no has registrado amistosos"
            description="Guarda aquí los partidos que juegues fuera de tus ligas. Si otro participante tiene cuenta vinculada, el mismo encuentro aparecerá también en su historial."
            action={{ label: "Registrar mi primer partido", href: "/personal-matches/new" }}
          />
        ) : (
          <div className="space-y-2">
            {items.map((match) => (
              <PersonalMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
