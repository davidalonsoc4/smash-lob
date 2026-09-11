import { describe, expect, it } from "vitest"
import {
  WELCOME_PACK_BAG_SEAL,
  buildWelcomePackBagSealPrintHtml,
  getWelcomePackBagSealSheetCount,
  normalizeWelcomePackAccentColor,
} from "@/lib/mediaKitWelcomePack"

describe("Media Kit Welcome Pack", () => {
  it("packs up to eight bag seals per A4 sheet", () => {
    expect(WELCOME_PACK_BAG_SEAL.itemsPerA4).toBe(8)
    expect(getWelcomePackBagSealSheetCount(0)).toBe(0)
    expect(getWelcomePackBagSealSheetCount(8)).toBe(1)
    expect(getWelcomePackBagSealSheetCount(9)).toBe(2)
  })

  it("keeps the provisional physical measurements explicit", () => {
    expect(WELCOME_PACK_BAG_SEAL.trimWidthMm).toBe(45)
    expect(WELCOME_PACK_BAG_SEAL.trimHeightMm).toBe(120)
    expect(WELCOME_PACK_BAG_SEAL.faceHeightMm).toBe(60)
    expect(WELCOME_PACK_BAG_SEAL.bleedMm).toBe(2)
  })

  it("builds one mirrored premium seal with the top face rotated", () => {
    const html = buildWelcomePackBagSealPrintHtml({
      players: [{ id: "p1", displayName: "David Alonso" }],
      leagueName: "PRO League",
      seasonName: "Temporada 1",
      logoUrl: null,
      accentColor: "#53B401",
    })

    expect(html).toContain("seal-face-top")
    expect(html).toContain(".seal-face-top { transform: rotate(180deg); }")
    expect(html).toContain(".seal-face-bottom { transform: none; }")
    expect(html).toContain("David Alonso")
    expect(html).toContain("WELCOME PACK")
    expect(html).toContain("logo-medallion")
    expect(html).toContain("background-glow")
    expect(html).toContain("background-texture")
    expect(html).toContain("--accent: #53B401")
  })

  it("normalizes the league accent", () => {
    expect(normalizeWelcomePackAccentColor("#00aaff")).toBe("#00AAFF")
    expect(normalizeWelcomePackAccentColor("invalid")).toBe("#D7A544")
  })
})
