"use client"

import { useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"

type SuggestionStatus = "new" | "reviewing" | "planned" | "declined" | "completed"
type SuggestionCategory = "improvement" | "feature" | "usability" | "other"

type SuggestionItem = {
  id: string
  submittedByEmail: string
  submittedByName: string | null
  category: SuggestionCategory
  title: string
  details: string
  appVersion: string
  sourcePath: string | null
  status: SuggestionStatus
  adminNote: string
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

const statusOptions: Array<{ value: SuggestionStatus; label: string }> = [
  { value: "new", label: "Nueva" },
  { value: "reviewing", label: "En revisión" },
  { value: "planned", label: "Planificada" },
  { value: "declined", label: "No prevista" },
  { value: "completed", label: "Completada" },
]

const categoryLabels: Record<SuggestionCategory, string> = {
  improvement: "Mejora",
  feature: "Nueva función",
  usability: "Diseño y uso",
  other: "Otra idea",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export default function ApplicationSuggestionsPage() {
  const { isSuperuser } = useLeagueAccess()
  const [items, setItems] = useState<SuggestionItem[]>([])
  const [filter, setFilter] = useState<"all" | SuggestionStatus>("all")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSuperuser) return

    let cancelled = false

    fetch("/api/application-admin/suggestions", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as {
          items?: SuggestionItem[]
          error?: string
        }
        if (!response.ok) throw new Error(payload.error ?? "lookup_failed")
        return payload.items ?? []
      })
      .then((nextItems) => {
        if (!cancelled) setItems(nextItems)
      })
      .catch(() => {
        if (!cancelled) setError("No se ha podido cargar el buzón de sugerencias.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isSuperuser])

  const visibleItems = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.status === filter)),
    [filter, items],
  )

  function updateLocalItem(id: string, patch: Partial<SuggestionItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  async function saveSuggestion(item: SuggestionItem) {
    if (busyId) return
    setBusyId(item.id)
    setError(null)
    try {
      const response = await fetch("/api/application-admin/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status: item.status,
          adminNote: item.adminNote,
        }),
      })
      const payload = (await response.json()) as {
        item?: SuggestionItem
        error?: string
      }
      if (!response.ok || !payload.item) {
        throw new Error(payload.error ?? "update_failed")
      }
      updateLocalItem(item.id, payload.item)
    } catch {
      setError("No se ha podido actualizar la sugerencia.")
    } finally {
      setBusyId(null)
    }
  }

  if (!isSuperuser) {
    return (
      <div className="compact-page space-y-3">
        <header className="pt-1">
          <BackButton fallbackHref="/application-admin" label="Volver" />
          <h1 className="mt-2 text-xl font-black">Acceso restringido</h1>
        </header>
        <AppCard>
          <p className="text-sm font-semibold text-neutral-600">
            Esta pantalla solo está disponible para superusuarios.
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/application-admin" label="Volver" />
        <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-red-600">
          Superusuario
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Sugerencias recibidas
        </h1>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Revisa las propuestas enviadas desde Ajustes y registra su estado interno.
        </p>
      </header>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1">
        {[{ value: "all" as const, label: "Todas" }, ...statusOptions].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-black transition ${
              filter === option.value
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <AppCard><p className="text-xs font-semibold text-neutral-500">Cargando...</p></AppCard>
      ) : visibleItems.length > 0 ? (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <AppCard key={item.id} className="p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-neutral-600">
                  {categoryLabels[item.category]}
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-neutral-500">
                  {item.appVersion}
                </span>
              </div>
              <p className="mt-2 text-sm font-black text-neutral-950">{item.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-xs font-semibold leading-5 text-neutral-600">
                {item.details}
              </p>
              <p className="mt-2 text-[10px] font-bold text-neutral-400">
                {item.submittedByName || item.submittedByEmail} · {formatDate(item.createdAt)}
                {item.sourcePath ? ` · ${item.sourcePath}` : ""}
              </p>

              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <select
                  value={item.status}
                  onChange={(event) =>
                    updateLocalItem(item.id, {
                      status: event.target.value as SuggestionStatus,
                    })
                  }
                  className="min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-black outline-none"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void saveSuggestion(item)}
                  disabled={Boolean(busyId)}
                  className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
                >
                  {busyId === item.id ? "Guardando..." : "Guardar"}
                </button>
              </div>

              <textarea
                value={item.adminNote}
                onChange={(event) =>
                  updateLocalItem(item.id, {
                    adminNote: event.target.value.slice(0, 1000),
                  })
                }
                rows={2}
                placeholder="Nota interna opcional"
                className="mt-2 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold leading-5 outline-none"
              />
            </AppCard>
          ))}
        </div>
      ) : (
        <AppCard>
          <p className="text-xs font-semibold text-neutral-500">
            No hay sugerencias en este estado.
          </p>
        </AppCard>
      )}
    </div>
  )
}
