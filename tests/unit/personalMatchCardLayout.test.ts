import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("personal match card layout", () => {
  it("reuses the calendar pair panels and shared set marker", async () => {
    const [card, setGameScore] = await Promise.all([
      read("src/components/personal/PersonalMatchCard.tsx"),
      read("src/components/matches/SetGameScore.tsx"),
    ])

    expect(card).toContain('rounded-xl bg-neutral-50 px-3 py-2')
    expect(card).toContain('aria-label="Juegos por set de la pareja A"')
    expect(card).toContain('aria-label="Juegos por set de la pareja B"')
    expect(card).toContain('aria-label="Sets ganados por la pareja A"')
    expect(card).toContain('aria-label="Sets ganados por la pareja B"')
    expect(card).toContain("getPersonalMatchOutcome(match)")
    expect(card).toContain('outcome === "win"')
    expect(card).toContain('outcome === "loss"')
    expect(card).toContain('"Victoria"')
    expect(card).toContain('"Derrota"')
    expect(card).toContain("getPersonalMatchOriginLabel(match)")
    expect(card).toContain('match.locationName || "Ubicación no indicada"')
    expect(card).toContain("<SetGameScore")
    expect(setGameScore).toContain("style={{ fontWeight: won ? 700 : 400 }}")
    expect(setGameScore).toContain("border-transparent bg-neutral-100")
    expect(setGameScore).toContain("text-xs text-neutral-400")
    expect(setGameScore).not.toContain("bg-white")
  })
})
