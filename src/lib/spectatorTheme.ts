import {
  APPEARANCE_PREFERENCE_STORAGE_KEY,
  DEFAULT_BASE_THEME,
  DEFAULT_COMPETITION_ACCENT,
  DEFAULT_LEAGUE_ACCENT,
  DEFAULT_PALETTE,
  DEFAULT_VISUAL_STYLE,
  getCompetitionAccentColor,
  getContrastColor,
  normalizeAccentColor,
  normalizeCompetitionAccent,
  normalizePalette,
  type BaseTheme,
  type CompetitionAccent,
  type Palette,
  type VisualStyle,
} from "@/lib/visualStyle"

export type SpectatorInviteAppearance = {
  visualStyle: VisualStyle
  baseTheme: BaseTheme
  palette: Palette
  competitionAccent: CompetitionAccent
  accentColor: string
}

const CLASSIC_ACCENTS: Record<Exclude<Palette, "classic" | "league">, string> = {
  indigo: "#5B5CE2",
  midnight: "#365F9D",
  sage: "#55765F",
  burgundy: "#8B3F57",
  graphite: "#4F6379",
}

function resolveClassicAccent(palette: Palette, themeMode: BaseTheme) {
  if (palette === "classic" || palette === "league") return themeMode === "dark" ? "#DBE6F3" : "#111827"
  return CLASSIC_ACCENTS[palette] ?? "#111827"
}

export function normalizeSpectatorInviteAppearance(input: Partial<SpectatorInviteAppearance> | null | undefined): SpectatorInviteAppearance {
  const visualStyle = input?.visualStyle === "competition" ? "competition" : DEFAULT_VISUAL_STYLE
  const baseTheme = input?.baseTheme === "dark" || input?.baseTheme === "system" ? input.baseTheme : DEFAULT_BASE_THEME
  const palette = normalizePalette(input?.palette ?? null) ?? DEFAULT_PALETTE
  const competitionAccent = normalizeCompetitionAccent(input?.competitionAccent ?? DEFAULT_COMPETITION_ACCENT)
  const accentColor = normalizeAccentColor(input?.accentColor, DEFAULT_LEAGUE_ACCENT)
  return { visualStyle, baseTheme, palette, competitionAccent, accentColor }
}

export function hasStoredAppearancePreference() {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(APPEARANCE_PREFERENCE_STORAGE_KEY) === "1"
}

/** Applies an invite's immutable appearance without creating a local preference. */
export function applySpectatorInviteAppearance(input: Partial<SpectatorInviteAppearance> | null | undefined) {
  if (typeof document === "undefined") return

  const appearance = normalizeSpectatorInviteAppearance(input)
  const dark = appearance.visualStyle === "competition"
    ? true
    : appearance.baseTheme === "dark" || (appearance.baseTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const effectiveAccent = appearance.visualStyle === "competition"
    ? getCompetitionAccentColor(appearance.competitionAccent, appearance.accentColor)
    : resolveClassicAccent(appearance.palette, appearance.baseTheme)
  const root = document.documentElement
  const resolvedTheme = dark ? "dark" : "light"
  const effectivePalette = appearance.visualStyle === "competition" ? "league" : appearance.palette

  root.classList.toggle("dark", dark)
  root.classList.toggle("colorful", appearance.visualStyle === "classic" && appearance.palette !== "classic")
  root.classList.toggle("competition", appearance.visualStyle === "competition")
  root.dataset.theme = resolvedTheme
  root.dataset.baseTheme = appearance.visualStyle === "competition" ? "dark" : appearance.baseTheme
  root.dataset.style = appearance.visualStyle
  root.dataset.visualStyle = appearance.visualStyle
  root.dataset.palette = effectivePalette
  root.dataset.colorfulPalette = effectivePalette
  root.style.setProperty("--league-accent", appearance.accentColor)
  root.style.setProperty("--league-accent-contrast", getContrastColor(appearance.accentColor))
  root.style.setProperty("--app-accent", effectiveAccent)
  root.style.setProperty("--competition-accent", effectiveAccent)
  root.style.setProperty("--competition-accent-contrast", getContrastColor(effectiveAccent))
  root.style.colorScheme = resolvedTheme
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", appearance.visualStyle === "competition" ? "#0a0a0a" : dark ? "#0b1119" : "#0a0a0a")
}
