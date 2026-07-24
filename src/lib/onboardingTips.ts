export type OnboardingTipId =
  | "settings-search"
  | "availability-custom"
  | "match-actions"
  | "season-admin"

const storagePrefix = "smash-lob-onboarding-tip:"
const changeEventName = "smash-lob-onboarding-tips-change"

const onboardingTipIds: OnboardingTipId[] = [
  "settings-search",
  "availability-custom",
  "match-actions",
  "season-admin",
]

function getStorageKey(tipId: OnboardingTipId) {
  return `${storagePrefix}${tipId}`
}

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(changeEventName))
  }
}

export function isOnboardingTipVisible(tipId: OnboardingTipId) {
  if (typeof window === "undefined") {
    return false
  }

  return window.localStorage.getItem(getStorageKey(tipId)) !== "dismissed"
}

export function dismissOnboardingTip(tipId: OnboardingTipId) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(getStorageKey(tipId), "dismissed")
  emitChange()
}

export function resetOnboardingTips() {
  if (typeof window === "undefined") {
    return
  }

  onboardingTipIds.forEach((tipId) => {
    window.localStorage.removeItem(getStorageKey(tipId))
  })
  emitChange()
}

export function subscribeOnboardingTips(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  function handleStorage(event: StorageEvent) {
    if (!event.key || event.key.startsWith(storagePrefix)) {
      listener()
    }
  }

  window.addEventListener(changeEventName, listener)
  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener(changeEventName, listener)
    window.removeEventListener("storage", handleStorage)
  }
}
