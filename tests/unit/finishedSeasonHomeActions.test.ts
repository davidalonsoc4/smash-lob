import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("finished season home actions", () => {
  it("links the finished season to history and the share section", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")
    const seasonSummary = await readFile(
      "src/app/statistics/season/page.tsx",
      "utf8",
    )

    expect(home.match(/t\.dashboard\.historyAndStatistics/g)).toHaveLength(1)
    expect(home.match(/t\.dashboard\.shareSeasonSummary/g)).toHaveLength(1)
    const spanish = await readFile("src/i18n/locales/es.ts", "utf8")
    expect(spanish).toContain('historyAndStatistics: "Historial y estadísticas"')
    expect(spanish).toContain('shareSeasonSummary: "Compartir resumen de temporada"')
    expect(home).toContain("/statistics?season=${encodeURIComponent(activeSeason.id)}")
    expect(home).toContain("#compartir-resumen-temporada")
    expect(seasonSummary).toContain('id="compartir-resumen-temporada"')
  })
})
