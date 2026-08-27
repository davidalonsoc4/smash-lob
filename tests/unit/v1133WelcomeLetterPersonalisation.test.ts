import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { buildMediaKitWelcomeLetter } from "@/lib/mediaKitWelcomeLetter"
import { WELCOME_LOGO_STYLE_OPTIONS } from "@/lib/leagueMediaKitImage"

const baseInput = {
  locale: "es" as const,
  leagueName: "Liga Norte",
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

describe("v1.13.3 personalised welcome letter", () => {
  it("uses recipient name and masculine/feminine wording in the automatic Spanish letter", () => {
    const masculine = buildMediaKitWelcomeLetter({ ...baseInput, recipientName: "David", recipientGender: "masculine" })
    const feminine = buildMediaKitWelcomeLetter({ ...baseInput, recipientName: "María", recipientGender: "feminine" })

    expect(masculine.bodyText).toContain("Liga Norte, David.")
    expect(masculine.bodyText).toContain("Bienvenido a Smash & Lob.")
    expect(masculine.bodyText).not.toContain("Bienvenido a Smash & Lob, David.")
    expect(feminine.bodyText).toContain("Liga Norte, María.")
    expect(feminine.bodyText).toContain("Bienvenida a Smash & Lob.")
    expect(feminine.bodyText).not.toContain("Bienvenida a Smash & Lob, María.")
  })

  it("uses the league name in the automatic signature", () => {
    expect(buildMediaKitWelcomeLetter(baseInput).signature).toBe("Organización de Liga Norte")
  })

  it("offers no seal, clean stamp and ink stamp", () => {
    expect(WELCOME_LOGO_STYLE_OPTIONS.map((option) => option.id)).toEqual([
      "none",
      "clean_stamp",
      "ink_stamp",
    ])
  })

  it("keeps the header logo normal and renders the optional stamp beside the signature", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/lib/leagueMediaKitImage.ts"), "utf8")
    expect(source).toContain("if (headerLogo) drawImageContain(ctx, headerLogo, 74, 75, 98, 82)")
    expect(source).toContain('if (logo && sealStyle !== "none")')
    expect(source).toContain("drawWelcomeLogoStamp(ctx, logo, stampX, stampY, WELCOME_STAMP_SIZE, sealStyle, randomWelcomeStampRotation())")
  })

  it("exposes recipient name and gender controls in the media kit editor", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/app/admin/media-kit/page.tsx"), "utf8")
    expect(source).toContain('welcomeRecipientName')
    expect(source).toContain('welcomeRecipientGender')
    expect(source).toContain('tx("Masculino")')
    expect(source).toContain('tx("Femenino")')
  })
})
