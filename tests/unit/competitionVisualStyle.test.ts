import { describe, expect, it, vi } from "vitest"
import { readFile } from "node:fs/promises"
import {
  DEFAULT_LEAGUE_ACCENT,
  DEFAULT_PALETTE,
  DEFAULT_VISUAL_STYLE,
  getCompetitionAccentColor,
  getCompetitionContrastColor,
  COMPETITION_ACCENT_COLORS,
  isCompetitionAvailable,
  migrateStoredAppearance,
  normalizeAccentColor,
  normalizeCompetitionAccent,
  normalizeLegacyStyle,
  normalizePalette,
} from "@/lib/visualStyle"

describe("Competition visual style", () => {
  it("keeps normal-size action text above 4.5:1 for every curated accent and custom midtones", () => {
    function luminance(hex: string) {
      const channels = hex.match(/[a-f\d]{2}/gi)!.map(pair => {
        const value = parseInt(pair, 16) / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      })
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
    }
    for (const background of [...Object.values(COMPETITION_ACCENT_COLORS), "#777777", "#000000", "#FFFFFF"]) {
      const values = [luminance(background), luminance(getCompetitionContrastColor(background))].sort((a, b) => a - b)
      expect((values[1] + 0.05) / (values[0] + 0.05)).toBeGreaterThanOrEqual(4.5)
    }
  })
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

  it("opens Competition to everyone even with legacy restrictions configured", () => {
    vi.stubEnv("NEXT_PUBLIC_COMPETITION_STYLE_ENABLED", "false")
    vi.stubEnv("NEXT_PUBLIC_COMPETITION_STYLE_ALLOWED_EMAILS", "davidalonsoc4@gmail.com")
    expect(isCompetitionAvailable()).toBe(true)
    expect(isCompetitionAvailable()).toBe(true)
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
    expect(css).toContain('background: linear-gradient(110deg, rgb(var(--competition-rgb-surface) / .96), rgb(var(--competition-rgb-surface) / .72));')
    expect(css).toContain('text-transform: none;')
    expect(css).toContain('[data-route="/"] [data-season-start-countdown="hero"]')
    expect(css).toContain('min-height: calc(100dvh - 16rem) !important;')
    expect(css).toContain('border-top: 2px solid color-mix(in srgb, var(--competition-accent) 80%, transparent) !important;')
    expect(css).toContain('/* Competition v3: a more dimensional information surface.')
    expect(css).toContain('backdrop-filter: blur(18px) saturate(1.15);')
    expect(css).toContain('[data-route="/chats"] .chat-list-stack')
    expect(css).toContain('[data-route="/chats"] .chat-list-stack::before')
    expect(css).toContain('display: none;')
    expect(css).toContain('[data-route="/chats"] .chat-list-card-unread')
    expect(css).toContain('color: var(--competition-text) !important;')
    expect(css).toContain('html[data-visual-style="competition"] .bg-blue-50,')
    expect(css).toContain('html[data-visual-style="competition"] .bg-emerald-50,')
    expect(css).toContain('html[data-visual-style="competition"] .app-schedule-card {')
    expect(themeProvider).toContain('const sessionResolved = sessionStatus !== "loading"')
    expect(themeProvider).toContain('if (sessionResolved) window.localStorage.setItem(VISUAL_STYLE_STORAGE_KEY, effectiveStyle)')
    expect(publicView).toContain('public-spectator-league-title')
    expect(publicView).toContain('data-public-season-selector')
    expect(css).toContain('.public-spectator-hero {')
    expect(css).toContain('background: #111827 !important;')
    expect(publicView).toContain('public-spectator-match-card')
  })

  it("keeps scheduled registration legible on the dark Competition surface", async () => {
    const css = await readFile("src/app/globals.css", "utf8")
    const panel = await readFile("src/components/season/SeasonRegistrationPanel.tsx", "utf8")
    expect(panel).toContain("season-registration-panel")
    expect(panel).toContain("season-registration-summary")
    expect(css).toContain('html[data-visual-style="competition"] .season-registration-panel {')
    expect(css).toContain(".season-registration-owed")
    expect(css).toContain(".season-registration-panel .status-tone-green")
    expect(css).toContain(".season-registration-panel .bg-emerald-600")
  })

  it("remaps translucent neutral helper panels used by season management", async () => {
    const css = await readFile("src/app/globals.css", "utf8")
    const audit = await readFile("src/components/admin/season/BalancedCalendarAuditPanel.tsx", "utf8")
    expect(audit).toContain("rerollEyebrow")
    expect(audit).toContain("bg-neutral-50/70")
    expect(css).toContain('html[data-visual-style="competition"] .bg-neutral-50\\/70,')
    expect(css).toContain('html[data-visual-style="competition"] .bg-neutral-50\\/80,')
    expect(css).toContain('html[data-visual-style="competition"] .bg-neutral-100\\/70 {')
    expect(css).toContain("var(--competition-surface-raised)")
  })

  it("keeps chat chrome and message metadata readable for every Competition accent", async () => {
    const [css, shared] = await Promise.all([
      readFile("src/app/globals.css", "utf8"),
      readFile("src/components/match/chat/MatchChatShared.tsx", "utf8"),
    ])
    expect(shared).toContain("app-match-chat-metadata")
    expect(shared).toContain('data-mine={mine ? "true" : "false"}')
    expect(shared).toContain("app-match-chat-receipt")
    expect(shared).toContain('data-read={allRead ? "true" : "false"}')
    expect(shared).toContain("app-match-chat-send")
    expect(css).toContain('html[data-visual-style="competition"] .app-match-chat-header {')
    expect(css).toContain("border-radius: 0 !important;")
    expect(css).toContain(".app-match-chat-metadata[data-mine=\"true\"]")
    expect(css).toContain(".app-match-chat-metadata[data-mine=\"true\"] .type-caption")
    expect(css).toContain(".app-match-chat-receipt[data-read=\"true\"]")
    expect(css).toContain("var(--competition-accent-contrast) !important;")
  })

  it("keeps personal match origin labels readable on Competition surfaces", async () => {
    const [css, card] = await Promise.all([
      readFile("src/app/globals.css", "utf8"),
      readFile("src/components/personal/PersonalMatchCard.tsx", "utf8"),
    ])
    expect(card).toContain('data-personal-match-origin={match.origin}')
    expect(css).toContain('html[data-visual-style="competition"] [data-personal-match-origin] {')
    expect(css).toContain('[data-personal-match-origin="league"]')
    expect(css).toContain('[data-personal-match-origin="friendly"]')
    expect(css).toContain('color: var(--competition-accent-text, var(--competition-accent)) !important;')
    expect(css).toContain('color: var(--competition-tone-friendly-text) !important;')
  })

  it("keeps the match scope label and payment badge legible on Competition accents", async () => {
    const [matches, settings, css] = await Promise.all([
      readFile("src/app/matches/page.tsx", "utf8"),
      readFile("src/app/settings/page.tsx", "utf8"),
      readFile("src/app/globals.css", "utf8"),
    ])
    expect(matches).toContain('data-matches-scope-option')
    expect(matches).toContain('className="w-14 shrink-0 text-center type-caption font-black text-neutral-700"')
    expect(matches).toContain("matches-scope-label")
    expect(settings).toContain("settings-payment-badge")
    expect(css).toContain('.matches-scope-option[aria-current="page"] .matches-scope-label')
    expect(css).toContain('.settings-payment-badge {')
  })

  it("uses the Statistics icon pattern for settings navigation and notification groups", async () => {
    const settings = await readFile("src/app/settings/page.tsx", "utf8")
    const notifications = await readFile("src/app/settings/notifications/page.tsx", "utf8")
    const icon = await readFile("src/components/settings/SettingsSectionIcon.tsx", "utf8")
    expect(settings).toContain('icon="notifications"')
    expect(settings).toContain('icon="leagues"')
    expect(notifications).toContain("<SettingsSectionIcon name={group.icon} />")
    expect(icon).toContain("grid h-8 w-8 place-items-center rounded-xl bg-neutral-100 text-neutral-700")
  })
})
