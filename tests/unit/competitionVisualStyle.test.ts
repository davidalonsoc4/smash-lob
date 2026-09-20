import { describe, expect, it, vi } from "vitest"
import { readFile } from "node:fs/promises"
import {
  DEFAULT_LEAGUE_ACCENT,
  DEFAULT_PALETTE,
  DEFAULT_VISUAL_STYLE,
  getCompetitionAccentColor,
  isCompetitionAvailable,
  migrateStoredAppearance,
  normalizeAccentColor,
  normalizeCompetitionAccent,
  normalizeLegacyStyle,
  normalizePalette,
} from "@/lib/visualStyle"

describe("Competition visual style", () => {
  it("uses Classic as the safe default", () => {
    expect(DEFAULT_VISUAL_STYLE).toBe("classic")
    expect(DEFAULT_PALETTE).toBe("classic")
    expect(migrateStoredAppearance({ baseTheme: null, visualStyle: null, palette: null, legacyTheme: null, legacyPalette: null }).visualStyle).toBe("classic")
  })

  it("migrates the previous appearance values without retaining removed palettes", () => {
    expect(normalizeLegacyStyle("plain")).toBe("classic")
    expect(normalizeLegacyStyle("colorful")).toBe("classic")
    expect(normalizePalette("terracotta")).toBe("graphite")
    expect(normalizePalette("ocean")).toBe("midnight")
    expect(migrateStoredAppearance({ baseTheme: null, visualStyle: "competition", palette: "terracotta", legacyTheme: null, legacyPalette: null })).toEqual({
      baseTheme: "light",
      visualStyle: "competition",
      palette: "graphite",
    })
  })

  it("normalizes persisted league accents to safe six digit hex", () => {
    expect(normalizeAccentColor("#abc")).toBe(DEFAULT_LEAGUE_ACCENT)
    expect(normalizeAccentColor("#abcdef")).toBe("#ABCDEF")
    expect(normalizeAccentColor(null)).toBe(DEFAULT_LEAGUE_ACCENT)
  })

  it("supports curated Competition accents and the league-derived option", () => {
    expect(normalizeCompetitionAccent("blue")).toBe("blue")
    expect(normalizeCompetitionAccent("unknown")).toBe("league")
    expect(getCompetitionAccentColor("blue", "#123456")).toBe("#477BD1")
    expect(getCompetitionAccentColor("league", "#123456")).toBe("#123456")
  })

  it("allows Competition outside local development only for the configured email", () => {
    vi.stubEnv("NEXT_PUBLIC_COMPETITION_STYLE_ENABLED", "true")
    vi.stubEnv("NEXT_PUBLIC_COMPETITION_STYLE_ALLOWED_EMAILS", "davidalonsoc4@gmail.com")
    expect(isCompetitionAvailable("DAVIDALONSOc4@GMAIL.COM")).toBe(true)
    expect(isCompetitionAvailable("other@example.com")).toBe(false)
    vi.unstubAllEnvs()
  })

  it("keeps page titles inside a shared Competition panel without changing Classic", async () => {
    const css = await readFile("src/app/globals.css", "utf8")
    const themeProvider = await readFile("src/context/ThemeProvider.tsx", "utf8")
    const publicView = await readFile("src/components/spectator/PublicSpectatorView.tsx", "utf8")
    expect(css).toContain('html[data-visual-style="competition"] .app-page-header {')
    expect(css).toContain('background-image: none !important;')
    expect(css).toContain('html[data-visual-style="competition"] .app-shell-frame::before {')
    expect(css).toContain('border-left: .25rem solid var(--competition-accent);')
    expect(css).toContain('background: linear-gradient(110deg, rgb(20 21 24 / .96), rgb(20 21 24 / .72));')
    expect(css).toContain('text-transform: none;')
    expect(css).toContain('border-top: 2px solid color-mix(in srgb, var(--competition-accent) 80%, transparent) !important;')
    expect(css).toContain('/* Competition v3: a more dimensional information surface.')
    expect(css).toContain('backdrop-filter: blur(18px) saturate(1.15);')
    expect(css).toContain('[data-route="/chats"] .chat-list-stack')
    expect(css).toContain('[data-route="/chats"] .chat-list-stack::before')
    expect(css).toContain('display: none;')
    expect(css).toContain('[data-route="/chats"] .chat-list-card-unread')
    expect(css).toContain('color: var(--competition-text) !important;')
    expect(themeProvider).toContain('const sessionResolved = sessionStatus !== "loading"')
    expect(themeProvider).toContain('if (sessionResolved) window.localStorage.setItem(VISUAL_STYLE_STORAGE_KEY, effectiveStyle)')
    expect(publicView).toContain('public-spectator-league-title')
    expect(publicView).toContain('data-public-season-selector')
    expect(css).toContain('.public-spectator-hero {')
    expect(css).toContain('background: #111827 !important;')
    expect(publicView).toContain('public-spectator-match-card')
  })
})
