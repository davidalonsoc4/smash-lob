import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

const explicitSize = /\b(?:text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)|text-\[[^\]]+\])\b/

function expectPanelTitleOpening(opening: string) {
  expect(opening).toContain("type-panel-title")
  expect(opening).toContain("font-black")
  expect(opening).not.toMatch(explicitSize)
}

function openingContaining(source: string, marker: string) {
  const markerIndex = source.indexOf(marker)
  expect(markerIndex).toBeGreaterThanOrEqual(0)
  for (const tag of ["p", "span", "h2", "h3", "strong", "Link", "button", "a", "div"]) {
    let open = source.lastIndexOf(`<${tag}`, markerIndex)
    while (open >= 0) {
      const openEnd = source.indexOf(">", open)
      const close = source.indexOf(`</${tag}>`, openEnd + 1)
      if (openEnd >= 0 && openEnd < markerIndex && close > markerIndex) return source.slice(open, openEnd + 1)
      open = source.lastIndexOf(`<${tag}`, open - 1)
    }
  }
  throw new Error(`No se encontró elemento para ${marker}`)
}

function rankingStatisticsAction(source: string) {
  const blocks = [...source.matchAll(/<Link\b[\s\S]*?<\/Link>/g)]
    .map((match) => match[0])
    .filter((block) => {
      const end = block.indexOf(">")
      const opening = end >= 0 ? block.slice(0, end + 1) : block
      return /\/statistics(?:[?/#`"'${}]|$)/.test(opening) && !/statistics\/season/.test(opening)
    })
  expect(blocks.length).toBeGreaterThan(0)
  return blocks.sort((a, b) => {
    const ah = /historial|history/i.test(a) ? 0 : 1
    const bh = /historial|history/i.test(b) ? 0 : 1
    return ah - bh
  })[0]
}

describe("v1.6.5 panel action title typography", () => {
  it("uses panel-title typography in Ranking Individual history/statistics", async () => {
    const ranking = await readFile("src/app/ranking/page.tsx", "utf8")
    const block = rankingStatisticsAction(ranking)
    const marker = ["Historial y estadísticas", "Historial y estadisticas", "historyAndStatistics", "historyAndStats"]
      .find((item) => block.includes(item))
    if (marker) {
      expectPanelTitleOpening(openingContaining(block, marker))
    } else {
      const firstText = /<(p|span|strong)\b[^>]*>/.exec(block)
      expect(firstText).not.toBeNull()
      expectPanelTitleOpening(firstText![0])
    }
  })

  it("uses panel-title typography for Mi disponibilidad and the matches action", async () => {
    const profile = await readFile("src/components/player/PlayerProfileScreen.tsx", "utf8")
    expectPanelTitleOpening(openingContaining(profile, "Mi disponibilidad"))
    expectPanelTitleOpening(openingContaining(profile, "t.profile.myMatches"))
  })
})
