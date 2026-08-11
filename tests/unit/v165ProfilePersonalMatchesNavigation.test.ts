import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

const explicitSize = /\b(?:text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)|text-\[[^\]]+\])\b/

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

function expectPanelTitle(opening: string) {
  expect(opening).toContain("type-panel-title")
  expect(opening).toContain("font-black")
  expect(opening).not.toMatch(explicitSize)
}

describe("v1.6.5 profile and personal matches final navigation", () => {
  it("routes own profile to global Personal Matches and keeps other players league scoped", async () => {
    const source = await readFile("src/components/player/PlayerProfileScreen.tsx", "utf8")
    expect(source).toContain('const historyHref = isSelf')
    expect(source).toContain('? "/personal-matches"')
    expect(source).toContain('`/player/${player.slug ?? player.id}/matches?scope=${selectedScope.id}`')
    expect(source).not.toContain('? "/profile/matches"')
  })

  it("labels the own/public action according to its actual scope", async () => {
    const source = await readFile("src/components/player/PlayerProfileScreen.tsx", "utf8")
    expect(source).toContain("{isSelf ? t.profile.myMatches : t.playerProfile.playerMatches}")
    expect(source).toContain("{isSelf ? t.profile.matchHistoryDescription : t.playerProfile.matchHistoryDescription}")
    expectPanelTitle(openingContaining(source, "t.profile.myMatches"))
  })

  it("uses block links so the existing profile space-y-3 separates availability and matches", async () => {
    const source = await readFile("src/components/player/PlayerProfileScreen.tsx", "utf8")
    expect(source).toContain('<div className="space-y-3">')
    expect(source).toContain('<Link href="/availability" className="block">')
    expect(source).toContain('<Link href={historyHref} className="block">')
    expectPanelTitle(openingContaining(source, "Mi disponibilidad"))
  })

  it("keeps the global Personal Matches screen and player league-history screen as separate routes", async () => {
    const [personal, publicMatches] = await Promise.all([
      readFile("src/app/personal-matches/page.tsx", "utf8"),
      readFile("src/app/player/[id]/matches/page.tsx", "utf8"),
    ])
    expect(personal.length).toBeGreaterThan(0)
    expect(publicMatches.length).toBeGreaterThan(0)
  })

  it("describes own Personal Matches as league plus friendly matches in all locales", async () => {
    const [es, en, eu] = await Promise.all([
      readFile("src/i18n/locales/es.ts", "utf8"),
      readFile("src/i18n/locales/en.ts", "utf8"),
      readFile("src/i18n/locales/eu.ts", "utf8"),
    ])
    expect(es).toContain('"Consulta todos tus partidos de liga y amistosos."')
    expect(en).toContain('"View all your league and friendly matches."')
    expect(eu).toContain('"Ikusi ligako eta lagunarteko partida guztiak."')
  })
})
