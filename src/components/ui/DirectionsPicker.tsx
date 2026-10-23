"use client"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { showActionFeedback } from "@/lib/actionFeedback"

type DirectionsPickerProps = {
  mapsUrl: string
  locationLabel: string
  className?: string
  triggerLabel?: string
}

function buildAppleMapsUrl(locationLabel: string) {
  return `https://maps.apple.com/?address=${encodeURIComponent(locationLabel)}`
}

function buildWazeUrl(locationLabel: string) {
  return `https://waze.com/ul?q=${encodeURIComponent(locationLabel)}&navigate=yes`
}

export function DirectionsPicker({ mapsUrl, locationLabel, className = "", triggerLabel }: DirectionsPickerProps) {
  const { t, tx } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  async function copyLocation() {
    try {
      await navigator.clipboard.writeText(locationLabel)
      setCopied(true)
      showActionFeedback({ tone: "success", message: t.matchDetail.directionsCopied })
      setIsOpen(false)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const optionClass = "flex w-full items-center justify-between rounded-xl bg-neutral-100 px-3 py-3 text-left text-sm font-bold text-neutral-900 transition active:scale-[0.99] dark:bg-neutral-800 dark:text-white"

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={`${className} inline-flex items-center justify-center`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0"><path d="m21 3-6 18-4-8-8-4Z" /></svg>
        {triggerLabel ?? t.matchDetail.directionsButton}
      </button>

      {isOpen && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-3" role="presentation" onClick={() => setIsOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="directions-picker-title" className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-950 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="directions-picker-title" className="text-base font-black text-neutral-950">{t.matchDetail.directionsPickerTitle}</h2>
                <p className="mt-1 text-xs font-semibold leading-4 text-neutral-500">{t.matchDetail.directionsPickerDescription}</p>
                <p className="mt-2 truncate text-sm font-bold text-neutral-800 dark:text-white" title={locationLabel}>{locationLabel}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)} className={optionClass}>{t.matchDetail.directionsGoogleMaps}<span aria-hidden="true">›</span></a>
              <a href={buildAppleMapsUrl(locationLabel)} target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)} className={optionClass}>{t.matchDetail.directionsAppleMaps}<span aria-hidden="true">›</span></a>
              <a href={buildWazeUrl(locationLabel)} target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)} className={optionClass}>{t.matchDetail.directionsWaze}<span aria-hidden="true">›</span></a>
              <button type="button" onClick={copyLocation} className={optionClass}>{copied ? t.matchDetail.directionsCopied : t.matchDetail.directionsCopyLocation}{copied ? <span aria-hidden="true">✓</span> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5 shrink-0"><rect x="9" y="9" width="10" height="10" rx="2.5" /><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-5A2.5 2.5 0 0 0 5 6.5v5A2.5 2.5 0 0 0 7.5 14H9" /></svg>}</button>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-bold text-neutral-700 dark:text-neutral-300">{tx("Cancelar")}</button>
          </section>
        </div>,
        document.body,
      ) : null}
    </>
  )
}
