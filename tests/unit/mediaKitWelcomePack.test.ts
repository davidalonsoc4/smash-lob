import { describe, expect, it } from "vitest"
import {
  WELCOME_PACK_BAG_SEAL,
  WELCOME_PACK_GENERAL_FONT_OPTIONS,
  WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS,
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

  it("uses the real app icon and common Media Kit branding", () => {
    const html = buildWelcomePackBagSealPrintHtml({
      players: [{ id: "p1", displayName: "David Alonso" }],
      leagueName: "PRO League",
      seasonName: "Temporada 1",
      logoUrl: "https://example.com/logo.png",
      accentColor: "#53B401",
      showSignature: true,
    })

    expect(html).toContain('src="/icon-192.png"')
    expect(html).toContain("CREADO CON")
    expect(html).toContain("SMASH &amp; LOB")
    expect(html).toContain(".creator-icon { width: 2.6mm; height: 2.6mm;")
    expect(html).toContain(".creator-name { margin-top: .3mm; color: #f4f1ea; font-size: 1.05mm;")
    expect(html).toContain("seal-face-top { transform: rotate(180deg)")
    expect(html).toContain("seal-face-bottom { transform: none")
    expect(html).not.toContain("logo-medallion")
    expect(html).not.toContain(".seal-face::after")
  })

  it("can hide branding and customize typography", () => {
    const html = buildWelcomePackBagSealPrintHtml({
      players: [{ id: "p1", displayName: "David Alonso" }],
      leagueName: "PRO League",
      seasonName: "Temporada 1",
      accentColor: "#D7A544",
      showSignature: false,
      playerNameFont: "great-vibes",
      generalFont: "geometric",
    })

    expect(html).not.toContain("CREADO CON")
    expect(html).toContain("player-font-great-vibes")
    expect(html).toContain("general-font-geometric")
    expect(WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS.length).toBeGreaterThanOrEqual(7)
    expect(WELCOME_PACK_GENERAL_FONT_OPTIONS.length).toBeGreaterThanOrEqual(3)
  })

  it("normalizes accent", () => {
    expect(normalizeWelcomePackAccentColor("#00aaff")).toBe("#00AAFF")
    expect(normalizeWelcomePackAccentColor("invalid")).toBe("#D7A544")
  })
})
