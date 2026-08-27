import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { buildMediaKitWelcomeLetter } from "@/lib/mediaKitWelcomeLetter"

const baseInput = {
  locale: "es" as const,
  leagueName: "Liga Smash & Lob",
  seasonName: "Temporada 1",
  playerCount: 12,
  totalRounds: 11,
  hasByes: false,
  registrationFee: { enabled: false, amount: 0, purpose: "" },
  scheduledStartAt: null,
  openingRoundEnabled: false,
  openingRoundAt: null,
  openingRoundLocation: null,
}

describe("v1.13.0 Media Kit welcome letter", () => {
  it("keeps the base institutional letter free of variable season features", () => {
    const letter = buildMediaKitWelcomeLetter(baseInput)

    expect(letter.title).toBe("Carta de bienvenida")
    expect(letter.bodyText).toContain("aplicación oficial de Smash & Lob")
    expect(letter.bodyText).toContain("enlace de invitación")
    expect(letter.bodyText).toContain("clasificación individual")
    expect(letter.bodyText).toContain("rotación de compañeros y rivales")
    expect(letter.bodyText).not.toMatch(/inscripci[oó]n de esta temporada/i)
    expect(letter.bodyText).not.toMatch(/Jornada de Apertura/i)
    expect(letter.bodyText).not.toMatch(/inicio de la temporada está programado/i)
    expect(letter.bodyText).not.toMatch(/jornadas de descanso/i)
  })

  it("adds only the contextual features that actually exist", () => {
    const letter = buildMediaKitWelcomeLetter({
      ...baseInput,
      playerCount: 10,
      totalRounds: 10,
      hasByes: true,
      registrationFee: { enabled: true, amount: 20, purpose: "gastos de la liga" },
      openingRoundEnabled: true,
      openingRoundAt: "2026-09-26T08:00:00.000Z",
      openingRoundLocation: "Pando",
      scheduledStartAt: "2026-09-28T08:00:00.000Z",
    })

    expect(letter.bodyText).toContain("jornadas de descanso")
    expect(letter.bodyText).toContain("20 €")
    expect(letter.bodyText).toContain("gastos de la liga")
    expect(letter.bodyText).toContain("Jornada de Apertura")
    expect(letter.bodyText).toContain("Pando")
    expect(letter.bodyText).not.toContain("El inicio de la temporada está programado")
  })

  it("uses the scheduled start only when there is no dated Opening Round", () => {
    const letter = buildMediaKitWelcomeLetter({
      ...baseInput,
      scheduledStartAt: "2026-09-28T08:00:00.000Z",
    })

    expect(letter.bodyText).toContain("El inicio de la temporada está programado")
    expect(letter.bodyText).not.toContain("Jornada de Apertura")
  })

  it("wires the premium letter preset and editable controls into Media Kit", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/admin/media-kit/page.tsx"), "utf8")
    const imageSource = fs.readFileSync(path.join(process.cwd(), "src/lib/leagueMediaKitImage.ts"), "utf8")

    expect(pageSource).toContain('welcome: "Carta de bienvenida"')
    expect(pageSource).toContain('template: "welcome_letter_premium_07"')
    expect(pageSource).toContain("Restaurar texto automático")
    expect(pageSource).toContain("setWelcomeBody")
    expect(pageSource).toContain("setWelcomeSignature")
    expect(imageSource).toContain('| "welcome_letter_premium_07"')
    expect(imageSource).toContain("drawWelcomeLetterPremium")
  })
})
