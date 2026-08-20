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
    expect(page).toContain('leagueName={activeLeague.name}')
    expect(card).toContain('title: seasonFinished ? tx("Calendario") : tx("Calendario actual")')
    expect(card).toContain('...(!seasonFinished')
    expect(card).toContain('kind: "calendar-fixtures" as const')
    expect(card).toContain('seasonFinished && mode === "current" ? "Calendario" : undefined')
    expect(card).toContain('? "calendario"')
    expect(card).toContain('? tx("Calendario de Smash & Lob")')
    expect(images).toContain('label?: string')
    expect(images).toContain('seasonFinished?: boolean')
    expect(images).toContain('const hideFinishedLabel = seasonFinished && match.status === "finished"')
    expect(images).toContain('label ??')
  })
})
