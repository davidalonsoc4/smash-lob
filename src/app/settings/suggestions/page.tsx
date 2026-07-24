"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"

type SuggestionCategory = "improvement" | "feature" | "usability" | "other"
type SuggestionStatus = "new" | "reviewing" | "planned" | "declined" | "completed"

type SuggestionItem = {
  id: string
  category: SuggestionCategory
  title: string
  details: string
  status: SuggestionStatus
  createdAt: string
}

const categoryOptions: Array<{
  value: SuggestionCategory
  label: string
  description: string
}> = [
  {
    value: "improvement",
    label: "Mejora",
    description: "Afinar o simplificar una función que ya existe.",
  },
  {
    value: "feature",
    label: "Nueva función",
    description: "Proponer algo que todavía no permite la aplicación.",
  },
  {
    value: "usability",
    label: "Diseño y uso",
    description: "Hacer una pantalla más clara, rápida o cómoda.",
  },
  {
    value: "other",
    label: "Otra idea",
    description: "Cualquier propuesta que no encaje en las anteriores.",
  },
]

const statusCopy: Record<SuggestionStatus, { label: string; className: string }> = {
  new: { label: "Recibida", className: "bg-neutral-100 text-neutral-600" },
  reviewing: { label: "En revisión", className: "bg-blue-100 text-blue-700" },
  planned: { label: "Planificada", className: "bg-violet-100 text-violet-700" },
  declined: { label: "No prevista", className: "bg-amber-100 text-amber-800" },
  completed: { label: "Completada", className: "bg-emerald-100 text-emerald-700" },
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function getSubmitError(error: string | undefined) {
  if (error === "suggestion_rate_limited") {
    return "Espera unos segundos antes de enviar otra sugerencia."
  }
  if (error === "suggestion_title_too_short") {
    return "Resume la propuesta con un título un poco más descriptivo."
  }
  if (error === "suggestion_details_too_short") {
    return "Añade algo más de detalle para poder entender la propuesta."
  }
  return "No se ha podido enviar la sugerencia. Inténtalo de nuevo."
}

export default function SuggestionsPage() {
  const [category, setCategory] = useState<SuggestionCategory>("improvement")
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [items, setItems] = useState<SuggestionItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(
    () => title.trim().length >= 5 && details.trim().length >= 10 && !submitting,
    [details, submitting, title],
  )

  const loadItems = useCallback(async () => {
    setLoadingItems(true)
    try {
      const response = await fetch("/api/suggestions", { cache: "no-store" })
      const payload = (await response.json()) as { items?: SuggestionItem[] }
      if (response.ok) setItems(payload.items ?? [])
    } finally {
      setLoadingItems(false)
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  async function submitSuggestion() {
    if (!canSubmit) return

    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          details,
          sourcePath: window.location.pathname,
        }),
      })
      const payload = (await response.json()) as {
        item?: SuggestionItem
        error?: string
      }

      if (!response.ok || !payload.item) {
        throw new Error(payload.error ?? "suggestion_create_failed")
      }

      setItems((current) => [payload.item!, ...current].slice(0, 10))
      setTitle("")
      setDetails("")
      setCategory("improvement")
      setMessage("Sugerencia enviada. Gracias por ayudar a mejorar Smash & Lob.")
    } catch (caughtError) {
      setError(getSubmitError(caughtError instanceof Error ? caughtError.message : undefined))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label="Volver" />
        <p className="text-sm font-medium text-neutral-500">Smash & Lob</p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Buzón de sugerencias
        </h1>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Propón mejoras para la aplicación. Las ideas se revisan de forma privada y no se publican junto a tu cuenta.
        </p>
      </header>

      <AppCard className="p-3">
        <p className="text-sm font-black text-neutral-950">Tipo de propuesta</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {categoryOptions.map((option) => {
            const selected = category === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                className={`rounded-xl border px-3 py-2 text-left transition ${
                  selected
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-950"
                }`}
              >
                <span className="block text-xs font-black">{option.label}</span>
                <span
                  className={`mt-0.5 block text-[10px] font-semibold leading-4 ${
                    selected ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-black text-neutral-800">Título</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 120))}
            placeholder="Ejemplo: Filtrar el ranking por temporada"
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-neutral-400"
          />
          <span className="mt-1 block text-right text-[10px] font-bold text-neutral-400">
            {title.length}/120
          </span>
        </label>

        <label className="mt-2 block">
          <span className="text-xs font-black text-neutral-800">Explícala brevemente</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value.slice(0, 2000))}
            rows={5}
            placeholder="Qué cambiarías, dónde lo usarías y qué problema solucionaría."
            className="mt-1 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold leading-5 outline-none focus:border-neutral-400"
          />
          <span className="mt-1 block text-right text-[10px] font-bold text-neutral-400">
            {details.length}/2000
          </span>
        </label>

        <button
          type="button"
          onClick={() => void submitSuggestion()}
          disabled={!canSubmit}
          className="mt-2 w-full rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {submitting ? "Enviando..." : "Enviar sugerencia"}
        </button>

        {message ? (
          <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-700">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700">
            {error}
          </p>
        ) : null}
      </AppCard>

      <section className="space-y-2">
        <div className="px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            Tus últimas sugerencias
          </p>
        </div>

        {loadingItems ? (
          <AppCard className="p-3">
            <p className="text-xs font-semibold text-neutral-500">Cargando...</p>
          </AppCard>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => {
              const status = statusCopy[item.status] ?? statusCopy.new
              return (
                <AppCard key={item.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-neutral-950">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-neutral-500">
                        {item.details}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                    {formatDate(item.createdAt)}
                  </p>
                </AppCard>
              )
            })}
          </div>
        ) : (
          <AppCard className="p-3">
            <p className="text-xs font-semibold leading-5 text-neutral-500">
              Todavía no has enviado ninguna sugerencia.
            </p>
          </AppCard>
        )}
      </section>
    </div>
  )
}
