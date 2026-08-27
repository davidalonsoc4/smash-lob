import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("v1.13.4 organic welcome-letter stamp", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/lib/leagueMediaKitImage.ts"), "utf8")

  it("uses a larger stamp with controlled position and rotation jitter", () => {
    expect(source).toContain("const WELCOME_STAMP_SIZE = 164")
    expect(source).toContain("const WELCOME_STAMP_JITTER_X = 26")
    expect(source).toContain("const WELCOME_STAMP_JITTER_Y = 20")
    expect(source).toContain("const WELCOME_STAMP_MAX_ROTATION_DEG = 9")
    expect(source).toContain("randomWelcomeStampOffset(WELCOME_STAMP_JITTER_X)")
    expect(source).toContain("randomWelcomeStampOffset(WELCOME_STAMP_JITTER_Y)")
    expect(source).toContain("randomWelcomeStampRotation()")
  })

  it("never shrinks the signature to make room for the stamp", () => {
    expect(source).toContain("ctx.font = `${signatureWeight} ${signatureSize}px ${signatureFamily}`")
    expect(source).not.toContain("fittedSignatureSize")
    expect(source).not.toContain("signatureMaxWidth")
  })
})
