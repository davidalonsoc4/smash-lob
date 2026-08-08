import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { formatMatchEventDateTime } from "@/components/matches/MatchEventMeta"

describe("match event metadata", () => {
  it("formats weekday, date and time together", () => {
    const result = formatMatchEventDateTime("2026-08-08T16:30:00")

    expect(result.toLowerCase()).toContain("sábado")
    expect(result).toContain("08")
    expect(result.toLowerCase()).toContain("ago")
    expect(result).toContain("16:30")
  })

  it("uses an explicit fallback when the date is missing", () => {
    expect(formatMatchEventDateTime(null, "Fecha pendiente")).toBe("Fecha pendiente")
  })

  it("supports independently hiding missing date and location rows", async () => {
    const source = await readFile("src/components/matches/MatchEventMeta.tsx", "utf8")
    expect(source).toContain("hideMissingRows?: boolean")
    expect(source).toContain("if (!dateText && !location) return null")
    expect(source).toContain("{dateText ? (")
    expect(source).toContain("{location ? (")
  })
})
