import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("ranking panel composition", () => {
  it("keeps the Home ranking title inside the same card as its rows", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")

    expect(home).toContain('<AppCard className="overflow-hidden p-0">\n            <div className="px-3 pt-3">\n              <SectionHeader\n                title={t.dashboard.rankingTitle}')
    expect(home).toContain('className="space-y-3 border-t border-neutral-100 px-3 py-2.5"')
  })

  it("keeps Ranking headers, players and legend in one bordered panel", async () => {
    const [table, globals] = await Promise.all([
      readFile("src/components/ranking/RankingTable.tsx", "utf8"),
      readFile("src/app/globals.css", "utf8"),
    ])

    expect(table).toContain('className="app-ranking-list overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"')
    expect(table).toContain('border-b border-neutral-100')
    expect(table).toContain('<span className="w-7 shrink-0 text-center">POS</span>')
    expect(table).toContain('<span>Jugador</span>')
    expect(table).toContain('<span className="text-right">J</span>')
    expect(table).toContain('<span className="text-right">Dif</span>')
    expect(table).toContain('<span className="text-right">PTS</span>')
    expect(table).toContain('border-t border-neutral-100 px-3 py-2.5')
    expect(table).toContain('J = jornadas jugadas · Dif = diferencia de juegos · PTS = sets ganados')
    expect(table).not.toContain('<div className="space-y-2">')
    expect(table).toContain('className="flex min-w-0 items-center gap-3"')
    expect(table).toContain('app-ranking-position w-7 shrink-0 text-center')
    expect(table).not.toContain('app-ranking-position flex h-7 w-7')
    expect(globals).toContain('.app-ranking-list .app-ranking-row:nth-child(1) { --ranking-row-accent: #d4a017; }')
    expect(globals).toContain('.app-ranking-list .app-ranking-row:nth-child(2) { --ranking-row-accent: #a8adb5; }')
    expect(globals).toContain('.app-ranking-list .app-ranking-row:nth-child(3) { --ranking-row-accent: #b87333; }')
    expect(globals).toContain('.app-ranking-list .app-ranking-row:nth-child(-n + 3)::before')
    expect(globals).not.toContain('--ranking-row-accent: #dfe3e8;')
    expect(globals).not.toContain('--ranking-row-accent: #48515c;')
    expect(globals).not.toContain('--ranking-row-accent-opacity')
    expect(globals).not.toContain('.app-ranking-list .app-ranking-row::before')
    expect(globals).not.toContain('html.colorful .app-ranking-row:nth-child(1) .app-ranking-position')
  })
})
