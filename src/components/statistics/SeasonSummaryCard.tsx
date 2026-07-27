"use client"

import { useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { showActionFeedback } from "@/lib/actionFeedback"
import {
  createSeasonSummaryImage,
  downloadSeasonSummaryImage,
  type SeasonSummaryImageData,
} from "@/lib/seasonSummaryImage"

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
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
      return await createSeasonSummaryImage(data)
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
          message: "Tu dispositivo no permite compartir archivos desde aquí; se ha descargado la imagen.",
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
    <AppCard className="season-summary-card overflow-hidden p-0">
      <div className="season-summary-hero p-4 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/75">
          Resumen final
        </p>
        <p className="mt-1 text-lg font-black">{data.seasonName}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-white/70">
              {data.champion.includes(" / ") ? "Campeones" : "Campeón"}
            </p>
            <p className="mt-1 text-xl font-black">{data.champion}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-white/70">
              MVP
            </p>
            <p className="mt-1 text-base font-black">{data.mvp}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
            Podio final
          </p>
          <div className="mt-2 space-y-1.5">
            {data.podium.map((row) => (
              <div
                key={`${row.position}-${row.name}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2"
              >
                <p className="min-w-0 truncate text-sm font-black">
                  {row.position}º · {row.name}
                </p>
                <span className="shrink-0 text-xs font-black">{row.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
            Lo más destacado
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {data.highlights.map((highlight) => (
              <div key={highlight.label} className="rounded-xl bg-neutral-50 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                  {highlight.label}
                </p>
                <p className="mt-1 text-sm font-black leading-5">
                  {highlight.headline}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-neutral-500">
                  {highlight.detail}
                </p>
              </div>
            ))}
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
