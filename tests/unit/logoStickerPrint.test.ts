import { describe, expect, it } from "vitest"
import { buildLogoStickerPrintHtml, getLogoStickerLayout } from "@/lib/logoStickerPrint"

describe("logo sticker print layout", () => {
  it("chooses the more efficient A4 orientation for the selected width", () => {
    const layout = getLogoStickerLayout(80, 0.8, 8)

    expect(layout.orientation).toBe("landscape")
    expect(layout.sheetCount).toBe(2)
    expect(layout.itemsPerSheet).toBeGreaterThanOrEqual(4)
  })

  it("keeps the player minimum and fills the remaining slots with 50 mm logos", () => {
    const html = buildLogoStickerPrintHtml({
      logoUrl: "https://example.com/logo.svg",
      leagueName: "Liga Demo",
      widthMm: 80,
      stickerCount: 3,
      aspectRatio: 0.8,
    })

    expect(html.match(/class="sticker-image sticker-image-main/g)?.length).toBe(3)
    expect(html).toContain("sticker-image-extra")
    expect(html).toContain("width: 50mm")
    expect(html).toContain("A4 horizontal")
  })
})
