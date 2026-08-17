import { readFile, stat } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.2 opening-day Premium 01 art rework", () => {
  it("ships a real 4:5 art base plus a separate accent mask", async () => {
    const [base, mask] = await Promise.all([
      stat("public/media-kit/opening-day-premium-01-base.webp"),
      stat("public/media-kit/opening-day-premium-01-accent.png"),
    ])
    expect(base.size).toBeGreaterThan(20_000)
    expect(mask.size).toBeGreaterThan(20_000)
  })

  it("loads the art assets and recolors the mask instead of procedurally drawing the whole poster", async () => {
    const image = await read("src/lib/leagueMediaKitImage.ts")
    expect(image).toContain('OPENING_BASE_ASSET = "/media-kit/opening-day-premium-01-base.webp"')
    expect(image).toContain('OPENING_ACCENT_MASK_ASSET = "/media-kit/opening-day-premium-01-accent.png"')
    expect(image).toContain("tintMask")
    expect(image).toContain('globalCompositeOperation="screen"')
    expect(image).toContain("await drawOpeningDayBackground(ctx,accent)")
  })

  it("keeps league branding and variable event copy above the artistic background", async () => {
    const [page, image] = await Promise.all([
      read("src/app/admin/media-kit/page.tsx"),
      read("src/lib/leagueMediaKitImage.ts"),
    ])
    expect(page).toContain("openingLogoOverride ?? activeLeague.logoUrl")
    expect(page).toContain("logo y datos reales de esta liga")
    expect(image).toContain("data.leagueLogoUrl")
    expect(image).toContain("data.seasonName")
    expect(image).toContain("data.eventDateLabel")
    expect(image).toContain("venueLines")
  })

  it("keeps the export at 1080x1350 and uses the accent in the artistic mask and headline", async () => {
    const image = await read("src/lib/leagueMediaKitImage.ts")
    expect(image).toContain("const WIDTH = 1080")
    expect(image).toContain("const HEIGHT = 1350")
    expect(image).toContain("metallicPosterText")
    expect(image).toContain("normalizeAccent(data.accentColor)")
  })
})
