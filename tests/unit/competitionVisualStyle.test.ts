import { describe, expect, it } from "vitest"
import {
  DEFAULT_LEAGUE_ACCENT,
  DEFAULT_PALETTE,
  DEFAULT_VISUAL_STYLE,
  migrateStoredAppearance,
  normalizeAccentColor,
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
})
