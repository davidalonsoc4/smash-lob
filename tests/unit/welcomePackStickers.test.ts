import { describe, expect, it } from "vitest"
import {
  buildWelcomePackStickerPrintHtml,
  canFitWelcomePackStickersOnOneSheet,
  getMaxWelcomePackStickerWidthMm,
  getWelcomePackStickerLayout,
  WELCOME_PACK_STICKER_ARTWORKS,
  WELCOME_PACK_STICKER_A4,
} from "@/lib/welcomePackStickers"

const allIds = WELCOME_PACK_STICKER_ARTWORKS.map(({ id }) => id)

describe("Welcome Pack sticker sheet", () => {
  it("fits every selected artwork on one A4 sheet at the calculated maximum width", () => {
    const maximum = getMaxWelcomePackStickerWidthMm(allIds)
    const layout = getWelcomePackStickerLayout({ ids: allIds, stickerWidthMm: maximum, logoUrl: null, leagueName: "Liga" })

    expect(maximum).toBeGreaterThan(0)
    expect(canFitWelcomePackStickersOnOneSheet(allIds, maximum)).toBe(true)
    expect(canFitWelcomePackStickersOnOneSheet(allIds, maximum + 1)).toBe(false)
    expect(layout?.stickerWidthMm).toBe(maximum)
    expect(layout?.artworkCount).toBe(allIds.length)
    expect(layout?.placements.filter(({ kind }) => kind === "artwork")).toHaveLength(allIds.length)
    expect(layout?.printableArea.xMm).toBe(5)
    expect(layout?.printableArea.yMm).toBe(5)
    expect(layout && layout.page.widthMm * layout.page.heightMm).toBe(WELCOME_PACK_STICKER_A4.widthMm * WELCOME_PACK_STICKER_A4.heightMm)
  })

  it("keeps selected designs within the printable area without internal gaps", () => {
    const ids = allIds.slice(0, 4)
    const layout = getWelcomePackStickerLayout({ ids, stickerWidthMm: 40, logoUrl: null, leagueName: "Liga" })
    const artworks = layout!.placements.filter(({ kind }) => kind === "artwork")

    expect(artworks).toHaveLength(ids.length)
    for (const item of artworks) {
      expect(item.xMm).toBeGreaterThanOrEqual(layout!.printableArea.xMm)
      expect(item.yMm).toBeGreaterThanOrEqual(layout!.printableArea.yMm)
      expect(item.xMm + item.widthMm).toBeLessThanOrEqual(layout!.printableArea.xMm + layout!.printableArea.widthMm + 0.001)
      expect(item.yMm + item.heightMm).toBeLessThanOrEqual(layout!.printableArea.yMm + layout!.printableArea.heightMm + 0.001)
    }
    for (let first = 0; first < artworks.length; first += 1) {
      for (let second = first + 1; second < artworks.length; second += 1) {
        const a = artworks[first]
        const b = artworks[second]
        const overlaps = a.xMm < b.xMm + b.widthMm - 0.001 && a.xMm + a.widthMm > b.xMm + 0.001 && a.yMm < b.yMm + b.heightMm - 0.001 && a.yMm + a.heightMm > b.yMm + 0.001
        expect(overlaps).toBe(false)
      }
    }
  })

  it("fills free space with logos no wider than 50 mm and keeps them clear of artwork", () => {
    const layout = getWelcomePackStickerLayout({ ids: allIds, stickerWidthMm: 30, logoUrl: "/league.svg", leagueName: "Liga", logoAspectRatio: 1.5 })!
    const artworks = layout.placements.filter(({ kind }) => kind === "artwork")
    const logos = layout.placements.filter(({ kind }) => kind === "league-logo")

    expect(logos.length).toBeGreaterThan(0)
    for (const logo of logos) {
      expect(logo.widthMm).toBeLessThanOrEqual(50)
      expect(logo.xMm + logo.widthMm).toBeLessThanOrEqual(layout.printableArea.xMm + layout.printableArea.widthMm + 0.001)
      expect(logo.yMm + logo.heightMm).toBeLessThanOrEqual(layout.printableArea.yMm + layout.printableArea.heightMm + 0.001)
      for (const artwork of artworks) {
        const overlaps = logo.xMm < artwork.xMm + artwork.widthMm - 0.001 && logo.xMm + logo.widthMm > artwork.xMm + 0.001 && logo.yMm < artwork.yMm + artwork.heightMm - 0.001 && logo.yMm + logo.heightMm > artwork.yMm + 0.001
        expect(overlaps).toBe(false)
      }
    }
    for (let first = 0; first < logos.length; first += 1) {
      for (let second = first + 1; second < logos.length; second += 1) {
        const a = logos[first]
        const b = logos[second]
        const overlaps = a.xMm < b.xMm + b.widthMm - 0.001 && a.xMm + a.widthMm > b.xMm + 0.001 && a.yMm < b.yMm + b.heightMm - 0.001 && a.yMm + a.heightMm > b.yMm + 0.001
        expect(overlaps).toBe(false)
      }
    }
  })

  it("repeats each selected design the requested number of times and fills leftover space with league logos", () => {
    const copiesPerDesign = 3
    const layout = getWelcomePackStickerLayout({
      ids: allIds,
      stickerWidthMm: 25,
      copiesPerDesign,
      logoUrl: "/league.svg",
      leagueName: "Liga",
      logoAspectRatio: 1.5,
    })!
    const artworks = layout.placements.filter(({ kind }) => kind === "artwork")
    const html = buildWelcomePackStickerPrintHtml({ layout, leagueName: "Liga" })

    expect(layout.copiesPerDesign).toBe(copiesPerDesign)
    expect(layout.maxStickerWidthMm).toBe(getMaxWelcomePackStickerWidthMm(allIds, copiesPerDesign))
    expect(canFitWelcomePackStickersOnOneSheet(allIds, layout.maxStickerWidthMm, copiesPerDesign)).toBe(true)
    expect(canFitWelcomePackStickersOnOneSheet(allIds, layout.maxStickerWidthMm + 1, copiesPerDesign)).toBe(false)
    expect(artworks).toHaveLength(allIds.length * copiesPerDesign)
    for (const id of allIds) expect(artworks.filter(({ id: placementId }) => placementId.startsWith(`${id}-copy-`))).toHaveLength(copiesPerDesign)
    expect(layout.logoCount).toBeGreaterThan(0)
    expect(html.match(/class="league-logo-sticker"/g)).toHaveLength(layout.logoCount)
    expect(html).toContain("3 copias por diseño")
  })

  it("builds one transparent-artwork A4 print sheet with the selected orientation", () => {
    const layout = getWelcomePackStickerLayout({ ids: allIds, stickerWidthMm: 35, logoUrl: null, leagueName: "Liga Demo" })!
    const html = buildWelcomePackStickerPrintHtml({ layout, leagueName: "Liga Demo" })

    expect(html).toContain(`@page { size: A4 ${layout.orientation}; margin: 0; }`)
    expect(html).toContain("/media-kit/stickers/padel-lovers.png")
    expect(html).toContain("sin separación interior")
    expect(html.match(/<section class="sheet"/g)).toHaveLength(1)
  })

  it("uses the matching white artwork variant when white ink is selected", () => {
    const gray = getWelcomePackStickerLayout({ ids: [allIds[0]], stickerWidthMm: 40, logoUrl: null, leagueName: "Liga" })!
    const white = getWelcomePackStickerLayout({ ids: [allIds[0]], stickerWidthMm: 40, logoUrl: null, leagueName: "Liga", ink: "white" })!

    expect(gray.placements.find(({ kind }) => kind === "artwork")?.src).toBe(WELCOME_PACK_STICKER_ARTWORKS[0].src)
    expect(white.placements.find(({ kind }) => kind === "artwork")?.src).toBe(WELCOME_PACK_STICKER_ARTWORKS[0].whiteSrc)
  })
})
