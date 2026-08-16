"use client"

import { useState } from "react"
import { showActionFeedback } from "@/lib/actionFeedback"
import {
  createRoundSummaryImage,
  downloadRoundSummaryImage,
  type RoundSummaryImageData,
} from "@/lib/roundSummaryImage"

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

export function RoundSummaryShareButton({ data }: { data: RoundSummaryImageData }) {
  const [busy, setBusy] = useState(false)

  async function shareSummary() {
    if (busy) return
    setBusy(true)

    try {
      const blob = await createRoundSummaryImage(data)
      const filename = `${sanitizeFilename(data.leagueName)}-${sanitizeFilename(data.seasonName)}-jornada-${data.round}.png`
      const file = new File([blob], filename, { type: "image/png" })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${data.leagueName} · Jornada ${data.round}`,
          text: `Resumen de Jornada ${data.round} de Smash & Lob`,
          files: [file],
        })
      } else {
        downloadRoundSummaryImage(blob, filename)
        showActionFeedback({
          tone: "info",
          message: "Tu dispositivo no permite compartir esta imagen; se ha descargado.",
        })
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        showActionFeedback({
          tone: "error",
          message: "No se ha podido generar o compartir el resumen de jornada.",
        })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void shareSummary()}
      className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? "Preparando imagen…" : "Compartir resumen de jornada"}
    </button>
  )
}
