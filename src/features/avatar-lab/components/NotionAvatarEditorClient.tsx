"use client"

import { useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import {
  DEFAULT_NOTION_AVATAR_RECIPE,
  NOTION_AVATAR_PART_ORDER,
  NOTION_AVATAR_PARTS,
  NOTION_AVATAR_PRESETS,
  normalizeNotionAvatarRecipe,
  notionPartValues,
  randomNotionAvatarRecipe,
  updateNotionAvatarPart,
  type NotionAvatarPart,
  type NotionAvatarRecipe,
  type NotionAvatarSavedState,
  type NotionAvatarShape,
} from "../notionAvatarModel"
import { NotionAvatarRenderer } from "./NotionAvatarRenderer"

const STORAGE_KEY = "smash-lob-avatar-lab-notion-v2"
const BACKGROUNDS = [
  "#f5f0e8",
  "#ffffff",
  "#dbeafe",
  "#dcfce7",
  "#ede9fe",
  "#fee2e2",
] as const
const SHAPES: readonly { id: NotionAvatarShape; label: string }[] = [
  { id: "circle", label: "Círculo" },
  { id: "rounded", label: "Redondeado" },
  { id: "square", label: "Cuadrado" },
]
const PAGE_SIZE = 18

function shapeClass(shape: NotionAvatarShape) {
  if (shape === "circle") return "rounded-full"
  if (shape === "rounded") return "rounded-[28px]"
  return "rounded-xl"
}

type PreviewResult = {
  key: string
  state: "ready" | "error"
}

export function NotionAvatarEditorClient() {
  const [recipe, setRecipe] = useState<NotionAvatarRecipe>(
    DEFAULT_NOTION_AVATAR_RECIPE,
  )
  const [selectedPart, setSelectedPart] =
    useState<NotionAvatarPart>("hair")
  const [backgroundColor, setBackgroundColor] = useState("#f5f0e8")
  const [shape, setShape] = useState<NotionAvatarShape>("rounded")
  const [page, setPage] = useState(0)
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
        if (typeof saved.backgroundColor === "string") {
          setBackgroundColor(saved.backgroundColor)
        }
        if (
          saved.shape === "circle" ||
          saved.shape === "rounded" ||
          saved.shape === "square"
        ) {
          setShape(saved.shape)
        }
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
  const pageCount = Math.ceil(values.length / PAGE_SIZE)
  const visibleValues = values.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  )
  const selectedValue = recipe[selectedPart]

  function selectPart(part: NotionAvatarPart) {
    setSelectedPart(part)
    setPage(0)
  }

  function updatePart(value: number) {
    setRecipe((current) =>
      updateNotionAvatarPart(current, selectedPart, value),
    )
  }

  function randomize() {
    setRecipe(randomNotionAvatarRecipe())
    setMessage("Avatar aleatorio generado")
  }

  function reset() {
    setRecipe(DEFAULT_NOTION_AVATAR_RECIPE)
    setBackgroundColor("#f5f0e8")
    setShape("rounded")
    setMessage("Valores restablecidos")
  }

  function save() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ recipe, backgroundColor, shape }),
      )
      setMessage("Guardado en este móvil")
    } catch {
      setMessage("No se pudo guardar")
    }
  }

  function applyPreset(index: number) {
    const preset = NOTION_AVATAR_PRESETS[index]
    setRecipe(preset.recipe)
    setBackgroundColor(preset.backgroundColor)
    setShape(preset.shape)
    setMessage(`Preset ${preset.label} aplicado`)
  }

  return (
    <div className="compact-page space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="pt-1">
        <BackButton fallbackHref="/experimental/avatar-lab" label="Volver" />
        <p className="mt-1 text-xs font-bold text-neutral-500">
          Laboratorio de avatares
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Notion Avatar
        </h1>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          Combina las piezas originales del estilo Notion. El resultado no se
          aplica todavía a tu perfil.
        </p>
      </header>

      <AppCard className="border-amber-200 bg-amber-50">
        <p className="text-xs font-black text-amber-950">Solo pruebas en PRE</p>
        <p className="mt-1 text-[11px] font-semibold leading-5 text-amber-800">
          La configuración se guarda únicamente en este navegador. No se envía
          a tu cuenta ni a ninguna liga.
        </p>
      </AppCard>

      <AppCard className="overflow-hidden !p-0">
        <div
          className={`relative mx-auto my-4 aspect-square w-[min(78vw,320px)] overflow-hidden border border-neutral-200 ${shapeClass(shape)}`}
          style={{ backgroundColor }}
        >
          <NotionAvatarRenderer
            recipe={recipe}
            revision={revision}
            onLoad={() => setPreviewResult({ key: previewKey, state: "ready" })}
            onError={() => setPreviewResult({ key: previewKey, state: "error" })}
          />
          {previewState === "loading" ? (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-neutral-600 shadow">
              Actualizando…
            </span>
          ) : null}
          {previewState === "error" ? (
            <button
              type="button"
              onClick={() => setRevision((current) => current + 1)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-red-50 px-3 py-1 text-[10px] font-black text-red-700 shadow"
            >
              Reintentar vista
            </button>
          ) : null}
        </div>

        <div className="border-t border-neutral-100 p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {NOTION_AVATAR_PRESETS.map((preset, index) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(index)}
                className="shrink-0 rounded-full bg-stone-100 px-3 py-2 text-[10px] font-black text-neutral-700"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-neutral-500">
            Forma
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SHAPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setShape(item.id)}
                className={`min-h-11 rounded-xl px-2 text-[10px] font-black ${
                  shape === item.id
                    ? "bg-neutral-950 text-white"
                    : "bg-stone-100 text-neutral-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-neutral-500">
            Fondo
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BACKGROUNDS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setBackgroundColor(color)}
                aria-label={`Fondo ${color}`}
                className={`h-10 w-10 rounded-full border-2 ${
                  backgroundColor === color
                    ? "border-neutral-950 ring-2 ring-neutral-300"
                    : "border-white"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <label className="flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-[10px] font-black text-neutral-600">
              Libre
              <input
                type="color"
                value={backgroundColor}
                onChange={(event) => setBackgroundColor(event.target.value)}
                className="h-7 w-7 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
          </div>
          {message ? (
            <p className="mt-3 text-center text-[11px] font-black text-neutral-700">
              {message}
            </p>
          ) : null}
        </div>
      </AppCard>

      <AppCard>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-500">
          Categoría
        </p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {NOTION_AVATAR_PART_ORDER.map((part) => (
            <button
              key={part}
              type="button"
              onClick={() => selectPart(part)}
              className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black ${
                selectedPart === part
                  ? "bg-neutral-950 text-white"
                  : "bg-stone-100 text-neutral-700"
              }`}
            >
              {NOTION_AVATAR_PARTS[part].label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black">
              {NOTION_AVATAR_PARTS[selectedPart].label}
            </h2>
            <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
              Opción {selectedValue + 1} de {values.length}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                updatePart((selectedValue - 1 + values.length) % values.length)
              }
              className="h-10 w-10 rounded-full border border-neutral-200 bg-white text-lg font-black"
              aria-label="Opción anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => updatePart((selectedValue + 1) % values.length)}
              className="h-10 w-10 rounded-full border border-neutral-200 bg-white text-lg font-black"
              aria-label="Opción siguiente"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-6 gap-2">
          {visibleValues.map((value) => (
            <button
              key={`${selectedPart}-${value}`}
              type="button"
              onClick={() => updatePart(value)}
              className={`aspect-square min-h-11 rounded-xl border text-[11px] font-black ${
                selectedValue === value
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700"
              }`}
            >
              {value + 1}
            </button>
          ))}
        </div>

        {pageCount > 1 ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-[10px] font-black disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-[10px] font-black text-neutral-500">
              {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount - 1}
              onClick={() =>
                setPage((current) => Math.min(pageCount - 1, current + 1))
              }
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-[10px] font-black disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        ) : null}
      </AppCard>

      <AppCard>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={randomize}
            className="h-11 rounded-xl border border-neutral-200 bg-white text-xs font-black"
          >
            Aleatorio
          </button>
          <button
            type="button"
            onClick={reset}
            className="h-11 rounded-xl border border-neutral-200 bg-white text-xs font-black"
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={save}
            className="h-11 rounded-xl bg-neutral-950 text-xs font-black text-white"
          >
            Guardar local
          </button>
        </div>
      </AppCard>

      <p className="px-1 text-center text-[10px] font-semibold leading-4 text-neutral-500">
        El editor compone los recursos abiertos del proyecto Notion Avatar. Esta
        pantalla es experimental y no modifica tu perfil.
      </p>
    </div>
  )
}
