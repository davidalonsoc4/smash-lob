import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.1 premium opening-day media kit", () => {
  it("turns opening day into an editable Premium 01 template in the app", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")

    expect(page).toContain('opening: "Apertura"')
    expect(page).toContain('useState("Apertura")')
    expect(page).toContain("Premium 01 · 4:5")
    expect(page).toContain('template: "opening_day_premium_01"')
    for (const field of ["openingTitle", "openingSubtitle", "openingDate", "openingTime", "openingVenue", "openingRound"]) {
      expect(page).toContain(field)
    }
    expect(page).toContain("Vista previa")
    expect(page).toContain(': "Compartir"}</button>')
  })

  it("uses the league logo by default and supports a temporary logo override", async () => {
    const [page, image] = await Promise.all([
      read("src/app/admin/media-kit/page.tsx"),
      read("src/lib/leagueMediaKitImage.ts"),
    ])

    expect(page).toContain("openingLogoOverride ?? activeLeague.logoUrl")
    expect(page).toContain('accept="image/*"')
    expect(page).toContain(">Restaurar</button>")
    expect(page).toContain("Logo de liga")
    expect(image).toContain('/^(data:|blob:)/i.test(raw)')
    expect(image).toContain("drawImageContain")
  })

  it("recolors the premium composition and keeps the export in 1080x1350", async () => {
    const [page, image] = await Promise.all([
      read("src/app/admin/media-kit/page.tsx"),
      read("src/lib/leagueMediaKitImage.ts"),
    ])

    expect(page).toContain("openingAccentOptions")
    expect(page).toContain('type="color"')
    expect(page).toContain("Color de acento")
    expect(image).toContain('const WIDTH = 1080')
    expect(image).toContain('const HEIGHT = 1350')
    expect(image).toContain("drawOpeningDayBackground")
    expect(image).toContain("accentColor")
    expect(image).toContain('data.template === "opening_day_premium_01"')
  })

  it("prefills event timing in the same Madrid timezone used by scheduled seasons", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")

    expect(page).toContain("SCHEDULED_SEASON_TIME_ZONE")
    expect(page).toContain("firstOpeningMatch?.scheduledAt ?? roundSettings.scheduledStartAt")
    expect(page).toContain('timeZone: SCHEDULED_SEASON_TIME_ZONE')
  })
})
