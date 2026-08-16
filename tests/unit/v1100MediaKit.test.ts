import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.0 league media kit", () => {
  it("adds a dedicated admin diffusion module with the five agreed pieces", async () => {
    const [admin, page] = await Promise.all([
      read("src/app/admin/page.tsx"),
      read("src/app/admin/media-kit/page.tsx"),
    ])

    expect(admin).toContain('href="/admin/media-kit"')
    expect(admin).toContain("Centro de difusión")
    for (const title of ["Reglas de la liga", "Inscripciones", "Calendario", "Inicio de liga", "Cuenta atrás"]) {
      expect(page).toContain(title)
    }
    expect(page).toContain("activeLeague.inviteCode")
    expect(page).toContain("roundSettings.registrationFee")
    expect(page).toContain("formatShortDate(round.startsAt)")
  })

  it("generates a branded 4:5 PNG and keeps native share with download fallback", async () => {
    const [page, image] = await Promise.all([
      read("src/app/admin/media-kit/page.tsx"),
      read("src/lib/leagueMediaKitImage.ts"),
    ])

    expect(image).toContain("const WIDTH = 1080")
    expect(image).toContain("const HEIGHT = 1350")
    expect(image).toContain('"Creado con Smash & Lob"')
    expect(image).toContain('"smashandlob.com"')
    expect(image).toContain("leagueLogoUrl")
    expect(page).toContain("navigator.canShare?.({ files: [file] })")
    expect(page).toContain("downloadLeagueMediaKitImage(blob, filename)")
  })

  it("limits countdown sharing to seasons that actually have a scheduled start", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")
    expect(page).toContain('disabled: !roundSettings.scheduledStartAt')
    expect(page).toContain('disabled ? "Configura fecha de inicio"')
  })
})
