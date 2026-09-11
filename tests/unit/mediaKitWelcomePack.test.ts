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
    expect(getWelcomePackBagSealSheetCount(16)).toBe(2)
  })

  it("keeps the provisional physical measurements explicit", () => {
    expect(WELCOME_PACK_BAG_SEAL.trimWidthMm).toBe(45)
    expect(WELCOME_PACK_BAG_SEAL.trimHeightMm).toBe(120)
    expect(WELCOME_PACK_BAG_SEAL.faceHeightMm).toBe(60)
    expect(WELCOME_PACK_BAG_SEAL.bleedMm).toBe(2)
    expect(WELCOME_PACK_BAG_SEAL.printedWidthMm).toBe(49)
    expect(WELCOME_PACK_BAG_SEAL.printedHeightMm).toBe(124)
  })

  it("builds mirrored personalized seals and escapes player text", () => {
    const html = buildWelcomePackBagSealPrintHtml({
      players: [{ id: "p1", displayName: "David <Alonso>" }],
      leagueName: "PRO League",
      seasonName: "Temporada 1",
      logoUrl: null,
      accentColor: "#53B401",
      design: "frame",
    })

    expect(html).toContain("seal-face-bottom")
    expect(html).toContain("transform: rotate(180deg)")
    expect(html).toContain("David &lt;Alonso&gt;")
    expect(html).toContain("WELCOME PACK")
    expect(html).toContain("grid-template-columns: repeat(4, 49mm)")
    expect(html).toContain("grid-template-rows: repeat(2, 124mm)")
    expect(html).toContain("--accent: #53B401")
  })

  it("falls back to the default accent when the color is invalid", () => {
    expect(normalizeWelcomePackAccentColor("#00aaff")).toBe("#00AAFF")
    expect(normalizeWelcomePackAccentColor("not-a-color")).toBe("#D7A544")
  })
})
