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
})
