import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { buildMediaKitWelcomeLetter } from "@/lib/mediaKitWelcomeLetter"

const baseInput = {
  locale: "es" as const, leagueName: "Liga Norte", seasonName: "Temporada 1", playerCount: 8, totalRounds: 7, hasByes: false,
  registrationFee: { enabled: false, amount: 0, purpose: "" }, scheduledStartAt: null, openingRoundEnabled: false, openingRoundAt: null, openingRoundLocation: null,
}

describe("v1.13.8 premium welcome-letter finish", () => {
  it("keeps the recipient name in the opening but not in the final welcome", () => {
    const letter = buildMediaKitWelcomeLetter({ ...baseInput, recipientName: "David", recipientGender: "masculine" })
    expect(letter.bodyText).toContain("Liga Norte, David.")
    expect(letter.bodyText).toContain("Bienvenido a Smash & Lob.")
    expect(letter.bodyText).not.toContain("Bienvenido a Smash & Lob, David.")
  })
  it("keeps the visible paper texture while reinforcing a richer blue seal", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/lib/leagueMediaKitImage.ts"), "utf8")
    expect(source).toContain("drawWelcomePaperTexture(ctx)")
    expect(source).toContain('const WELCOME_STAMP_INK_CLEAN = "#2f7bbf"')
    expect(source).toContain('const WELCOME_STAMP_INK_TINTA = "#296ead"')
    expect(source).toContain("const WELCOME_STAMP_SIZE = 164")
    expect(source).toContain("randomWelcomeStampRotation()")
      })
})
