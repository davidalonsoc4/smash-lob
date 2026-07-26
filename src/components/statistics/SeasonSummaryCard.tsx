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

export function SeasonSummaryCard({ data }: { data: SeasonSummaryImageData }) {
  const [busyAction, setBusyAction] = useState<"share" | "download" | null>(null)

  async function createImage() {
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
    setBusyAction("share")
    const blob = await createImage()
    if (!blob) {
      setBusyAction(null)
      return
    }

    const filename = `${sanitizeFilename(data.leagueName)}-${sanitizeFilename(data.seasonName)}.png`
    const file = new File([blob], filename, { type: "image/png" })

    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
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
              Campeón
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
            Podio
          </p>
          <div className="mt-2 space-y-1.5">
            {data.podium.map((row) => (
              <div
                key={row.position}
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

        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["Mejor racha", data.bestStreak],
            ["Mejor pareja", data.bestPair],
            ["Más igualado", data.closestMatch],
            ["Mayor victoria", data.biggestWin],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-neutral-50 p-2.5">
              <p className="font-black uppercase tracking-wide text-neutral-400">{label}</p>
              <p className="mt-1 font-bold leading-5">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={busyAction !== null}
            className="rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:opacity-60"
          >
            {busyAction === "share" ? "Preparando…" : "Compartir"}
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={busyAction !== null}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black disabled:opacity-60"
          >
            {busyAction === "download" ? "Generando…" : "Guardar imagen"}
          </button>
        </div>
      </div>
    </AppCard>
  )
}
