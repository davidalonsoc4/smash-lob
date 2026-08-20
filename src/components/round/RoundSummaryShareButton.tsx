"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GeneratedImagePreview } from "@/components/images/GeneratedImagePreview"
import { AppCard } from "@/components/ui/AppCard"
import { showActionFeedback } from "@/lib/actionFeedback"
import { createRoundSummaryImage, downloadRoundSummaryImage, type RoundSummaryImageData } from "@/lib/roundSummaryImage"
import { useI18n } from "@/i18n/I18nProvider"

function sanitizeFilename(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase()
}

export function RoundSummaryShareButton({ data }: { data: RoundSummaryImageData }) {
  const { tx } = useI18n()
  const [busy, setBusy] = useState<"share" | "download" | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [previewError, setPreviewError] = useState(false)
  const previewUrlRef = useRef<string | null>(null)
  const filename = `${sanitizeFilename(data.leagueName)}-${sanitizeFilename(data.seasonName)}-jornada-${data.round}.png`

  const createBlob = useCallback(() => createRoundSummaryImage(data), [data])

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null

    const timeout = window.setTimeout(() => {
      void createBlob()
        .then((blob) => {
          if (!active) return
          objectUrl = URL.createObjectURL(blob)
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
          previewUrlRef.current = objectUrl
          setPreviewUrl(objectUrl)
          setPreviewError(false)
        })
        .catch(() => {
          if (active) setPreviewError(true)
        })
        .finally(() => {
          if (active) setPreviewLoading(false)
        })
    }, 120)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [createBlob])

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  async function shareSummary() {
    if (busy) return
    setBusy("share")
    try {
      const blob = await createBlob()
      const file = new File([blob], filename, { type: "image/png" })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: tx(`${data.leagueName} · Jornada ${data.round}`), text: tx(`Resumen de Jornada ${data.round} de Smash & Lob`), files: [file] })
      } else {
        downloadRoundSummaryImage(blob, filename)
        showActionFeedback({ tone: "info", message: "Tu dispositivo no permite compartir esta imagen; se ha descargado." })
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) showActionFeedback({ tone: "error", message: "No se ha podido generar o compartir el resumen de jornada." })
    } finally {
      setBusy(null)
    }
  }

  async function downloadSummary() {
    if (busy) return
    setBusy("download")
    try {
      downloadRoundSummaryImage(await createBlob(), filename)
      showActionFeedback({ tone: "success", message: "Resumen de jornada descargado." })
    } catch {
      showActionFeedback({ tone: "error", message: "No se ha podido descargar el resumen de jornada." })
    } finally {
      setBusy(null)
    }
  }

  const disabled = busy !== null || previewError
  return (
    <AppCard className="space-y-3 border-neutral-200 bg-white shadow-sm">
      <div>
        <p className="type-caption font-black uppercase tracking-[.18em] text-neutral-400">{tx("Resumen de jornada")}</p>
        <p className="mt-1 type-panel-title text-neutral-950">{tx(`Jornada ${data.round}`)}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {tx("Previsualiza la imagen completa antes de compartirla o guardarla.")}
        </p>
      </div>

      <GeneratedImagePreview
        previewUrl={previewUrl}
        loading={previewLoading}
        error={previewError}
        title={`${tx("Resumen de jornada")} · ${tx(`Jornada ${data.round}`)}`}
      />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={disabled} onClick={() => void shareSummary()} className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
          {busy === "share" ? tx("Preparando…") : tx("Compartir resumen")}
        </button>
        <button type="button" disabled={disabled} onClick={() => void downloadSummary()} className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-center text-xs font-black text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60">
          {busy === "download" ? tx("Generando…") : tx("Descargar resumen")}
        </button>
      </div>
    </AppCard>
  )
}
