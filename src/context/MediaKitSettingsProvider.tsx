"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { DEFAULT_MEDIA_KIT_ACCENT, normalizeMediaKitAccentColor } from "@/lib/mediaKitTheme"

type MediaKitSettingsContextValue = {
  accentColor: string
  setAccentColor: (value: string) => void
}

const MediaKitSettingsContext = createContext<MediaKitSettingsContextValue | null>(null)

export function MediaKitSettingsProvider({ children, initialAccentColor }: { children: ReactNode; initialAccentColor?: string | null }) {
  const [accentColor, setAccentColorState] = useState<string>(
    normalizeMediaKitAccentColor(initialAccentColor ?? DEFAULT_MEDIA_KIT_ACCENT),
  )

  const value = useMemo<MediaKitSettingsContextValue>(
    () => ({
      accentColor: normalizeMediaKitAccentColor(accentColor),
      setAccentColor: (value) => setAccentColorState(normalizeMediaKitAccentColor(value)),
    }),
    [accentColor],
  )

  return <MediaKitSettingsContext.Provider value={value}>{children}</MediaKitSettingsContext.Provider>
}

export function useMediaKitSettings() {
  const value = useContext(MediaKitSettingsContext)
  if (!value) throw new Error("useMediaKitSettings must be used inside MediaKitSettingsProvider")
  return value
}
