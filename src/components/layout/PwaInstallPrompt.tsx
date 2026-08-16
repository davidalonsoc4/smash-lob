"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { getAppBranding } from "@/lib/appVariant"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const dismissedCooldownDays = 7
const membershipsStorageKey = "smash-lob-user-league-memberships"

function hasStoredLeagueMembership(userId: string | null) {
  if (typeof window === "undefined" || !userId) {
    return false
  }

  const storedValue = window.localStorage.getItem(membershipsStorageKey)
  if (!storedValue) {
    return false
  }

  try {
    const memberships = JSON.parse(storedValue) as unknown
    return (
      Array.isArray(memberships) &&
      memberships.some((membership) => {
        if (typeof membership !== "object" || membership === null) {
          return false
        }

        const storedUserId = (membership as { userId?: unknown }).userId
        return (
          typeof storedUserId === "string" &&
          storedUserId.trim().toLowerCase() === userId
        )
      })
    )
  } catch {
    return false
  }
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") {
    return false
  }

  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  )
}

function isIosDevice() {
  if (typeof window === "undefined") {
    return false
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function wasRecentlyDismissed(dismissedStorageKey: string) {
  const storedValue = window.localStorage.getItem(dismissedStorageKey)

  if (!storedValue) {
    return false
  }

  const timestamp = Number(storedValue)

  if (!Number.isFinite(timestamp)) {
    return false
  }

  const cooldownMs = dismissedCooldownDays * 24 * 60 * 60 * 1000

  return Date.now() - timestamp < cooldownMs
}

export function PwaInstallPrompt() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const branding = useMemo(() => getAppBranding(), [])
  const dismissedStorageKey = `smash-lob-pwa-install-dismissed-at:${branding.variantKey}`
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [shouldShowIosHelp, setShouldShowIosHelp] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const sessionUserId = session?.user?.email?.trim().toLowerCase() ?? null
  const canOfferInstall =
    status === "authenticated" &&
    pathname === "/" &&
    hasStoredLeagueMembership(sessionUserId)

  useEffect(() => {
    if (isStandaloneDisplay() || wasRecentlyDismissed(dismissedStorageKey)) {
      return
    }

    if (isIosDevice()) {
      const timer = window.setTimeout(() => {
        setShouldShowIosHelp(true)
        setIsVisible(true)
      }, 1200)

      return () => window.clearTimeout(timer)
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [dismissedStorageKey])

  function dismiss() {
    window.localStorage.setItem(dismissedStorageKey, String(Date.now()))
    setIsVisible(false)
  }

  async function handleInstall() {
    if (!installEvent) {
      return
    }

    await installEvent.prompt()
    const choice = await installEvent.userChoice

    if (choice.outcome === "accepted") {
      window.localStorage.setItem(dismissedStorageKey, String(Date.now()))
      setIsVisible(false)
      setInstallEvent(null)
      return
    }

    dismiss()
  }

  if (!canOfferInstall || !isVisible || isStandaloneDisplay()) {
    return null
  }

  return (
    <div
      className="fixed z-50 px-4"
      style={{
        left: "max(0px, calc((100vw - 448px) / 2))",
        right: "max(0px, calc((100vw - 448px) / 2))",
        bottom: "76px",
      }}
    >
      <div className="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${branding.preproduction ? "bg-red-700" : "bg-neutral-950"}`}>
            {branding.installPromptMonogram}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-neutral-950">
              {branding.installPromptTitle}
            </p>
            <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">
              {shouldShowIosHelp
                ? "En iPhone: toca Compartir y después Añadir a pantalla de inicio."
                : "Accede como una app del móvil, sin buscarla en el navegador."}
            </p>

            <div className="mt-3 flex gap-2">
              {installEvent ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="inline-flex rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white items-center justify-center text-center"
                >
                  Instalar
                </button>
              ) : null}

              <button
                type="button"
                onClick={dismiss}
                className="inline-flex rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700 items-center justify-center text-center"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
