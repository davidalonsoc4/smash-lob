"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import {
  createProgressItem,
  hasCompletedCurrentTour,
  readLocalOnboardingProgress,
  writeLocalOnboardingProgress,
  type OnboardingProgressMap,
} from "./progress"
import { getOnboardingTours, getTourForPathname, getTourStepsForLaunch } from "./tours"
import type {
  OnboardingProgressStatus,
  OnboardingTourDefinition,
  OnboardingTourKey,
} from "./types"

type OnboardingContextValue = {
  activeTour: OnboardingTourDefinition | null
  currentTour: OnboardingTourDefinition | null
  currentStepIndex: number
  progress: OnboardingProgressMap
  isLoading: boolean
  availableTours: OnboardingTourDefinition[]
  startTour: (tour: OnboardingTourDefinition, options?: { includeFirstRunOnly?: boolean }) => void
  startCurrentTour: () => void
  nextStep: () => void
  previousStep: () => void
  finishTour: () => void
  skipTour: () => void
  closeTour: () => void
  resetAllTours: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

function mergeProgress(
  localProgress: OnboardingProgressMap,
  remoteItems: unknown,
): OnboardingProgressMap {
  if (!Array.isArray(remoteItems)) return localProgress

  const next = { ...localProgress }
  remoteItems.forEach((item) => {
    if (!item || typeof item !== "object") return
    const candidate = item as Record<string, unknown>
    const tourKey = candidate.tourKey
    const tourVersion = candidate.tourVersion
    const status = candidate.status

    if (
      typeof tourKey !== "string" ||
      typeof tourVersion !== "number" ||
      (status !== "completed" && status !== "skipped")
    ) {
      return
    }

    const existing = next[tourKey as OnboardingTourKey]
    if (!existing || existing.tourVersion <= tourVersion) {
      next[tourKey as OnboardingTourKey] = {
        tourKey: tourKey as OnboardingTourKey,
        tourVersion,
        status,
        completedAt:
          typeof candidate.completedAt === "string" ? candidate.completedAt : null,
        skippedAt:
          typeof candidate.skippedAt === "string" ? candidate.skippedAt : null,
      }
    }
  })

  return next
}

function getAvailableSteps(tour: OnboardingTourDefinition) {
  return tour.steps.filter((step) => {
    if (!step.selector) return true
    const element = document.querySelector(step.selector)
    if (!(element instanceof HTMLElement)) return false
    const rect = element.getBoundingClientRect()
    return rect.width > 4 && rect.height > 4
  })
}

function readRequestedTourKey(): OnboardingTourKey | null {
  if (typeof window === "undefined") return null
  const candidate = new URLSearchParams(window.location.search).get("tour")
  return candidate as OnboardingTourKey | null
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { locale } = useI18n()
  const { activeLeagueId } = useActiveLeague()
  const { isLeagueAdmin, isLeagueSpectator, isSuperuser } = useLeagueAccess()
  const [progress, setProgress] = useState<OnboardingProgressMap>(() => readLocalOnboardingProgress())
  const [isLoading, setIsLoading] = useState(true)
  const [activeTour, setActiveTour] = useState<OnboardingTourDefinition | null>(null)
  const [activeSteps, setActiveSteps] = useState<OnboardingTourDefinition["steps"]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const autoStartedPathRef = useRef<string | null>(null)
  const audience = useMemo(
    () => ({
      isSuperuser,
      isSpectator: !isSuperuser && isLeagueSpectator(activeLeagueId),
      isLeagueAdmin: isLeagueAdmin(activeLeagueId),
    }),
    [activeLeagueId, isLeagueAdmin, isLeagueSpectator, isSuperuser],
  )
  const availableTours = useMemo(
    () => getOnboardingTours(locale).filter((tour) => tour.audience(audience)),
    [audience, locale],
  )
  const currentTour = getTourForPathname({
    pathname,
    locale,
    audience,
  })

  useEffect(() => {
    let cancelled = false
    const localProgress = readLocalOnboardingProgress()

    void fetch("/api/onboarding/progress", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null
        return response.json() as Promise<{ items?: unknown }>
      })
      .then((payload) => {
        if (cancelled || !payload) return
        const merged = mergeProgress(localProgress, payload.items)
        setProgress(merged)
        writeLocalOnboardingProgress(merged)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const startTour = useCallback((
    tour: OnboardingTourDefinition,
    options: { includeFirstRunOnly?: boolean } = {},
  ) => {
    const launchTour = {
      ...tour,
      steps: getTourStepsForLaunch(tour, options),
    }
    const steps = getAvailableSteps(launchTour)
    if (steps.length === 0) return

    setActiveSteps(steps)
    setCurrentStepIndex(0)
    setActiveTour({ ...tour, steps })
  }, [])

  const persistStatus = useCallback(
    async (tour: OnboardingTourDefinition, status: OnboardingProgressStatus) => {
      const item = createProgressItem({
        tourKey: tour.key,
        tourVersion: tour.version,
        status,
      })
      const next = { ...progress, [tour.key]: item }
      setProgress(next)
      writeLocalOnboardingProgress(next)

      await fetch("/api/onboarding/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourKey: tour.key,
          tourVersion: tour.version,
          status,
        }),
      }).catch(() => undefined)
    },
    [progress],
  )

  useEffect(() => {
    const requestedTourKey = readRequestedTourKey()
    const autoStartKey = `${pathname}:${requestedTourKey ?? ""}`
    if (isLoading || activeTour || autoStartedPathRef.current === autoStartKey) return

    const requestedTour = requestedTourKey
      ? availableTours.find(
          (tour) => tour.key === requestedTourKey && tour.route === pathname,
        ) ?? null
      : null
    const candidate = requestedTour ?? currentTour
    const shouldStart = candidate
      ? Boolean(requestedTour) || !hasCompletedCurrentTour(progress, candidate)
      : false
    const hasSeenWelcome = Boolean(progress.home || progress["app-introduction"])
    const includeFirstRunOnly =
      !requestedTour &&
      pathname === "/" &&
      candidate?.key === "home" &&
      !hasSeenWelcome

    if (!candidate || !shouldStart) {
      autoStartedPathRef.current = autoStartKey
      return
    }

    const timeout = window.setTimeout(() => {
      autoStartedPathRef.current = autoStartKey
      startTour(candidate, { includeFirstRunOnly })
    }, 850)

    return () => window.clearTimeout(timeout)
  }, [
    activeTour,
    availableTours,
    currentTour,
    isLoading,
    pathname,
    progress,
    startTour,
  ])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveTour(null)
      setActiveSteps([])
      setCurrentStepIndex(0)
      autoStartedPathRef.current = null
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [pathname])

  const closeTour = useCallback(() => {
    setActiveTour(null)
    setActiveSteps([])
    setCurrentStepIndex(0)
  }, [])

  const finishTour = useCallback(() => {
    if (!activeTour) return
    void persistStatus(activeTour, "completed")
    closeTour()
  }, [activeTour, closeTour, persistStatus])

  const skipTour = useCallback(() => {
    if (!activeTour) return
    void persistStatus(activeTour, "skipped")
    closeTour()
  }, [activeTour, closeTour, persistStatus])

  const nextStep = useCallback(() => {
    if (!activeTour) return
    if (currentStepIndex >= activeSteps.length - 1) {
      finishTour()
      return
    }
    setCurrentStepIndex((value) => value + 1)
  }, [activeSteps.length, activeTour, currentStepIndex, finishTour])

  const previousStep = useCallback(() => {
    setCurrentStepIndex((value) => Math.max(0, value - 1))
  }, [])

  const startCurrentTour = useCallback(() => {
    if (currentTour) startTour(currentTour)
  }, [currentTour, startTour])

  const resetAllTours = useCallback(async () => {
    setProgress({})
    writeLocalOnboardingProgress({})
    autoStartedPathRef.current = null
    await fetch("/api/onboarding/progress", { method: "DELETE" }).catch(() => undefined)
  }, [])

  const value = useMemo<OnboardingContextValue>(
    () => ({
      activeTour,
      currentTour,
      currentStepIndex,
      progress,
      isLoading,
      availableTours,
      startTour,
      startCurrentTour,
      nextStep,
      previousStep,
      finishTour,
      skipTour,
      closeTour,
      resetAllTours,
    }),
    [
      activeTour,
      availableTours,
      closeTour,
      currentStepIndex,
      currentTour,
      finishTour,
      isLoading,
      nextStep,
      previousStep,
      progress,
      resetAllTours,
      skipTour,
      startCurrentTour,
      startTour,
    ],
  )

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) throw new Error("useOnboarding must be used inside OnboardingProvider")
  return context
}
