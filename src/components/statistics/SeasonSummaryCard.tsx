"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { showActionFeedback } from "@/lib/actionFeedback"
import {
  createSeasonSummaryImage,
  downloadSeasonSummaryImage,
  type SeasonSummaryImageData,
  type SeasonSummaryImageOptions,
} from "@/lib/seasonSummaryImage"

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

function formatGamesDiff(value: number) {
  if (value > 0) return `+${value}`
  return `${value}`
}

export function SeasonSummaryCard({
  data,
  canExport,
  exportBlockedReason,
}: {
  data: SeasonSummaryImageData
  canExport: boolean
  exportBlockedReason?: string
}) {
  const [busyAction, setBusyAction] = useState<"share" | "download" | null>(null)
  const [includeLeagueLogo, setIncludeLeagueLogo] = useState(true)
  const [includeHeroImages, setIncludeHeroImages] = useState(true)

  const hasLeagueLogo = Boolean(data.leagueLogoUrl)
  const hasHeroImages = useMemo(
    () => data.heroes.some((hero) => Boolean(hero.imageUrl)),
    [data.heroes],
  )

  const imageOptions: SeasonSummaryImageOptions = {
    includeLeagueLogo: hasLeagueLogo && includeLeagueLogo,
    includeHeroImages: hasHeroImages && includeHeroImages,
  }

  function reportBlockedExport() {
    showActionFeedback({
      tone: "info",
      message:
        exportBlockedReason ??
        "Revisa los datos pendientes antes de guardar el resumen.",
    })
  }

  async function createImage() {
    if (!canExport) {
      reportBlockedExport()
      return null
    }

    try {
      return await createSeasonSummaryImage(data, imageOptions)
    } catch {
      showActionFeedback({
        tone: "error",
        message: "No se pudo generar el resumen de temporada.",
      })
      return null
    }
  }

  async function handleDownload() {
    if (!canExport) {
      reportBlockedExport()
      return
    }

    setBusyAction("download")
    const blob = await createImage()
    if (blob) {
      downloadSeasonSummaryImage(
        blob,
        `${sanitizeFilename(data.leagueName)}-${sanitizeFilename(data.seasonName)}.png`,
      )
      showActionFeedback({ tone: "success", message: "Resumen guardado como imagen." })
    }
    setBusyAction(null)
  }

  async function handleShare() {
    if (!canExport) {
      reportBlockedExport()
      return
    }

    setBusyAction("share")
    const blob = await createImage()
    if (!blob) {
      setBusyAction(null)
      return
    }

    const filename = `${sanitizeFilename(data.leagueName)}-${sanitizeFilename(data.seasonName)}.png`
    const file = new File([blob], filename, { type: "image/png" })

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${data.leagueName} · ${data.seasonName}`,
          text: "Resumen final de temporada de Smash & Lob",
          files: [file],
        })
      } else {
        downloadSeasonSummaryImage(blob, filename)
        showActionFeedback({
          tone: "info",
          message:
            "Tu dispositivo no permite compartir archivos desde aquí; se ha descargado la imagen.",
        })
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setBusyAction(null)
        return
      }
      showActionFeedback({ tone: "error", message: "No se pudo compartir el resumen." })
    }
    setBusyAction(null)
  }

  return (
    <AppCard className="overflow-hidden p-0">
      <div className="space-y-3 bg-neutral-50 p-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            Resumen final
          </p>
          <p className="mt-1 text-lg font-black text-neutral-950">{data.seasonName}</p>
        </div>

        <div className="grid gap-3">
          {data.heroes.map((hero) => (
            <div
              key={`${hero.label}-${hero.value}`}
              className="rounded-2xl border border-neutral-200 bg-white p-3.5"
            >
              <div className="flex items-start gap-3">
                {hero.imageUrl ? (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={hero.imageUrl}
                      alt={hero.value}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
                    {hero.label}
                  </p>
                  <p className="mt-1.5 text-xl font-black leading-6 text-neutral-950">{hero.value}</p>
                </div>
              </div>
              {hero.stats.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3">
                  {hero.stats.slice(0, 3).map((stat) => (
                    <div key={stat.label} className="min-w-0 text-center">
                      <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                        {stat.label}
                      </p>
                      <p className="mt-0.5 text-sm font-black text-neutral-950">{stat.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
            Podio final
          </p>
          <div className="mt-2 space-y-1.5">
            {data.podium.map((row) => (
              <div
                key={`${row.position}-${row.name}`}
                className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-xs font-black text-white">
                  {row.position}º
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-neutral-950">{row.name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-black text-neutral-950">{row.points} pts</p>
                  <p className="text-[11px] font-semibold text-neutral-500">
                    DG {formatGamesDiff(row.gamesDiff)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
            Lo más destacado
          </p>
          <div className="mt-2 grid gap-2">
            {data.highlights.map((highlight) => (
              <div key={highlight.label} className="rounded-xl bg-neutral-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                  {highlight.label}
                </p>
                <p className="mt-1 text-sm font-black leading-5 text-neutral-950">
                  {highlight.headline}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-neutral-500">
                  {highlight.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3">
          <p className="text-xs font-black text-neutral-900">Opciones de la imagen</p>
          <div className="mt-3 space-y-2">
            <label className="flex items-start gap-2 text-sm font-semibold text-neutral-700">
              <input
                type="checkbox"
                checked={hasLeagueLogo && includeLeagueLogo}
                disabled={!hasLeagueLogo || busyAction !== null}
                onChange={(event) => setIncludeLeagueLogo(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300"
              />
              <span>
                Incluir logo de la liga
                {!hasLeagueLogo ? (
                  <span className="block text-xs font-medium text-neutral-500">
                    Esta liga no tiene logo guardado.
                  </span>
                ) : null}
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm font-semibold text-neutral-700">
              <input
                type="checkbox"
                checked={hasHeroImages && includeHeroImages}
                disabled={!hasHeroImages || busyAction !== null}
                onChange={(event) => setIncludeHeroImages(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300"
              />
              <span>
                Incluir fotos de campeón / MVP
                {!hasHeroImages ? (
                  <span className="block text-xs font-medium text-neutral-500">
                    No hay imágenes de perfil disponibles para mostrar.
                  </span>
                ) : null}
              </span>
            </label>
          </div>
        </div>

        {!canExport ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-black text-amber-900">
              Imagen bloqueada hasta completar los datos
            </p>
            <p className="mt-0.5 text-[11px] font-semibold leading-4 text-amber-800">
              {exportBlockedReason ?? "Revisa los partidos pendientes o no válidos de la temporada."}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={busyAction !== null || !canExport}
            className="rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busyAction === "share" ? "Preparando…" : "Compartir"}
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={busyAction !== null || !canExport}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busyAction === "download" ? "Generando…" : "Guardar imagen"}
          </button>
        </div>
      </div>
    </AppCard>
  )
}
