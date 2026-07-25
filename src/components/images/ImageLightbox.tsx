"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { useI18n } from "@/i18n/I18nProvider"

function subscribeToClientState() {
  return () => undefined
}

type ImageLightboxProps = {
  src: string
  alt: string
  onClose: () => void
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const { t } = useI18n()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const isClient = useSyncExternalStore(
    subscribeToClientState,
    () => true,
    () => false,
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
        return
      }

      if (event.key === "Tab") {
        event.preventDefault()
        closeButtonRef.current?.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  if (!isClient) {
    return null
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.imageViewer.dialogLabel}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-black/35 p-3 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[86vh] max-w-full select-none object-contain"
          draggable={false}
        />

        <button
          ref={closeButtonRef}
          type="button"
          autoFocus
          onClick={onClose}
          aria-label={t.imageViewer.close}
          title={t.imageViewer.close}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white shadow-lg backdrop-blur transition active:scale-95 active:bg-black/80"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  )
}
