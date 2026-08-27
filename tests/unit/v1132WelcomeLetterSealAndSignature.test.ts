import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { buildMediaKitWelcomeLetter } from "@/lib/mediaKitWelcomeLetter"
import {
  WELCOME_LOGO_STYLE_OPTIONS,
  WELCOME_SIGNATURE_FONT_OPTIONS,
} from "@/lib/leagueMediaKitImage"

const baseInput = {
  locale: "es" as const,
  leagueName: "Liga Smash & Lob",
  seasonName: "Temporada 1",
  playerCount: 8,
  totalRounds: 7,
  hasByes: false,
  registrationFee: { enabled: false, amount: 0, purpose: "" },
  scheduledStartAt: null,
  openingRoundEnabled: false,
  openingRoundAt: null,
  openingRoundLocation: null,
}

describe("v1.13.2 welcome letter seal, signature and paragraph closure", () => {
  it("separates the institutional opening and final welcome into their own paragraphs", () => {
    const letter = buildMediaKitWelcomeLetter(baseInput)
    expect(letter.bodyText).toContain("Liga Smash & Lob.\n\nDesde este momento")
    expect(letter.bodyText).toContain("disfrutes de la competición.\n\nBienvenido a Smash & Lob.")
  })

  it("keeps clean and ink stamp treatments available", () => {
    expect(WELCOME_LOGO_STYLE_OPTIONS.map((option) => option.id)).toEqual(expect.arrayContaining([
      "clean_stamp",
      "ink_stamp",
    ]))
  })

  it("offers a classic signature plus three premium handwritten signatures", () => {
    expect(WELCOME_SIGNATURE_FONT_OPTIONS.map((option) => option.id)).toEqual([
      "classic",
      "allura",
      "petit_formal",
      "great_vibes",
    ])
  })

  it("renders the stamp in blue ink and loads the handwritten font families", () => {
    const imageSource = fs.readFileSync(path.join(process.cwd(), "src/lib/leagueMediaKitImage.ts"), "utf8")
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/admin/media-kit/page.tsx"), "utf8")

    expect(imageSource).toContain('WELCOME_STAMP_INK_CLEAN = "#2f7bbf"')
    expect(imageSource).toContain('WELCOME_STAMP_INK_TINTA = "#296ead"')
    expect(imageSource).toContain("drawWelcomeLogoStamp")
    expect(imageSource).toContain("createInkLogo")
    expect(imageSource).toContain("family=Allura")
    expect(imageSource).toContain("family=Great+Vibes")
    expect(imageSource).toContain("family=Petit+Formal+Script")
    expect(pageSource).toContain('useState<LeagueMediaKitWelcomeLogoStyle>("clean_stamp")')
    expect(pageSource).toContain('useState<LeagueMediaKitWelcomeSignatureFont>("allura")')
  })
})
