"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type ThemePreference = "light" | "dark" | "system" | "colorful"
export type ColorfulPalette = "indigo" | "ocean" | "emerald" | "coral" | "sunset"

type ThemeContextValue = {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  colorfulPalette: ColorfulPalette
  setColorfulPalette: (palette: ColorfulPalette) => void
}

const THEME_STORAGE_KEY = "smash-lob-theme"
const COLORFUL_PALETTE_STORAGE_KEY = "smash-lob-colorful-palette"
const DEFAULT_COLORFUL_PALETTE: ColorfulPalette = "indigo"
const COLORFUL_THEME_COLORS: Record<ColorfulPalette, string> = {
  indigo: "#5b5ce2",
  ocean: "#087ea4",
  emerald: "#059669",
  coral: "#e65a72",
  sunset: "#f06a24",
}
const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system" || value === "colorful"
}

function isColorfulPalette(value: string | null): value is ColorfulPalette {
  return value === "indigo" || value === "ocean" || value === "emerald" || value === "coral" || value === "sunset"
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "light"
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemePreference(stored) ? stored : "light"
}

function readStoredColorfulPalette(): ColorfulPalette {
  if (typeof window === "undefined") return DEFAULT_COLORFUL_PALETTE
  const stored = window.localStorage.getItem(COLORFUL_PALETTE_STORAGE_KEY)
  return isColorfulPalette(stored) ? stored : DEFAULT_COLORFUL_PALETTE
}

function applyTheme(preference: ThemePreference, colorfulPalette: ColorfulPalette) {
  const colorful = preference === "colorful"
  const dark =
    !colorful &&
    (preference === "dark" ||
      (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches))
  const resolved = colorful ? "colorful" : dark ? "dark" : "light"
  const root = document.documentElement

  root.classList.toggle("dark", dark)
  root.classList.toggle("colorful", colorful)
  root.dataset.theme = resolved
  root.dataset.colorfulPalette = colorfulPalette
  root.style.colorScheme = dark ? "dark" : "light"

  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", colorful ? COLORFUL_THEME_COLORS[colorfulPalette] : dark ? "#0f0f10" : "#0a0a0a")
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)
  const [colorfulPalette, setColorfulPaletteState] = useState<ColorfulPalette>(readStoredColorfulPalette)

  useEffect(() => {
    applyTheme(preference, colorfulPalette)

    if (preference !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => applyTheme("system", colorfulPalette)
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [colorfulPalette, preference])

  function setPreference(nextPreference: ThemePreference) {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference)
    setPreferenceState(nextPreference)
  }

  function setColorfulPalette(nextPalette: ColorfulPalette) {
    window.localStorage.setItem(COLORFUL_PALETTE_STORAGE_KEY, nextPalette)
    setColorfulPaletteState(nextPalette)
  }

  const value = useMemo(
    () => ({ preference, setPreference, colorfulPalette, setColorfulPalette }),
    [colorfulPalette, preference]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)

  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider")
  }

  return value
}
