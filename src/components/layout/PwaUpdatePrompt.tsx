"use client"

import { useEffect, useRef } from "react"
import {
  isPwaUpdateSafe,
  PWA_UPDATE_IDLE_MS,
  PWA_UPDATE_RECHECK_MS,
  requestPwaUpdate,
} from "@/lib/pwaUpdate"

function hasOpenDialog() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="dialog"], [role="alertdialog"], dialog[open]',
    ),
  ).some((dialog) => {
    const style = window.getComputedStyle(dialog)
    return dialog.getClientRects().length > 0 && style.visibility !== "hidden"
  })
}

function hasEditableFocus() {
  const activeElement = document.activeElement
  return activeElement instanceof HTMLElement && (
    activeElement.isContentEditable ||
    activeElement.matches('input, textarea, select, [role="textbox"]')
  )
}

export function PwaUpdatePrompt() {
  const updateTimerRef = useRef<number | null>(null)
  const reloadTimerRef = useRef<number | null>(null)
  const lastActivityAtRef = useRef(0)
  const waitingWorkerRef = useRef<ServiceWorker | null>(null)
  const updateRequestedRef = useRef(false)
  const reloadPendingRef = useRef(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    lastActivityAtRef.current = Date.now()

    let registration: ServiceWorkerRegistration | null = null
    let installingWorker: ServiceWorker | null = null

    const isSafeNow = () => isPwaUpdateSafe({
      isVisible: document.visibilityState === "visible",
      hasFocus: document.hasFocus(),
      isEditing: hasEditableFocus(),
      hasOpenDialog: hasOpenDialog(),
      idleMs: Date.now() - lastActivityAtRef.current,
    })

    const scheduleSafeReload = (delayMs = 0) => {
      if (!reloadPendingRef.current) return
      if (reloadTimerRef.current !== null) {
        window.clearTimeout(reloadTimerRef.current)
      }

      reloadTimerRef.current = window.setTimeout(() => {
        reloadTimerRef.current = null
        if (!reloadPendingRef.current) return
        if (!isSafeNow()) {
          scheduleSafeReload(PWA_UPDATE_RECHECK_MS)
          return
        }

        reloadPendingRef.current = false
        window.location.reload()
      }, delayMs)
    }

    const reloadAfterActivation = () => {
      if (!updateRequestedRef.current) return
      reloadPendingRef.current = true
      scheduleSafeReload()
    }

    const activateWaitingWorker = () => {
      const waitingWorker = waitingWorkerRef.current
      if (!waitingWorker || updateRequestedRef.current || !isSafeNow()) return false

      waitingWorkerRef.current = null
      updateRequestedRef.current = true
      requestPwaUpdate(
        waitingWorker,
        reloadAfterActivation,
        (callback, delayMs) => window.setTimeout(callback, delayMs),
      )
      return true
    }

    const scheduleUpdateCheck = () => {
      if (updateTimerRef.current !== null) {
        window.clearTimeout(updateTimerRef.current)
        updateTimerRef.current = null
      }
      if (!waitingWorkerRef.current || updateRequestedRef.current) return

      const idleRemaining = Math.max(
        0,
        PWA_UPDATE_IDLE_MS - (Date.now() - lastActivityAtRef.current),
      )
      const pageCanBeChecked = document.visibilityState === "visible" &&
        document.hasFocus() && !hasEditableFocus() && !hasOpenDialog()
      const delay = pageCanBeChecked
        ? Math.max(1, idleRemaining)
        : PWA_UPDATE_RECHECK_MS

      updateTimerRef.current = window.setTimeout(() => {
        updateTimerRef.current = null
        if (!activateWaitingWorker()) scheduleUpdateCheck()
      }, delay)
    }

    const showWaitingWorker = (worker: ServiceWorker) => {
      if (updateRequestedRef.current) return
      waitingWorkerRef.current = worker
      scheduleUpdateCheck()
    }

    const handleActivity = () => {
      lastActivityAtRef.current = Date.now()
      if (reloadPendingRef.current) scheduleSafeReload(PWA_UPDATE_IDLE_MS)
      if (waitingWorkerRef.current) scheduleUpdateCheck()
    }

    const handleControllerChange = () => reloadAfterActivation()
    const handleUpdateFound = () => {
      installingWorker = registration?.installing ?? null
      installingWorker?.addEventListener("statechange", handleWorkerStateChange)
    }
    const handleWorkerStateChange = () => {
      if (
        installingWorker?.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        showWaitingWorker(registration?.waiting ?? installingWorker)
      }
    }

    const activityEvents: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
      "input",
      "change",
      "focusin",
    ]

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }))
    document.addEventListener("visibilitychange", handleActivity)
    window.addEventListener("focus", handleActivity)
    window.addEventListener("blur", handleActivity)

    void navigator.serviceWorker.register("/sw.js").then((nextRegistration) => {
      registration = nextRegistration
      registration.addEventListener("updatefound", handleUpdateFound)
      if (registration.waiting) showWaitingWorker(registration.waiting)
    }).catch(() => {
      // La PWA no debe impedir el uso normal de la aplicación.
    })

    return () => {
      if (updateTimerRef.current !== null) window.clearTimeout(updateTimerRef.current)
      if (reloadTimerRef.current !== null) window.clearTimeout(reloadTimerRef.current)
      if (installingWorker) installingWorker.removeEventListener("statechange", handleWorkerStateChange)
      registration?.removeEventListener("updatefound", handleUpdateFound)
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
      document.removeEventListener("visibilitychange", handleActivity)
      window.removeEventListener("focus", handleActivity)
      window.removeEventListener("blur", handleActivity)
    }
  }, [])

  return null
}
