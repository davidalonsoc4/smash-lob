import { describe, expect, it } from "vitest"
import { translateLeagueText } from "@/i18n/leagueText"
import { WELCOME_PACK_GENERAL_FONT_OPTIONS, WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS } from "@/lib/mediaKitWelcomePack"

describe("Welcome Pack translations", () => {
  it.each(["en", "eu"] as const)("translates print controls and font descriptions in %s", (locale) => {
    const sources = [
      "Generar PDF / imprimir",
      "Precinto de bolsa",
      "Fajín del overgrip",
      ...WELCOME_PACK_GENERAL_FONT_OPTIONS.map((option) => option.description),
      ...WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS.map((option) => option.description),
    ]
    for (const source of sources) expect(translateLeagueText(locale, source)).not.toBe(source)
  })

  it("preserves physical dimensions while translating the complete sentence", () => {
    const source = "El fajín mide 120 × 18 mm. Reservamos 10 mm en cada lateral para el pegado; el área útil central para el diseño es de 100 mm."
    expect(translateLeagueText("en", source)).toBe("The band measures 120 × 18 mm. We reserve 10 mm on each side for gluing; the central design area is 100 mm wide.")
    expect(translateLeagueText("eu", source)).toBe("Zerrendak 120 × 18 mm neurtzen du. Alde bakoitzean 10 mm uzten dira itsasteko; diseinuaren erdiko eremuak 100 mm ditu.")
    expect(translateLeagueText("es", source)).toBe(source)
  })
})
