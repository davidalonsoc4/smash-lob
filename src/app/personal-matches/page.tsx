"use client"

import { useEffect, useMemo, useState } from "react"
import { PersonalMatchCard } from "@/components/personal/PersonalMatchCard"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import type {
  PersonalMatchItem,
  PersonalMatchNextScope,
  PersonalMatchesDashboardPayload,
} from "@/lib/personalMatches"

const pageSize = 10

function emptyDashboard(): PersonalMatchesDashboardPayload {
  return {
    items: [],
    hasMore: false,
    nextOffset: null,
    upcoming: { league: null, friendly: null },
  }
}

export default function PersonalMatchesPage() {
  const [dashboard, setDashboard] = useState<PersonalMatchesDashboardPayload>(emptyDashboard)
  const [nextScope, setNextScope] = useState<PersonalMatchNextScope>("league")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/personal-matches?limit=${pageSize}&offset=0&includeUpcoming=1`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json()) as PersonalMatchesDashboardPayload & {
          error?: string
        }
        if (!response.ok) throw new Error(payload.error ?? "personal_matches_lookup_failed")
        return payload
      })
      .then((payload) => {
        if (cancelled) return
        setDashboard(payload)
        setNextScope(payload.upcoming.league ? "league" : "friendly")
      })
      .catch(() => {
        if (!cancelled) setError("No se ha podido cargar tu historial de partidos.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const hasBothUpcoming = Boolean(
    dashboard.upcoming.league && dashboard.upcoming.friendly,
  )
  const selectedUpcoming = useMemo<PersonalMatchItem | null>(() => {
    if (nextScope === "league") {
      return dashboard.upcoming.league ?? dashboard.upcoming.friendly
    }
    return dashboard.upcoming.friendly ?? dashboard.upcoming.league
  }, [dashboard.upcoming.friendly, dashboard.upcoming.league, nextScope])

  async function loadMore() {
    if (loadingMore || !dashboard.hasMore || dashboard.nextOffset === null) return

    setLoadingMore(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/personal-matches?limit=${pageSize}&offset=${dashboard.nextOffset}&includeUpcoming=0`,
        { cache: "no-store" },
      )
      const payload = (await response.json()) as PersonalMatchesDashboardPayload & {
        error?: string
      }
      if (!response.ok) throw new Error(payload.error ?? "personal_matches_lookup_failed")

      setDashboard((current) => ({
        ...current,
        items: [...current.items, ...payload.items],
        hasMore: payload.hasMore,
        nextOffset: payload.nextOffset,
      }))
    } catch {
      setError("No se han podido cargar más partidos.")
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="compact-page space-y-4">
      <header className="app-page-header">
        <h1 className="type-page-title font-black tracking-tight">Mis partidos</h1>
        <p className="mt-0.5 type-caption font-black uppercase tracking-[0.2em] text-neutral-400">
          Actividad personal
        </p>
      </header>

      {!loading && selectedUpcoming ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="type-caption font-black uppercase tracking-[0.2em] text-neutral-400">
              Próximo partido
            </p>

            {hasBothUpcoming ? (
              <div
                className="flex rounded-lg bg-neutral-100 p-0.5"
                aria-label="Tipo de próximo partido"
              >
                {(["league", "friendly"] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setNextScope(scope)}
                    className={`rounded-md px-2.5 py-1 type-caption font-black transition ${
                      nextScope === scope
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-500"
                    }`}
                  >
                    {scope === "league" ? "Liga" : "Amistoso"}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <PersonalMatchCard match={selectedUpcoming} />
        </section>
      ) : null}

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="type-caption font-black uppercase tracking-[0.2em] text-neutral-400">
            Historial
          </p>
          {dashboard.items.length > 0 ? (
            <span className="type-caption font-bold text-neutral-400">Más recientes primero</span>
          ) : null}
        </div>

        {loading ? (
          <AppCard className="p-4">
            <p className="text-xs font-semibold text-neutral-500">Cargando los últimos 10 partidos...</p>
          </AppCard>
        ) : error && dashboard.items.length === 0 ? (
          <AppCard className="border-red-100 bg-red-50 p-3">
            <p className="text-xs font-bold text-red-700">{error}</p>
          </AppCard>
        ) : dashboard.items.length === 0 ? (
          <EmptyState
            title="Todavía no hay partidos en tu historial"
            description="Aquí aparecerán tus partidos terminados de liga y los amistosos que registres en Smash & Lob."
            action={{ label: "Registrar mi primer amistoso", href: "/personal-matches/new" }}
          />
        ) : (
          <div className="space-y-2">
            {dashboard.items.map((match) => (
              <PersonalMatchCard key={`${match.origin}-${match.id}`} match={match} />
            ))}
          </div>
        )}

        {dashboard.hasMore ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-black text-neutral-800 shadow-sm disabled:text-neutral-400"
          >
            {loadingMore ? "Cargando..." : "Cargar 10 más"}
          </button>
        ) : null}

        {error && dashboard.items.length > 0 ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>
        ) : null}
      </section>
    </div>
  )
}
