import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("ranking panel composition", () => {
  it("keeps the Home ranking title inside the same card as its rows", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")

    expect(home).toContain('<AppCard className="overflow-hidden p-0">\n            <div className="px-3 pt-3">\n              <SectionHeader\n                title={t.dashboard.rankingTitle}')
    expect(home).toContain('className="space-y-3 border-t border-neutral-100 px-3 py-2.5"')
  })

  it("keeps Ranking headers, players and legend in one bordered panel", async () => {
    const table = await readFile("src/components/ranking/RankingTable.tsx", "utf8")

    expect(table).toContain('className="app-ranking-list overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"')
    expect(table).toContain('border-b border-neutral-100')
    expect(table).toContain('<span>Jugador</span>')
    expect(table).toContain('<span className="text-right">J</span>')
    expect(table).toContain('<span className="text-right">Dif</span>')
    expect(table).toContain('<span className="text-right">PTS</span>')
    expect(table).toContain('border-t border-neutral-100 px-3 py-2.5')
    expect(table).toContain('J = jornadas jugadas · Dif = diferencia de juegos · PTS = sets ganados')
    expect(table).not.toContain('<div className="space-y-2">')
  })
})
