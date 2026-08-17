"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type ThemeMode = "light" | "dark" | "system"
export type VisualStyle = "plain" | "colorful"
export type ColorfulPalette =
  | "indigo"
  | "midnight"
  | "sage"
  | "burgundy"
  | "terracotta"
  | "graphite"

type ThemeContextValue = {
  themeMode: ThemeMode
  setThemeMode: (themeMode: ThemeMode) => void
  visualStyle: VisualStyle
  setVisualStyle: (visualStyle: VisualStyle) => void
  colorfulPalette: ColorfulPalette
  setColorfulPalette: (palette: ColorfulPalette) => void
}

const LEGACY_THEME_STORAGE_KEY = "smash-lob-theme"
const THEME_MODE_STORAGE_KEY = "smash-lob-theme-mode"
const VISUAL_STYLE_STORAGE_KEY = "smash-lob-visual-style"
const COLORFUL_PALETTE_STORAGE_KEY = "smash-lob-colorful-palette"
const DEFAULT_THEME_MODE: ThemeMode = "light"
const DEFAULT_VISUAL_STYLE: VisualStyle = "colorful"
const DEFAULT_COLORFUL_PALETTE: ColorfulPalette = "graphite"

const COLORFUL_THEME_COLORS: Record<ColorfulPalette, { light: string; dark: string }> = {
  indigo: { light: "#5b5ce2", dark: "#17172e" },
  midnight: { light: "#365f9d", dark: "#0d1726" },
  sage: { light: "#55765f", dark: "#101b15" },
  burgundy: { light: "#8b3f57", dark: "#241219" },
  terracotta: { light: "#a95640", dark: "#251713" },
  graphite: { light: "#4f6379", dark: "#121820" },
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system"
}

function isVisualStyle(value: string | null): value is VisualStyle {
  return value === "plain" || value === "colorful"
}

function normalizeColorfulPalette(value: string | null): ColorfulPalette | null {
  if (
    value === "indigo" ||
    value === "midnight" ||
    value === "sage" ||
    value === "burgundy" ||
    value === "terracotta" ||
    value === "graphite"
  ) {
    return value
  }

  const legacyPaletteMap: Record<string, ColorfulPalette> = {
    ocean: "midnight",
    emerald: "sage",
    coral: "burgundy",
    sunset: "terracotta",
  }

  return value ? legacyPaletteMap[value] ?? null : null
}

function readLegacyTheme(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
}

function readStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME_MODE

  const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY)
  if (isThemeMode(stored)) return stored

  const legacy = readLegacyTheme()
  return isThemeMode(legacy) ? legacy : DEFAULT_THEME_MODE
}

function readStoredVisualStyle(): VisualStyle {
  if (typeof window === "undefined") return DEFAULT_VISUAL_STYLE

  const stored = window.localStorage.getItem(VISUAL_STYLE_STORAGE_KEY)
  if (isVisualStyle(stored)) return stored

  const legacy = readLegacyTheme()
  if (legacy === "colorful") return "colorful"
  return isThemeMode(legacy) ? "plain" : DEFAULT_VISUAL_STYLE
}

function readStoredColorfulPalette(): ColorfulPalette {
  if (typeof window === "undefined") return DEFAULT_COLORFUL_PALETTE
  const stored = window.localStorage.getItem(COLORFUL_PALETTE_STORAGE_KEY)
  return normalizeColorfulPalette(stored) ?? DEFAULT_COLORFUL_PALETTE
}

function applyAppearance(themeMode: ThemeMode, visualStyle: VisualStyle, colorfulPalette: ColorfulPalette) {
  const dark =
    themeMode === "dark" ||
    (themeMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const colorful = visualStyle === "colorful"
  const resolvedTheme = dark ? "dark" : "light"
  const root = document.documentElement

  root.classList.toggle("dark", dark)
  root.classList.toggle("colorful", colorful)
  root.dataset.theme = resolvedTheme
  root.dataset.style = visualStyle
  root.dataset.colorfulPalette = colorfulPalette
  root.style.colorScheme = resolvedTheme

  const themeColor = colorful
    ? COLORFUL_THEME_COLORS[colorfulPalette][resolvedTheme]
    : dark
      ? "#0b1119"
      : "#0a0a0a"

  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", themeColor)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readStoredThemeMode)
  const [visualStyle, setVisualStyleState] = useState<VisualStyle>(readStoredVisualStyle)
  const [colorfulPalette, setColorfulPaletteState] = useState<ColorfulPalette>(readStoredColorfulPalette)

  useEffect(() => {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode)
    window.localStorage.setItem(VISUAL_STYLE_STORAGE_KEY, visualStyle)
    window.localStorage.setItem(COLORFUL_PALETTE_STORAGE_KEY, colorfulPalette)
    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)

    applyAppearance(themeMode, visualStyle, colorfulPalette)

    if (themeMode !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => applyAppearance("system", visualStyle, colorfulPalette)
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [colorfulPalette, themeMode, visualStyle])

  function setThemeMode(nextThemeMode: ThemeMode) {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, nextThemeMode)
    setThemeModeState(nextThemeMode)
  }

  function setVisualStyle(nextVisualStyle: VisualStyle) {
    window.localStorage.setItem(VISUAL_STYLE_STORAGE_KEY, nextVisualStyle)
    setVisualStyleState(nextVisualStyle)
  }

  function setColorfulPalette(nextPalette: ColorfulPalette) {
    window.localStorage.setItem(COLORFUL_PALETTE_STORAGE_KEY, nextPalette)
    setColorfulPaletteState(nextPalette)
  }

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      visualStyle,
      setVisualStyle,
      colorfulPalette,
      setColorfulPalette,
    }),
    [colorfulPalette, themeMode, visualStyle],
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
