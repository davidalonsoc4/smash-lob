export type BaseTheme = "light" | "dark" | "system"

export type VisualStyle = "classic" | "competition"

export type Palette =
  | "classic"
  | "indigo"
  | "midnight"
  | "sage"
  | "burgundy"
  | "graphite"
  | "league"

export type StoredVisualStyle = "classic" | "competition" | "plain" | "colorful"
export type CompetitionAccent = "league" | "gold" | "blue" | "green" | "coral" | "violet" | "ice"

export const VISUAL_STYLE_STORAGE_KEY = "smash-lob-visual-style"
export const COMPETITION_ACCENT_STORAGE_KEY = "smash-lob-competition-accent"
export const APPEARANCE_PREFERENCE_STORAGE_KEY = "smash-lob-appearance-preference-set"
export const BASE_THEME_STORAGE_KEY = "smash-lob-theme-mode"
export const LEGACY_THEME_STORAGE_KEY = "smash-lob-theme"
export const PALETTE_STORAGE_KEY = "smash-lob-palette"
export const LEGACY_PALETTE_STORAGE_KEY = "smash-lob-colorful-palette"

export const DEFAULT_BASE_THEME: BaseTheme = "light"
export const DEFAULT_VISUAL_STYLE: VisualStyle = "classic"
export const DEFAULT_PALETTE: Palette = "classic"
export const DEFAULT_LEAGUE_ACCENT = "#D7A544"
export const DEFAULT_COMPETITION_ACCENT: CompetitionAccent = "league"
export const DEFAULT_COMPETITION_STYLE_ALLOWED_EMAILS = ["davidalonsoc4@gmail.com"] as const

export const COMPETITION_ACCENT_COLORS: Record<Exclude<CompetitionAccent, "league">, string> = {
  gold: "#D7A544",
  blue: "#477BD1",
  green: "#3D9D86",
  coral: "#D4643C",
  violet: "#8B5FC0",
  ice: "#53B4D1",
}

export const CLASSIC_PALETTES: Palette[] = [
  "classic",
  "indigo",
  "midnight",
  "sage",
  "burgundy",
  "graphite",
]

export const PALETTE_COLORS: Record<Exclude<Palette, "league">, string[]> = {
  classic: ["#111827", "#334155", "#94a3b8", "#e2e8f0"],
  indigo: ["#5b5ce2", "#7c4dff", "#e94b9b", "#f2a93b"],
  midnight: ["#365f9d", "#5a78b5", "#87b5df", "#d6a45a"],
  sage: ["#55765f", "#7f9b83", "#a6b99d", "#c39a62"],
  burgundy: ["#8b3f57", "#a85c70", "#d2a2ad", "#c29572"],
  graphite: ["#4f6379", "#71879b", "#a7c5d8", "#c2a36d"],
}

export const PALETTE_PRIMARY_COLORS: Record<Exclude<Palette, "league">, { light: string; dark: string }> = {
  classic: { light: "#111827", dark: "#dbe6f3" },
  indigo: { light: "#5b5ce2", dark: "#17172e" },
  midnight: { light: "#365f9d", dark: "#0d1726" },
  sage: { light: "#55765f", dark: "#101b15" },
  burgundy: { light: "#8b3f57", dark: "#241219" },
  graphite: { light: "#4f6379", dark: "#121820" },
}

export function isBaseTheme(value: string | null): value is BaseTheme {
  return value === "light" || value === "dark" || value === "system"
}

export function isVisualStyle(value: string | null): value is VisualStyle {
  return value === "classic" || value === "competition"
}

export function normalizePalette(value: string | null): Palette | null {
  if (value === "classic" || value === "indigo" || value === "midnight" || value === "sage" || value === "burgundy" || value === "graphite" || value === "league") {
    return value
  }

  const legacyPaletteMap: Record<string, Palette> = {
    ocean: "midnight",
    emerald: "sage",
    coral: "burgundy",
    sunset: "graphite",
    terracotta: "graphite",
  }

  return value ? legacyPaletteMap[value] ?? null : null
}

export function normalizeLegacyStyle(value: string | null): VisualStyle | null {
  if (value === "plain" || value === "classic") return "classic"
  if (value === "competition") return "competition"
  if (value === "colorful") return "classic"
  return null
}

export function normalizeAccentColor(value: unknown, fallback = DEFAULT_LEAGUE_ACCENT) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim())
    ? value.trim().toUpperCase()
    : fallback
}

export function isCompetitionAccent(value: string | null): value is CompetitionAccent {
  return value === "league" || value === "gold" || value === "blue" || value === "green" || value === "coral" || value === "violet" || value === "ice"
}

export function normalizeCompetitionAccent(value: string | null): CompetitionAccent {
  return isCompetitionAccent(value) ? value : DEFAULT_COMPETITION_ACCENT
}

export function getCompetitionAccentColor(choice: CompetitionAccent, leagueAccent = DEFAULT_LEAGUE_ACCENT) {
  return choice === "league" ? normalizeAccentColor(leagueAccent) : COMPETITION_ACCENT_COLORS[choice]
}

export function getContrastColor(value: string) {
  const accent = normalizeAccentColor(value)
  const red = Number.parseInt(accent.slice(1, 3), 16)
  const green = Number.parseInt(accent.slice(3, 5), 16)
  const blue = Number.parseInt(accent.slice(5, 7), 16)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  return luminance > 0.58 ? "#111111" : "#FFFFFF"
}

function getCompetitionStyleAllowedEmails() {
  const configured = process.env.NEXT_PUBLIC_COMPETITION_STYLE_ALLOWED_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return configured?.length ? configured : [...DEFAULT_COMPETITION_STYLE_ALLOWED_EMAILS]
}

export function isCompetitionAvailable(email?: string | null) {
  if (process.env.NEXT_PUBLIC_COMPETITION_STYLE_ENABLED === "false") return false
  const normalizedEmail = email?.trim().toLowerCase()
  return Boolean(normalizedEmail && getCompetitionStyleAllowedEmails().includes(normalizedEmail))
}

export function migrateStoredAppearance(input: {
  baseTheme: string | null
  visualStyle: string | null
  palette: string | null
  legacyTheme: string | null
  legacyPalette: string | null
}) {
  const baseTheme = isBaseTheme(input.baseTheme)
    ? input.baseTheme
    : isBaseTheme(input.legacyTheme)
      ? input.legacyTheme
      : DEFAULT_BASE_THEME
  const visualStyle = normalizeLegacyStyle(input.visualStyle) ?? normalizeLegacyStyle(input.legacyTheme) ?? DEFAULT_VISUAL_STYLE
  const palette = normalizePalette(input.palette) ?? normalizePalette(input.legacyPalette) ?? (input.visualStyle === "plain" || input.legacyTheme === "light" || input.legacyTheme === "dark" || input.legacyTheme === "system" ? "classic" : DEFAULT_PALETTE)

  return {
    baseTheme,
    visualStyle,
    palette,
  } satisfies { baseTheme: BaseTheme; visualStyle: VisualStyle; palette: Palette }
}
