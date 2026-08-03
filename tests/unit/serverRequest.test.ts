import { describe, expect, it } from "vitest"
import {
  normalizeBoundedText,
  validateHttpUrl,
  validateInviteCode,
  validateIsoDateTime,
  validateMatchSets,
  validateMoney,
  validateTimeZone,
  validateUuid,
} from "@/lib/serverRequest"

describe("shared server validators", () => {
  it("accepts UUIDs and rejects guessed identifiers", () => {
    expect(validateUuid("019fc39c-26cf-43e1-9d4b-9439d3366675")).toBeTruthy()
    expect(validateUuid("../../league-a")).toBeNull()
  })

  it("normalizes bounded text and invitation codes", () => {
    expect(normalizeBoundedText("  Smash & Lob  ", 8)).toBe("Smash & ")
    expect(validateInviteCode(" sp-ab12-cd34 ")).toBe("SP-AB12-CD34")
    expect(validateInviteCode("../secret")).toBeNull()
  })

  it("validates Europe/Madrid and ISO dates", () => {
    expect(validateTimeZone("Europe/Madrid")).toBe("Europe/Madrid")
    expect(validateTimeZone("Europe/Not-A-Zone")).toBeNull()
    expect(validateIsoDateTime("2026-08-02T18:30:00+02:00")).toBe(
      "2026-08-02T16:30:00.000Z",
    )
    expect(validateIsoDateTime("tomorrow")).toBeNull()
  })

  it("validates amounts, URLs and match sets", () => {
    expect(validateMoney("12.345")).toBe(12.35)
    expect(validateMoney(-1)).toBeNull()
    expect(validateHttpUrl("https://pre.smashandlob.com/invite/ABC")).toBe(
      "https://pre.smashandlob.com/invite/ABC",
    )
    expect(validateHttpUrl("javascript:alert(1)")).toBeNull()
    expect(validateMatchSets([{ a: 6, b: 4 }, { a: 3, b: 6 }])).toEqual([
      { a: 6, b: 4 },
      { a: 3, b: 6 },
    ])
    expect(validateMatchSets([{ a: 6, b: 6 }])).toBeNull()
  })
})
