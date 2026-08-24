"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GeneratedImagePreviewModal } from "@/components/images/GeneratedImagePreviewModal"
import { AppCard } from "@/components/ui/AppCard"
import { showActionFeedback } from "@/lib/actionFeedback"
import {
  createRoundSummaryImage,
  downloadRoundSummaryImage,
  type RoundSummaryImageData,
} from "@/lib/roundSummaryImage"
import { useI18n } from "@/i18n/I18nProvider"

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

export function RoundSummaryShareButton({ data }: { data: RoundSummaryImageData }) {
  const { tx } = useI18n()
  const [busy, setBusy] = useState<"preview" | "share" | "download" | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const previewUrlRef = useRef<string | null>(null)
  const filename = `${sanitizeFilename(data.leagueName)}-${sanitizeFilename(data.seasonName)}-jornada-${data.round}.png`
  const title = `${tx("Resumen de jornada")} · ${tx(`Jornada ${data.round}`)}`

  const createBlob = useCallback(() => createRoundSummaryImage(data), [data])

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    },
    [],
  )

  async function openPreview() {
    if (busy) return
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreviewUrl(null)
    setPreviewBlob(null)
    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewError(false)
    setBusy("preview")

    try {
      const blob = await createBlob()
      const objectUrl = URL.createObjectURL(blob)
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = objectUrl
      setPreviewBlob(blob)
      setPreviewUrl(objectUrl)
    } catch {
      setPreviewError(true)
      showActionFeedback({
        tone: "error",
        message: "No se ha podido generar o compartir el resumen de jornada.",
      })
    } finally {
      setPreviewLoading(false)
      setBusy(null)
    }
  }

  function closePreview() {
    if (busy) return
    setPreviewOpen(false)
  }

  async function shareSummary() {
    if (busy || !previewBlob) return
    setBusy("share")
    try {
      const file = new File([previewBlob], filename, { type: "image/png" })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: tx(`${data.leagueName} · Jornada ${data.round}`),
          text: tx(`Resumen de Jornada ${data.round} de Smash & Lob`),
          files: [file],
        })
      } else {
        downloadRoundSummaryImage(previewBlob, filename)
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
      setBusy(null)
    }
  }

  async function downloadSummary() {
    if (busy || !previewBlob) return
    setBusy("download")
    try {
      downloadRoundSummaryImage(previewBlob, filename)
      showActionFeedback({ tone: "success", message: "Resumen de jornada descargado." })
    } catch {
      showActionFeedback({
        tone: "error",
        message: "No se ha podido descargar el resumen de jornada.",
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <AppCard className="space-y-3 border-neutral-200 bg-white shadow-sm">
        <div>
          <p className="type-caption font-black uppercase tracking-[.18em] text-neutral-400">
            {tx("Resumen de jornada")}
          </p>
          <p className="mt-1 type-panel-title text-neutral-950">{tx(`Jornada ${data.round}`)}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            {tx("Abre la imagen completa para revisarla antes de compartirla o guardarla.")}
          </p>
        </div>

        <button
          type="button"
          data-round-summary-preview
          disabled={busy !== null}
          onClick={() => void openPreview()}
          className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "preview" ? tx("Preparando…") : tx("Ver imagen")}
        </button>
      </AppCard>

      <GeneratedImagePreviewModal
        open={previewOpen}
        title={title}
        previewUrl={previewUrl}
        loading={previewLoading}
        error={previewError}
        busyAction={busy}
        onClose={closePreview}
        onDownload={downloadSummary}
        onShare={shareSummary}
      />
    </>
  )
}
