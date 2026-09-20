"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import {
  BASE_THEME_STORAGE_KEY,
  APPEARANCE_PREFERENCE_STORAGE_KEY,
  COMPETITION_ACCENT_STORAGE_KEY,
  DEFAULT_COMPETITION_ACCENT,
  DEFAULT_BASE_THEME,
  DEFAULT_LEAGUE_ACCENT,
  DEFAULT_PALETTE,
  DEFAULT_VISUAL_STYLE,
  getCompetitionAccentColor,
  LEGACY_PALETTE_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  migrateStoredAppearance,
  normalizeAccentColor,
  normalizeCompetitionAccent,
  normalizePalette,
  PALETTE_STORAGE_KEY,
  type BaseTheme,
  type CompetitionAccent,
  type Palette,
  isCompetitionAvailable,
  VISUAL_STYLE_STORAGE_KEY,
  type VisualStyle,
} from "@/lib/visualStyle"

export type ThemeMode = BaseTheme
export type { BaseTheme, Palette, VisualStyle }
/** @deprecated Kept as a source-compatible alias for older consumers. */
export type ColorfulPalette = Exclude<Palette, "classic" | "league">

type ThemeContextValue = {
  themeMode: ThemeMode
  setThemeMode: (themeMode: ThemeMode) => void
  visualStyle: VisualStyle
  setVisualStyle: (visualStyle: VisualStyle) => void
  palette: Palette
  setPalette: (palette: Palette) => void
  leagueAccent: string
  setLeagueAccent: (accent: string | null | undefined) => void
  competitionAccent: CompetitionAccent
  setCompetitionAccent: (accent: CompetitionAccent) => void
  canUseCompetition: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredAppearance() {
  if (typeof window === "undefined") {
    return {
      baseTheme: DEFAULT_BASE_THEME,
      visualStyle: DEFAULT_VISUAL_STYLE,
      palette: DEFAULT_PALETTE,
    }
  }

  return migrateStoredAppearance({
    baseTheme: window.localStorage.getItem(BASE_THEME_STORAGE_KEY),
    visualStyle: window.localStorage.getItem(VISUAL_STYLE_STORAGE_KEY),
    palette: window.localStorage.getItem(PALETTE_STORAGE_KEY),
    legacyTheme: window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY),
    legacyPalette: window.localStorage.getItem(LEGACY_PALETTE_STORAGE_KEY),
  })
}

function readHadStoredAppearancePreference() {
  if (typeof window === "undefined") return false
  return [
    BASE_THEME_STORAGE_KEY,
    VISUAL_STYLE_STORAGE_KEY,
    PALETTE_STORAGE_KEY,
    COMPETITION_ACCENT_STORAGE_KEY,
    LEGACY_THEME_STORAGE_KEY,
    LEGACY_PALETTE_STORAGE_KEY,
  ].some((key) => Boolean(window.localStorage.getItem(key)))
}

function getContrastColor(value: string) {
  const red = Number.parseInt(value.slice(1, 3), 16)
  const green = Number.parseInt(value.slice(3, 5), 16)
  const blue = Number.parseInt(value.slice(5, 7), 16)
  return (0.299 * red + 0.587 * green + 0.114 * blue) / 255 > 0.58 ? "#111111" : "#FFFFFF"
}

