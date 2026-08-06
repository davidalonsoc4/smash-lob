import type {
  OnboardingProgressItem,
  OnboardingProgressStatus,
  OnboardingTourDefinition,
  OnboardingTourKey,
} from "./types"

const storageKey = "smash-lob-guided-onboarding-v1"

export type OnboardingProgressMap = Partial<Record<OnboardingTourKey, OnboardingProgressItem>>

export function readLocalOnboardingProgress(): OnboardingProgressMap {
  if (typeof window === "undefined") return {}

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")
    return parsed && typeof parsed === "object" ? parsed as OnboardingProgressMap : {}
  } catch {
    return {}
  }
}

export function writeLocalOnboardingProgress(progress: OnboardingProgressMap) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(storageKey, JSON.stringify(progress))
}

export function hasCompletedCurrentTour(
  progress: OnboardingProgressMap,
  tour: OnboardingTourDefinition,
) {
  const item = progress[tour.key]
  return Boolean(item && item.tourVersion >= tour.version)
}

export function createProgressItem({
  tourKey,
  tourVersion,
  status,
}: {
  tourKey: OnboardingTourKey
  tourVersion: number
  status: OnboardingProgressStatus
}): OnboardingProgressItem {
  const timestamp = new Date().toISOString()
  return {
    tourKey,
    tourVersion,
    status,
    completedAt: status === "completed" ? timestamp : null,
    skippedAt: status === "skipped" ? timestamp : null,
  }
}
