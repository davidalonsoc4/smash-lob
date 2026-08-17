import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.3 media kit typography and fixed app signature", () => {
  it("replaces the editable footer with the app signature used by season exports", async () => {
    const [page, image] = await Promise.all([
      read("src/app/admin/media-kit/page.tsx"),
      read("src/lib/leagueMediaKitImage.ts"),
    ])

    expect(page).not.toContain("openingFooter")
    expect(page).not.toContain("Firma inferior")
    expect(image).toContain('APP_ICON_PATH = "/icon-192.png"')
    expect(image).toContain('"CREADO CON"')
    expect(image).toContain('"SMASH & LOB"')
    expect(image).toContain("drawAppBrandFooter")
  })

  it("offers four genuinely different headline treatments and carries the choice into the PNG", async () => {
    const [page, image] = await Promise.all([
      read("src/app/admin/media-kit/page.tsx"),
      read("src/lib/leagueMediaKitImage.ts"),
    ])

    for (const option of ["Impacto", "Condensada", "Editorial", "Atlética"]) expect(page).toContain(option)
    expect(page).toContain("openingHeadlineFont")
    expect(page).toContain("Diseño del titular")
    expect(image).toContain("HEADLINE_FONT_PROFILES")
    expect(image).toContain('headlineFont ?? "impact"')
    expect(image).toContain("profile.slant")
    expect(image).toContain("profile.widthScale")
  })
})
