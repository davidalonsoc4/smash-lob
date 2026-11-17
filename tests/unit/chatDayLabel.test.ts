import { describe, expect, it } from "vitest"
import { getChatDayKey, getChatDayLabel } from "@/lib/chatDayLabel"

const labels = { today: "Hoy", yesterday: "Ayer" }
const now = new Date(2026, 10, 17, 12, 0, 0)

describe("chat day separators", () => {
  it("groups messages by local calendar day", () => {
    expect(getChatDayKey(new Date(2026, 10, 17, 0, 5).toISOString())).toBe("2026-11-17")
    expect(getChatDayKey(new Date(2026, 10, 17, 23, 59).toISOString())).toBe("2026-11-17")
    expect(getChatDayKey("not a date")).toBe("")
  })

  it("labels today and yesterday with the supplied words", () => {
    expect(getChatDayLabel(new Date(2026, 10, 17, 9).toISOString(), now, "es-ES", labels)).toBe("Hoy")
    expect(getChatDayLabel(new Date(2026, 10, 16, 22).toISOString(), now, "es-ES", labels)).toBe("Ayer")
  })

  it("uses a full readable date, with the year, for older days", () => {
    const sameYear = getChatDayLabel(new Date(2026, 9, 3, 10).toISOString(), now, "es-ES", labels)
    expect(sameYear).toContain("octubre")
    expect(sameYear).toContain("2026")
    expect(getChatDayLabel(new Date(2025, 11, 31, 10).toISOString(), now, "es-ES", labels)).toContain("2025")
  })

  it("handles the month boundary for yesterday", () => {
    const firstOfMonth = new Date(2026, 11, 1, 10)
    expect(getChatDayLabel(new Date(2026, 10, 30, 8).toISOString(), firstOfMonth, "es-ES", labels)).toBe("Ayer")
  })
})
