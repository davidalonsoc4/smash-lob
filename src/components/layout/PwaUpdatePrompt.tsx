"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { requestPwaUpdate } from "@/lib/pwaUpdate"

export function PwaUpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const reloadTimeoutRef = useRef<number | null>(null)
  const isReloadingRef = useRef(false)

  const reloadApp = useCallback(() => {
    if (isReloadingRef.current) {
      return
    }

    isReloadingRef.current = true
    if (reloadTimeoutRef.current) {
      window.clearTimeout(reloadTimeoutRef.current)
    }
    window.location.reload()
  }, [])

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return
    }

    function handleControllerChange() {
      reloadApp()
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    )

    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting)
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing
        if (!installing) return

        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(registration.waiting ?? installing)
          }
        })
      })
    }).catch(() => {
      // La PWA no debe impedir el uso normal de la aplicación.
    })

    return () => {
      if (reloadTimeoutRef.current) {
        window.clearTimeout(reloadTimeoutRef.current)
      }
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      )
    }
  }, [reloadApp])

  if (!waitingWorker) {
    return null
  }

  return (
    <div
      className="fixed inset-x-4 z-[60] mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-3 shadow-lg"
      style={{ bottom: "max(18px, env(safe-area-inset-bottom, 0px))" }}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-black text-neutral-950">
        Hay una nueva versión disponible
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        Actualiza cuando quieras. Las operaciones guardadas no se perderán.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={isApplying}
          onClick={() => {
            setIsApplying(true)
            reloadTimeoutRef.current = requestPwaUpdate(
              waitingWorker,
              reloadApp,
              (callback, delayMs) =>
                window.setTimeout(callback, delayMs),
            )
          }}
          className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-400"
        >
          {isApplying ? "Actualizando…" : "Actualizar ahora"}
        </button>
        <button
          type="button"
          disabled={isApplying}
          onClick={() => setWaitingWorker(null)}
          className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700 disabled:text-neutral-400"
        >
          Más tarde
        </button>
      </div>
    </div>
  )
}
