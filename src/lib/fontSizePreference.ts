export const APP_FONT_SIZE_STORAGE_KEY = "smash-lob-font-size"
export const APP_FONT_SIZE_CHANGE_EVENT = "smash-lob-font-size-change"

export type AppFontSize = "small" | "normal" | "large"

export const APP_FONT_SIZE_ADJUSTMENTS: Record<AppFontSize, string> = {
  small: "-2px",
  normal: "0px",
  large: "2px",
}

export function normalizeAppFontSize(value: string | null | undefined): AppFontSize {
  if (value === "small" || value === "large") return value
  return "normal"
}

export function applyAppFontSize(size: AppFontSize) {
  if (typeof document === "undefined") return
  document.documentElement.style.setProperty(
    "--app-font-size-adjust",
    APP_FONT_SIZE_ADJUSTMENTS[size],
  )
}

export function getServerAppFontSize(): AppFontSize {
  return "normal"
}

export function readStoredAppFontSize(): AppFontSize {
  if (typeof window === "undefined") return getServerAppFontSize()
  return normalizeAppFontSize(window.localStorage.getItem(APP_FONT_SIZE_STORAGE_KEY))
}

export function subscribeAppFontSize(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined

  const handleStorage = (event: StorageEvent) => {
    if (event.key === APP_FONT_SIZE_STORAGE_KEY) onStoreChange()
  }
  const handleLocalChange = () => onStoreChange()

  window.addEventListener("storage", handleStorage)
  window.addEventListener(APP_FONT_SIZE_CHANGE_EVENT, handleLocalChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(APP_FONT_SIZE_CHANGE_EVENT, handleLocalChange)
  }
}

export function persistAppFontSize(size: AppFontSize) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(APP_FONT_SIZE_STORAGE_KEY, size)
  applyAppFontSize(size)
  window.dispatchEvent(new Event(APP_FONT_SIZE_CHANGE_EVENT))
}
