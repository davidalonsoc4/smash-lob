"use client"

import { useEffect, useState, type ReactNode } from "react"
import { MediaKitSectionNav } from "@/components/media-kit/MediaKitSectionNav"
import { MediaKitSettingsProvider, useMediaKitSettings } from "@/context/MediaKitSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { extractLogoAccentPalette } from "@/lib/logoAccentPalette"
import { MEDIA_KIT_ACCENT_OPTIONS, normalizeMediaKitAccentColor } from "@/lib/mediaKitTheme"

function SharedAccentControls() {
  const { tx } = useI18n()
  const { activeLeague } = useCurrentLeagueData()
  const { accentColor, setAccentColor } = useMediaKitSettings()
  const [showCustom, setShowCustom] = useState(false)
  const [customDraft, setCustomDraft] = useState(accentColor)
  const [logoAccentResult, setLogoAccentResult] = useState<{ source: string; colors: string[]; failed: boolean } | null>(null)
  const logoUrl = activeLeague.logoUrl
  const logoColors = logoAccentResult && logoAccentResult.source === logoUrl ? logoAccentResult.colors : []
  const logoStatus = !logoUrl
    ? "idle"
    : logoAccentResult?.source !== logoUrl
      ? "loading"
      : logoAccentResult.failed || logoColors.length === 0
        ? "error"
        : "ready"

  useEffect(() => {
    let active = true
    if (!logoUrl) return () => { active = false }

    void extractLogoAccentPalette(logoUrl)
      .then((colors) => {
        if (!active) return
        setLogoAccentResult({ source: logoUrl, colors, failed: false })
      })
      .catch(() => {
        if (!active) return
        setLogoAccentResult({ source: logoUrl, colors: [], failed: true })
      })

    return () => { active = false }
  }, [logoUrl])

  function selectColor(color: string) {
    const normalized = normalizeMediaKitAccentColor(color)
    setAccentColor(normalized)
    setCustomDraft(normalized)
    setShowCustom(false)
  }

  function updateCustom(value: string) {
    setCustomDraft(value)
    if (/^#[0-9a-f]{6}$/i.test(value)) setAccentColor(value)
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">{tx("Identidad visual")}</p>
          <p className="mt-0.5 text-xs font-bold text-neutral-800">{tx("Color común para Media Kit y Welcome Pack")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {MEDIA_KIT_ACCENT_OPTIONS.map((color) => (
            <button key={color} type="button" aria-label={tx(`Usar color ${color}`)} onClick={() => selectColor(color)}
              className={`h-8 w-8 rounded-full border-2 ${accentColor.toUpperCase() === color.toUpperCase() && !showCustom ? "border-neutral-950 ring-2 ring-neutral-200" : "border-white shadow-sm"}`}
              style={{ backgroundColor: color }} />
          ))}
          <button type="button" onClick={() => { setShowCustom((current) => !current); setCustomDraft(accentColor) }}
            className={`min-h-8 rounded-full border px-3 type-caption font-black ${showCustom ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700"}`}>
            {tx("+ Propio")}
          </button>
        </div>
      </div>

      {logoStatus !== "idle" ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2">
          <span className="type-caption font-black text-neutral-500">{tx("Sugeridos por el logo")}</span>
          {logoStatus === "loading" ? <span className="type-caption font-bold text-neutral-400">{tx("Analizando…")}</span> : null}
          {logoStatus === "ready" ? logoColors.map((color) => (
            <button key={color} type="button" onClick={() => selectColor(color)} aria-label={tx(`Usar color del logo ${color}`)} title={color}
              className={`h-8 w-8 rounded-full border-2 ${accentColor.toUpperCase() === color.toUpperCase() && !showCustom ? "border-neutral-950 ring-2 ring-neutral-200" : "border-white shadow-sm"}`}
              style={{ backgroundColor: color }} />
          )) : null}
          {logoStatus === "error" ? <span className="type-caption font-semibold text-neutral-400">{tx("No se han podido extraer colores útiles de este logo.")}</span> : null}
        </div>
      ) : null}

      {showCustom ? (
        <div className="mt-2 grid grid-cols-[48px_1fr] gap-2 border-t border-neutral-100 pt-2">
          <input aria-label={tx("Selector de color personalizado")} type="color" value={accentColor}
            onChange={(event) => { setAccentColor(event.target.value); setCustomDraft(event.target.value) }}
            className="h-10 w-12 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1" />
          <input aria-label={tx("Código hexadecimal personalizado")} value={customDraft} onChange={(event) => updateCustom(event.target.value)} maxLength={7}
            placeholder="#D7A544" className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-black uppercase text-neutral-900 outline-none focus:border-neutral-950" />
        </div>
      ) : null}
    </div>
  )
}

function MediaKitWorkspaceContent({ children }: { children: ReactNode }) {
  return <div className="space-y-3"><SharedAccentControls /><MediaKitSectionNav />{children}</div>
}

export function MediaKitWorkspaceShell({ children }: { children: ReactNode }) {
  const { activeLeague } = useCurrentLeagueData()
  return <MediaKitSettingsProvider key={activeLeague.id} initialAccentColor={activeLeague.accentColor}><MediaKitWorkspaceContent>{children}</MediaKitWorkspaceContent></MediaKitSettingsProvider>
}
