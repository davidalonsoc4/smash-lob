"use client"

import { useEffect } from "react"
import { useI18n } from "@/i18n/I18nProvider"

export type GeneratedImagePreviewModalBusyAction = "preview" | "download" | "share" | null

export function GeneratedImagePreviewModal({
  open,
  title,
  previewUrl,
  loading,
  error,
  busyAction,
  onClose,
  onDownload,
  onShare,
}: {
  open: boolean
  title: string
  previewUrl: string | null
  loading: boolean
  error: boolean
  busyAction: GeneratedImagePreviewModalBusyAction
  onClose: () => void
  onDownload: () => void | Promise<void>
  onShare: () => void | Promise<void>
}) {
  const { tx } = useI18n()

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [onClose, open])

  if (!open) return null

  const actionsDisabled = loading || error || !previewUrl || busyAction !== null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`${tx("Vista previa")} · ${title}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && busyAction === null) onClose()
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-neutral-950 shadow-[0_28px_90px_rgba(0,0,0,.5)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="type-caption font-black uppercase tracking-[.18em] text-neutral-400">
              {tx("Vista previa")}
            </p>
            <p className="mt-0.5 truncate text-sm font-black text-white">{title}</p>
          </div>
          <button
            type="button"
            aria-label={tx("Cerrar")}
            disabled={busyAction !== null}
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-xl font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_50%_20%,#292929,#050505_72%)] p-2 sm:p-3">
          <div className="relative flex min-h-[54vh] items-center justify-center" aria-busy={loading}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={`${tx("Vista previa")} · ${title}`}
                className="block h-auto max-h-[72vh] w-auto max-w-full object-contain"
              />
            ) : null}

            {loading ? (
              <div className="absolute inset-0 grid place-items-center px-6 text-center type-caption font-black uppercase tracking-[.18em] text-neutral-300">
                {tx("Preparando…")}
              </div>
            ) : null}

            {!loading && error ? (
              <div className="absolute inset-0 grid place-items-center px-8 text-center text-sm font-bold leading-6 text-red-200">
                {tx("No se ha podido construir la vista previa.")}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-white/10 bg-neutral-950 p-3">
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => void onDownload()}
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white px-3 py-2.5 text-center text-sm font-black text-neutral-950 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busyAction === "download" ? tx("Generando…") : tx("Descargar")}
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => void onShare()}
            className="inline-flex items-center justify-center rounded-xl bg-white/10 px-3 py-2.5 text-center text-sm font-black text-white ring-1 ring-inset ring-white/15 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busyAction === "share" ? tx("Compartiendo...") : tx("Compartir")}
          </button>
        </div>
      </div>
    </div>
  )
}
