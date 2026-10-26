"use client"

import { useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { FloatingDialog, DialogChevron, DialogOptionIcon } from "./FloatingDialog"
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
  const [copyError, setCopyError] = useState(false)

  async function copyLocation() {
    try {
      setCopyError(false)
      await navigator.clipboard.writeText(locationLabel)
      showActionFeedback({ tone: "success", message: t.matchDetail.directionsCopied })
      setIsOpen(false)
    } catch {
      setCopyError(true)
    }
  }

  const optionClass = "app-dialog-option"

  return (
    <>
      <button type="button" onClick={() => { setCopyError(false); setIsOpen(true) }} className={`${className} inline-flex items-center justify-center`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0"><path d="m21 3-6 18-4-8-8-4Z" /></svg>
        {triggerLabel ?? t.matchDetail.directionsButton}
      </button>

      <FloatingDialog open={isOpen} onClose={() => setIsOpen(false)} title={t.matchDetail.directionsPickerTitle}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="directions-picker-title" className="text-base font-black text-neutral-950">{t.matchDetail.directionsPickerTitle}</h2>
                <p className="mt-1 text-xs font-semibold leading-4 text-neutral-500">{t.matchDetail.directionsPickerDescription}</p>
                <p className="mt-2 truncate text-sm font-bold text-neutral-800 dark:text-white" title={locationLabel}>{locationLabel}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)} className={optionClass}><span className="flex items-center gap-2"><DialogOptionIcon kind="directions" />{t.matchDetail.directionsGoogleMaps}</span><DialogChevron /></a>
              <a href={buildAppleMapsUrl(locationLabel)} target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)} className={optionClass}><span className="flex items-center gap-2"><DialogOptionIcon kind="directions" />{t.matchDetail.directionsAppleMaps}</span><DialogChevron /></a>
              <a href={buildWazeUrl(locationLabel)} target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)} className={optionClass}><span className="flex items-center gap-2"><DialogOptionIcon kind="directions" />{t.matchDetail.directionsWaze}</span><DialogChevron /></a>
              <button type="button" onClick={copyLocation} className={optionClass}><span className="flex items-center gap-2"><DialogOptionIcon kind="copy" />{t.matchDetail.directionsCopyLocation}</span><DialogChevron /></button>
            </div>
            {copyError ? <p role="alert" className="mt-3 text-sm text-red-600">{tx("No se ha podido copiar la ubicación. Inténtalo de nuevo.")}</p> : null}
            <button type="button" onClick={() => setIsOpen(false)} className="app-dialog-cancel">{tx("Cancelar")}</button>
      </FloatingDialog>
    </>
  )
}
