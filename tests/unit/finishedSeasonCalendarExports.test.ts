import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("finished season calendar exports", () => {
  it("keeps one generic calendar export after the season finishes", async () => {
    const card = await readFile(
      "src/components/statistics/SeasonShareExportsCard.tsx",
      "utf8",
    )
    const page = await readFile("src/app/statistics/season/page.tsx", "utf8")
    const images = await readFile("src/lib/seasonExportImages.ts", "utf8")

    expect(page).toContain(
      'seasonFinished={selectedSeason.status === "finished"}',
    )
    expect(card).toContain('title={seasonFinished ? "Calendario" : "Calendario actual"}')
    expect(card).toContain('{!seasonFinished ? (')
    expect(card).toContain('kind="calendar-fixtures"')
    expect(card).toContain('seasonFinished && mode === "current" ? "Calendario" : undefined')
    expect(card).toContain('? "calendario"')
    expect(card).toContain('? "Calendario de Smash & Lob"')
    expect(images).toContain('label?: string')
    expect(images).toContain('label ??')
  })
})
