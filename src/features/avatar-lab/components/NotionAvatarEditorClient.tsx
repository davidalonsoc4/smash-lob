"use client"

import { useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import {
  DEFAULT_NOTION_AVATAR_RECIPE,
  NOTION_AVATAR_PART_ORDER,
  NOTION_AVATAR_PARTS,
  normalizeNotionAvatarRecipe,
  notionPartValues,
  randomNotionAvatarRecipe,
  updateNotionAvatarPart,
  type NotionAvatarPart,
  type NotionAvatarRecipe,
  type NotionAvatarSavedState,
} from "../notionAvatarModel"
import { NotionAvatarRenderer } from "./NotionAvatarRenderer"

const STORAGE_KEY = "smash-lob-avatar-lab-notion-v2"

type PreviewResult = {
  key: string
  state: "ready" | "error"
}

function wrapIndex(current: number, delta: number, length: number) {
  return (current + delta + length) % length
}

export function NotionAvatarEditorClient() {
  const [recipe, setRecipe] = useState<NotionAvatarRecipe>(
    DEFAULT_NOTION_AVATAR_RECIPE,
  )
  const [selectedPart, setSelectedPart] =
    useState<NotionAvatarPart>("hair")
  const [message, setMessage] = useState("")
  const [revision, setRevision] = useState(0)
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const saved = JSON.parse(raw) as Partial<NotionAvatarSavedState>
        setRecipe(normalizeNotionAvatarRecipe(saved.recipe))
      } catch {
        // Ignore invalid local experimental data.
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(""), 2200)
    return () => window.clearTimeout(timer)
  }, [message])

  const values = useMemo(
    () => notionPartValues(selectedPart),
    [selectedPart],
  )
  const previewKey = useMemo(
    () => `${revision}:${JSON.stringify(recipe)}`,
    [recipe, revision],
  )
  const previewState =
    previewResult?.key === previewKey ? previewResult.state : "loading"
  const selectedPartIndex = NOTION_AVATAR_PART_ORDER.indexOf(selectedPart)
  const selectedValue = recipe[selectedPart]

  function selectPart(part: NotionAvatarPart) {
    setSelectedPart(part)
  }

  function movePart(delta: -1 | 1) {
    const nextIndex = wrapIndex(
      selectedPartIndex,
      delta,
      NOTION_AVATAR_PART_ORDER.length,
    )
    setSelectedPart(NOTION_AVATAR_PART_ORDER[nextIndex])
  }

  function updatePart(value: number) {
    setRecipe((current) =>
      updateNotionAvatarPart(current, selectedPart, value),
    )
  }

  function moveStyle(delta: -1 | 1) {
    updatePart(wrapIndex(selectedValue, delta, values.length))
  }

  function randomize() {
    setRecipe(randomNotionAvatarRecipe())
    setMessage("Avatar aleatorio generado")
  }

  function reset() {
    setRecipe(DEFAULT_NOTION_AVATAR_RECIPE)
    setMessage("Valores restablecidos")
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ recipe }))
      setMessage("Guardado en este móvil")
    } catch {
      setMessage("No se pudo guardar")
    }
  }

  return (
    <div className="compact-page grid h-[calc(100dvh-8rem)] min-h-[510px] max-h-[760px] grid-rows-[auto_minmax(0,1fr)] gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-2 pt-0">
        <BackButton fallbackHref="/experimental/avatar-lab" label="Volver" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-black tracking-tight">
              Notion Avatar
            </h1>
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-amber-800">
              Solo PRE
            </span>
          </div>
          <p className="truncate text-[10px] font-semibold text-neutral-500">
            Prueba estilos sin modificar tu perfil
          </p>
        </div>
      </header>

      <AppCard className="grid min-h-0 grid-rows-[minmax(180px,1fr)_auto] overflow-hidden !p-2">
        <section className="relative flex min-h-0 items-center justify-center overflow-hidden border border-neutral-200 bg-white">
          <div className="relative aspect-square h-full max-h-[290px] max-w-full bg-white">
            <NotionAvatarRenderer
              recipe={recipe}
              revision={revision}
              onLoad={() =>
                setPreviewResult({ key: previewKey, state: "ready" })
              }
              onError={() =>
                setPreviewResult({ key: previewKey, state: "error" })
              }
            />
            {previewState === "loading" ? (
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-neutral-200 bg-white/95 px-2.5 py-1 text-[9px] font-black text-neutral-600 shadow-sm">
                Actualizando…
              </span>
            ) : null}
            {previewState === "error" ? (
              <button
                type="button"
                onClick={() => setRevision((current) => current + 1)}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[9px] font-black text-red-700 shadow-sm"
              >
                Reintentar vista
              </button>
            ) : null}
          </div>
          {message ? (
            <p className="absolute left-2 top-2 rounded-full bg-neutral-950 px-2.5 py-1 text-[9px] font-black text-white shadow-sm">
              {message}
            </p>
          ) : null}
        </section>

        <div className="grid shrink-0 gap-2 pt-2">
          <section className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 rounded-xl bg-stone-100 p-1.5">
            <button
              type="button"
              onClick={() => movePart(-1)}
              aria-label="Categoría anterior"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-xl font-black text-neutral-800 active:scale-[0.97]"
            >
              ‹
            </button>

            <label className="relative min-w-0 cursor-pointer rounded-xl px-2 py-1 text-center active:bg-white/70">
              <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-neutral-500">
                Categoría {selectedPartIndex + 1} de {NOTION_AVATAR_PART_ORDER.length}
              </span>
              <span className="mt-0.5 block truncate text-sm font-black text-neutral-950">
                {NOTION_AVATAR_PARTS[selectedPart].label}
                <span aria-hidden="true" className="ml-1 text-neutral-400">
                  ▾
                </span>
              </span>
              <select
                value={selectedPart}
                onChange={(event) =>
                  selectPart(event.target.value as NotionAvatarPart)
                }
                aria-label="Seleccionar categoría"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              >
                {NOTION_AVATAR_PART_ORDER.map((part) => (
                  <option key={part} value={part}>
                    {NOTION_AVATAR_PARTS[part].label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => movePart(1)}
              aria-label="Categoría siguiente"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-xl font-black text-neutral-800 active:scale-[0.97]"
            >
              ›
            </button>
          </section>

          <section className="grid grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] items-center gap-2 rounded-xl border border-neutral-200 bg-white p-1.5">
            <button
              type="button"
              onClick={() => moveStyle(-1)}
              aria-label="Estilo anterior"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-950 text-2xl font-black text-white active:scale-[0.97]"
            >
              ‹
            </button>

            <div className="min-w-0 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-neutral-500">
                Estilo
              </p>
              <p className="mt-0.5 text-base font-black text-neutral-950">
                {selectedValue + 1}
                <span className="ml-1 text-xs text-neutral-400">
                  de {values.length}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => moveStyle(1)}
              aria-label="Estilo siguiente"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-950 text-2xl font-black text-white active:scale-[0.97]"
            >
              ›
            </button>
          </section>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={randomize}
              className="h-10 rounded-xl border border-neutral-200 bg-white text-[10px] font-black text-neutral-700 active:scale-[0.98]"
            >
              Aleatorio
            </button>
            <button
              type="button"
              onClick={reset}
              className="h-10 rounded-xl border border-neutral-200 bg-white text-[10px] font-black text-neutral-700 active:scale-[0.98]"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={save}
              className="h-10 rounded-xl bg-neutral-950 text-[10px] font-black text-white active:scale-[0.98]"
            >
              Guardar local
            </button>
          </div>
        </div>
      </AppCard>
    </div>
  )
}