function resolveDark(themeMode: ThemeMode) {
  return themeMode === "dark" || (themeMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
}

function getClassicAccentColor(palette: Palette, themeMode: ThemeMode) {
  if (palette === "classic" || palette === "league") return "#111827"
  const colors = {
    indigo: "#5b5ce2",
    midnight: "#365f9d",
    sage: "#55765f",
    burgundy: "#8b3f57",
    graphite: "#4f6379",
  } as const
  return colors[palette as keyof typeof colors] ?? (themeMode === "dark" ? "#dbe6f3" : "#111827")
}

function applyAppearance(themeMode: ThemeMode, visualStyle: VisualStyle, palette: Palette, leagueAccent: string, competitionAccent: CompetitionAccent) {
  const dark = visualStyle === "competition" ? true : resolveDark(themeMode)
  const resolvedTheme = dark ? "dark" : "light"
  const root = document.documentElement
  const effectivePalette = visualStyle === "competition" ? "league" : palette
  const effectiveAccent = visualStyle === "competition"
    ? getCompetitionAccentColor(competitionAccent, leagueAccent)
    : getClassicAccentColor(palette, themeMode)
  const colorful = visualStyle === "classic" && palette !== "classic"

  root.classList.toggle("dark", dark)
  root.classList.toggle("colorful", colorful)
  root.classList.toggle("competition", visualStyle === "competition")
  root.dataset.theme = resolvedTheme
  root.dataset.baseTheme = visualStyle === "competition" ? "dark" : themeMode
  root.dataset.style = visualStyle
  root.dataset.visualStyle = visualStyle
  root.dataset.palette = effectivePalette
  root.dataset.colorfulPalette = effectivePalette
  root.style.setProperty("--league-accent", leagueAccent)
  root.style.setProperty("--league-accent-contrast", getContrastColor(leagueAccent))
  root.style.setProperty("--app-accent", effectiveAccent)
  root.style.setProperty("--competition-accent", effectiveAccent)
  root.style.setProperty("--competition-accent-contrast", getContrastColor(effectiveAccent))
  root.style.colorScheme = resolvedTheme

  // Keep the browser/PWA status bar neutral. The league accent belongs to the
  // app surfaces, not to the operating-system chrome above the viewport.
  const themeColor = visualStyle === "competition" ? "#0a0a0a" : dark ? "#0b1119" : "#0a0a0a"
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", themeColor)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession()
  const pathname = usePathname()
  const initialAppearance = readStoredAppearance()
  const hadStoredAppearancePreference = useState(readHadStoredAppearancePreference)[0]
  const canUseCompetition = isCompetitionAvailable(session?.user?.email)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialAppearance.baseTheme)
  // Do not discard a persisted Competition choice while Auth.js is still
  // loading the session. The allowlist is enforced once the session resolves.
  const [visualStyle, setVisualStyleState] = useState<VisualStyle>(initialAppearance.visualStyle)
  const [palette, setPaletteState] = useState<Palette>(initialAppearance.palette)
  const [leagueAccent, setLeagueAccentState] = useState(DEFAULT_LEAGUE_ACCENT)
  const [competitionAccent, setCompetitionAccentState] = useState<CompetitionAccent>(() =>
    typeof window === "undefined"
      ? DEFAULT_COMPETITION_ACCENT
      : normalizeCompetitionAccent(window.localStorage.getItem(COMPETITION_ACCENT_STORAGE_KEY)),
  )

  useEffect(() => {
    // Public spectator pages use the immutable appearance carried by the
    // invitation. Do not reapply a local account preference over it while the
    // visitor is anonymous; the spectator components apply the invite once it
    // has been fetched.
    if (pathname.startsWith("/spectate/") && sessionStatus !== "authenticated") return

    const sessionResolved = sessionStatus !== "loading"
    const effectiveStyle = !sessionResolved || canUseCompetition ? visualStyle : DEFAULT_VISUAL_STYLE

    window.localStorage.setItem(BASE_THEME_STORAGE_KEY, themeMode)
    if (hadStoredAppearancePreference) window.localStorage.setItem(APPEARANCE_PREFERENCE_STORAGE_KEY, "1")
    if (sessionResolved) window.localStorage.setItem(VISUAL_STYLE_STORAGE_KEY, effectiveStyle)
    window.localStorage.setItem(PALETTE_STORAGE_KEY, palette)
    window.localStorage.setItem(COMPETITION_ACCENT_STORAGE_KEY, competitionAccent)
    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_PALETTE_STORAGE_KEY)
    applyAppearance(themeMode, effectiveStyle, palette, leagueAccent, competitionAccent)

    if (themeMode !== "system" || effectiveStyle === "competition") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => applyAppearance(themeMode, effectiveStyle, palette, leagueAccent, competitionAccent)
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [canUseCompetition, competitionAccent, hadStoredAppearancePreference, leagueAccent, palette, pathname, sessionStatus, themeMode, visualStyle])

  const setThemeMode = useCallback((nextThemeMode: ThemeMode) => {
    window.localStorage.setItem(APPEARANCE_PREFERENCE_STORAGE_KEY, "1")
    setThemeModeState(nextThemeMode)
  }, [])

  const setVisualStyle = useCallback((nextVisualStyle: VisualStyle) => {
    if (nextVisualStyle === "competition" && !canUseCompetition && sessionStatus !== "loading") return
    window.localStorage.setItem(APPEARANCE_PREFERENCE_STORAGE_KEY, "1")
    setVisualStyleState(nextVisualStyle)
    if (nextVisualStyle === "competition") setThemeModeState("dark")
  }, [canUseCompetition, sessionStatus])

  const setPalette = useCallback((nextPalette: Palette) => {
    window.localStorage.setItem(APPEARANCE_PREFERENCE_STORAGE_KEY, "1")
    setPaletteState(normalizePalette(nextPalette) ?? DEFAULT_PALETTE)
  }, [])

  const setLeagueAccent = useCallback((accent: string | null | undefined) => {
    setLeagueAccentState(normalizeAccentColor(accent))
  }, [])

  const setCompetitionAccent = useCallback((nextAccent: CompetitionAccent) => {
    window.localStorage.setItem(APPEARANCE_PREFERENCE_STORAGE_KEY, "1")
    setCompetitionAccentState(normalizeCompetitionAccent(nextAccent))
  }, [])

  const value = useMemo(
    () => ({ themeMode, setThemeMode, visualStyle: sessionStatus === "loading" || canUseCompetition ? visualStyle : DEFAULT_VISUAL_STYLE, setVisualStyle, palette, setPalette, leagueAccent, setLeagueAccent, competitionAccent, setCompetitionAccent, canUseCompetition }),
    [canUseCompetition, competitionAccent, leagueAccent, palette, sessionStatus, setCompetitionAccent, setLeagueAccent, setPalette, setThemeMode, setVisualStyle, themeMode, visualStyle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error("useTheme must be used inside ThemeProvider")
  return value
}
