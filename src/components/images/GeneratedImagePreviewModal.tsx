"use client"

import { createPortal } from "react-dom"
import { useEffect } from "react"
import { useI18n } from "@/i18n/I18nProvider"

export type GeneratedImagePreviewModalBusyAction = "preview" | "download" | "share" | null

function QrMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 14h3v3h-3zM19 14h2M19 18v3M14 20h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function DownloadMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 18v3h16v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShareMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="m8.7 10.7 6.6-4m-6.6 6.6 6.6 4" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export function GeneratedImagePreviewModal({
  open,
  title,
  previewUrl,
  loading,
  error,
  errorMessage,
  description,
  statusMessage,
  previewAlt,
  variant = "default",
  portalToBody = false,
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
  errorMessage?: string
  description?: string
  statusMessage?: string | null
  previewAlt?: string
  variant?: "default" | "spectator-qr"
  portalToBody?: boolean
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
  const isSpectatorQr = variant === "spectator-qr"

  const modal = (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center p-3 backdrop-blur-md sm:p-5 ${isSpectatorQr ? "bg-black/45" : "bg-black/45 backdrop-blur-sm"}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${tx(isSpectatorQr ? "Invitación para espectadores" : "Vista previa")} · ${title}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && busyAction === null) onClose()
      }}
    >
      <div className={`flex max-h-[92dvh] w-full flex-col overflow-hidden ${isSpectatorQr ? "app-shell-frame max-w-lg rounded-[2rem] border border-neutral-200 bg-stone-50 text-neutral-950 shadow-[0_28px_90px_rgba(0,0,0,.3)]" : "max-w-3xl rounded-[1.75rem] border border-white/10 bg-neutral-950 shadow-[0_28px_90px_rgba(0,0,0,.58)]"}`}>
        <div className={`flex shrink-0 items-start justify-between gap-3 ${isSpectatorQr ? "border-b border-neutral-200 px-5 py-4 sm:px-6 sm:py-5" : "border-b border-white/10 px-4 py-3"}`}>
          <div className="min-w-0">
            {isSpectatorQr ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-700">
                    <QrMark />
                  </span>
                  <p className="type-caption font-black uppercase tracking-[.2em] text-neutral-600">
                    {tx("Invitación de espectadores")}
                  </p>
                </div>
                <p className="mt-3 truncate text-lg font-black tracking-tight text-neutral-950 sm:text-xl">{title}</p>
                {description ? <p className="mt-1 max-w-[38ch] text-xs font-medium leading-5 text-neutral-600">{description}</p> : null}
              </>
            ) : (
              <>
                <p className="type-caption font-black uppercase tracking-[.18em] text-neutral-400">
                  {tx("Vista previa")}
                </p>
                <p className="mt-0.5 truncate text-sm font-black text-white">{title}</p>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label={tx("Cerrar")}
            disabled={busyAction !== null}
            onClick={onClose}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${isSpectatorQr ? "border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}`}
          >
            ×
          </button>
        </div>

        <div className={`min-h-0 flex-1 overflow-auto ${isSpectatorQr ? "bg-stone-50 px-4 py-5 sm:px-6 sm:py-6" : "bg-[radial-gradient(circle_at_50%_20%,#292929,#050505_72%)] p-2 sm:p-3"}`}>
          <div className={`relative flex items-center justify-center ${isSpectatorQr ? "min-h-0 flex-col gap-3" : "min-h-[54vh]"}`} aria-busy={loading}>
            {previewUrl ? (
              isSpectatorQr ? (
                <div className="relative rounded-[1.7rem] bg-white p-3 shadow-[0_18px_55px_rgba(0,0,0,.34)] ring-1 ring-black/5 sm:p-4">
                  <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[1.25rem] border border-neutral-100" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt={previewAlt ?? `${tx("Vista previa")} · ${title}`} className="relative block h-auto max-h-[42dvh] w-[min(68vw,19rem)] object-contain" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={previewAlt ?? `${tx("Vista previa")} · ${title}`} className="block h-auto max-h-[72vh] w-auto max-w-full object-contain" />
              )
            ) : null}

            {loading ? (
              <div className={`grid min-h-52 place-items-center gap-3 px-6 text-center type-caption font-black uppercase tracking-[.18em] ${isSpectatorQr ? "text-neutral-600" : "text-neutral-300"}`}>
                {isSpectatorQr ? <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" /> : null}
                {tx(isSpectatorQr ? "Preparando tu QR…" : "Preparando…")}
              </div>
            ) : null}

            {!loading && error ? (
              <div className={`grid min-h-52 place-items-center px-8 text-center text-sm font-bold leading-6 ${isSpectatorQr ? "text-red-700" : "text-red-200"}`}>
                {errorMessage ?? tx("No se ha podido construir la vista previa.")}
              </div>
            ) : null}

            {isSpectatorQr && previewUrl && !loading && !error ? (
              <p className="text-center text-xs font-semibold tracking-wide text-neutral-600">{tx("Escanea para abrir la liga")}</p>
            ) : null}
          </div>
        </div>

        {isSpectatorQr && previewUrl && !error ? (
          <p className="flex shrink-0 items-center justify-center gap-2 border-t border-neutral-200 bg-stone-50 px-4 py-2 text-center text-xs font-bold tracking-wide text-neutral-600">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
            {tx("Un enlace para toda la liga")}
          </p>
        ) : null}

        {statusMessage ? (
          <p role="status" className={`border-t px-4 py-2 text-center text-xs font-bold ${isSpectatorQr ? "border-neutral-200 text-neutral-700" : "border-white/10 text-emerald-300"}`}>
            {tx(statusMessage)}
          </p>
        ) : null}

        <div className={`grid shrink-0 grid-cols-2 gap-2 ${isSpectatorQr ? "border-t border-neutral-200 bg-stone-50 p-4 sm:px-5" : "border-t border-white/10 bg-neutral-950 p-3"}`}>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => void onDownload()}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-center text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${isSpectatorQr ? "bg-neutral-200 text-neutral-950 hover:bg-neutral-300" : "border border-white/15 bg-white text-neutral-950"}`}
          >
            {isSpectatorQr && busyAction !== "download" ? <DownloadMark /> : null}
            {busyAction === "download" ? tx("Generando…") : tx("Descargar")}
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => void onShare()}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-center text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${isSpectatorQr ? "bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-200" : "bg-white/10 text-white ring-1 ring-inset ring-white/15"}`}
          >
            {isSpectatorQr && busyAction !== "share" ? <ShareMark /> : null}
            {busyAction === "share" ? tx("Compartiendo...") : tx("Compartir")}
          </button>
        </div>
      </div>
    </div>
  )

  return portalToBody ? createPortal(modal, document.body) : modal
}
