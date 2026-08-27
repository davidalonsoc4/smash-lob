import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { buildMediaKitWelcomeLetter } from "@/lib/mediaKitWelcomeLetter"
import { WELCOME_LETTER_FONT_OPTIONS } from "@/lib/leagueMediaKitImage"

const input = {
  locale: "es" as const,
  leagueName: "Liga Smash & Lob",
  seasonName: "Temporada 1",
  playerCount: 11,
  totalRounds: 13,
  hasByes: true,
  registrationFee: { enabled: false, amount: 0, purpose: "" },
  scheduledStartAt: null,
  openingRoundEnabled: false,
  openingRoundAt: null,
  openingRoundLocation: null,
}

describe("v1.13.1 welcome letter paragraphs and typography", () => {
  it("keeps automatic letter blocks separated by blank lines", () => {
    const letter = buildMediaKitWelcomeLetter(input)
    const paragraphs = letter.bodyText.split(/\n\s*\n/).filter(Boolean)

    expect(paragraphs.length).toBeGreaterThanOrEqual(5)
    expect(letter.bodyText).toContain("\n\n")
  })

  it("renders paragraph breaks as a full line and preserves manual line breaks", () => {
    const imageSource = fs.readFileSync(path.join(process.cwd(), "src/lib/leagueMediaKitImage.ts"), "utf8")

    expect(imageSource).toContain('replace(/\\r\\n?/g, "\\n").split(/\\n{2,}/)')
    expect(imageSource).toContain('paragraph.split("\\n")')
    expect(imageSource).toContain("breaks * lineHeight")
    expect(imageSource).toContain("if (line.paragraphBreak) bodyY += chosenLineHeight")
    expect(imageSource).not.toContain("paragraphGap = 14")
  })

  it("offers the four premium letter typography presets", () => {
    expect(WELCOME_LETTER_FONT_OPTIONS.map((option) => option.id)).toEqual([
      "club_classic",
      "editorial_luxury",
      "baskerville",
      "lora",
    ])
  })

  it("loads the recommended Google Fonts only for the welcome renderer and keeps serif fallbacks", () => {
    const imageSource = fs.readFileSync(path.join(process.cwd(), "src/lib/leagueMediaKitImage.ts"), "utf8")

    expect(imageSource).toContain("fonts.googleapis.com/css2")
    expect(imageSource).toContain("Cormorant+Garamond")
    expect(imageSource).toContain("Libre+Baskerville")
    expect(imageSource).toContain("Instrument+Serif")
    expect(imageSource).toContain("family=Lora")
    expect(imageSource).toContain('await ensureWelcomeLetterFonts()')
    expect(imageSource).toContain('Georgia, "Times New Roman", serif')
  })
})
