"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  DEFAULT_AVATAR_RECIPE,
  cloneAvatarRecipe,
  normalizeAvatarRecipe,
  validateAvatarRecipe,
} from "../recipe"
import { randomizeAvatarRecipe } from "../randomize"
import {
  loadAvatarRecipe,
  loadAvatarWorldPreference,
  resetAvatarLabStorage,
  saveAvatarRecipe,
  saveAvatarWorldPreference,
} from "../storage"
import {
  AVATAR_LAB_VERSION,
  type AvatarCategory,
  type AvatarRecipe,
  type AvatarWorldPreference,
} from "../types"
import { AvatarCategorySelector } from "./AvatarCategorySelector"
import { AvatarEditor } from "./AvatarEditor"
import { AvatarPreview } from "./AvatarPreview"
import { AvatarWorldSelector } from "./AvatarWorldSelector"

export function AvatarLabClient() {
  const [recipe, setRecipe] = useState<AvatarRecipe>(() => cloneAvatarRecipe(DEFAULT_AVATAR_RECIPE))
  const [world, setWorld] = useState<AvatarWorldPreference>("pixel_chibi")
  const [category, setCategory] = useState<AvatarCategory>("identity")
  const [isHydrated, setIsHydrated] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRecipe(loadAvatarRecipe(window.localStorage))
      const storedWorld = loadAvatarWorldPreference(window.localStorage)
      setWorld(storedWorld === "chibi_illustrated" ? "pixel_chibi" : storedWorld)
      setIsHydrated(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const validationIssues = useMemo(() => validateAvatarRecipe(recipe), [recipe])

  function updateRecipe(nextRecipe: AvatarRecipe) {
    setRecipe(normalizeAvatarRecipe(nextRecipe))
    setSaveMessage(null)
  }

  function persistCurrent() {
    saveAvatarRecipe(window.localStorage, recipe)
    saveAvatarWorldPreference(window.localStorage, world)
    setSaveMessage("Receta y mundo guardados temporalmente en este dispositivo.")
  }

  function resetCurrent() {
    resetAvatarLabStorage(window.localStorage)
    setRecipe(cloneAvatarRecipe(DEFAULT_AVATAR_RECIPE))
    setWorld("pixel_chibi")
    setCategory("identity")
    setSaveMessage("Avatar restablecido a la referencia canónica.")
  }

  return (
    <main className="min-h-dvh bg-stone-100 px-3 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(14px,env(safe-area-inset-top))] text-neutral-950 sm:px-4">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                DEMO experimental
              </span>
              <span className="text-[11px] font-black text-neutral-500">{AVATAR_LAB_VERSION}</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Avatar Lab</h1>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
              Una receta neutral, varios mundos visuales. Nada de esta pantalla modifica tu perfil real.
            </p>
          </div>
          <Link
            href="/settings"
            aria-label="Cerrar Avatar Lab"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg font-black shadow-sm"
          >
            ×
          </Link>
        </header>

        <div className="space-y-4">
          <AvatarPreview recipe={recipe} world={world} />

          <section className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
            <AvatarWorldSelector value={world} onChange={setWorld} />
          </section>

          <section className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
            <AvatarCategorySelector value={category} onChange={setCategory} />
            <div className="mt-4">
              <AvatarEditor category={category} recipe={recipe} onChange={updateRecipe} />
            </div>
          </section>

          {validationIssues.length > 0 ? (
            <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-3 text-xs font-bold leading-5 text-amber-900">
              {validationIssues.map((issue) => issue.message).join(" ")}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setRecipe((current) => randomizeAvatarRecipe(current))
                setSaveMessage(null)
              }}
              className="rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm font-black text-neutral-800"
            >
              Aleatorizar
            </button>
            <button
              type="button"
              onClick={resetCurrent}
              className="rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm font-black text-neutral-800"
            >
              Restablecer
            </button>
          </div>

          <button
            type="button"
            disabled={!isHydrated || validationIssues.length > 0}
            onClick={persistCurrent}
            className="w-full rounded-2xl bg-neutral-950 px-4 py-3.5 text-sm font-black text-white disabled:bg-neutral-300"
          >
            Aplicar temporalmente
          </button>

          {saveMessage ? (
            <p role="status" className="rounded-2xl bg-emerald-50 px-3 py-3 text-center text-xs font-bold leading-5 text-emerald-800">
              {saveMessage}
            </p>
          ) : null}

          <details className="rounded-2xl border border-neutral-200 bg-white p-3">
            <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.12em] text-neutral-600">
              Depuración de receta
            </summary>
            <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-neutral-950 p-3 text-[10px] leading-4 text-neutral-100">
              {JSON.stringify({ world, recipe }, null, 2)}
            </pre>
          </details>

          <p className="px-2 text-center text-[11px] font-semibold leading-5 text-neutral-500">
            Persistencia local versionada. No se escribe en Supabase ni se utiliza en partidos, clasificaciones o exportaciones.
          </p>
        </div>
      </div>
    </main>
  )
}
