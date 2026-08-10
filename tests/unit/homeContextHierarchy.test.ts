import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("home and primary navigation context hierarchy", () => {
  it("keeps Home identity compact and folds season state into one line", async () => {
    const [home, seasonContext] = await Promise.all([
      readFile("src/app/page.tsx", "utf8"),
      readFile("src/components/layout/SeasonContextLine.tsx", "utf8"),
    ])

    expect(home).toContain('<header data-tour="home-header" className="app-page-header">')
    expect(home).toContain('<LeagueLogo league={activeLeague} size="xl"')
    expect(home).toContain("<SeasonContextLine")
    expect(home).not.toContain("activeLeague.description")
    expect(home).not.toContain("getSeasonStatusBadgeClassName")
    expect(seasonContext).toContain('<span aria-hidden="true"> · </span>')
    expect(seasonContext).toContain('statusLabel ? (')
    expect(seasonContext).not.toContain('\"use client\"')
  })

  it("compresses finished and upcoming season summaries instead of repeating large status blocks", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")

    expect(home).toContain('data-tour="home-season-summary"')
    expect(home).toContain("t.profile.seasonSummary")
    expect(home).toContain("<SeasonSummaryAwardRow")
    expect(home).toContain('badge="🏆"')
    expect(home).toContain('tone="winner"')
    expect(home).toContain('tone="mvp"')
    expect(home).toContain('space-y-2 px-3 pb-3 pt-2')
    expect(home).toContain('bg-gradient-to-r from-amber-100/80')
    expect(home).toContain('bg-gradient-to-r from-violet-100/75')
    expect(home).toContain('const avatarSize = tone === "winner" ? "lg" : "md"')
    expect(home).toContain('className="min-w-0 flex-1 text-center"')
    const awardsStart = home.indexOf('{leader ? (')
    const actionsStart = home.indexOf('<div data-tour="home-season-actions"')
    expect(awardsStart).toBeGreaterThanOrEqual(0)
    expect(actionsStart).toBeGreaterThan(awardsStart)
    const awardsBlock = home.slice(awardsStart, actionsStart)
    expect(awardsBlock).toContain('space-y-2 px-3 pb-3 pt-2')
    expect(awardsBlock).not.toContain('grid-cols-2')
    expect(home).not.toContain("<PlayerAwardCard")
    expect(home).toContain('</AppCard>\n\n          {canManageSeason ? (')
    expect(home).toContain("Próxima temporada")
    expect(home).toContain("Inicio pendiente · {seasonRankingPlayers.length} jugadores")
  })

  it("puts the page title first and removes repeated league identity from primary NAVBAR screens", async () => {
    const pages = await Promise.all([
      readFile("src/app/ranking/page.tsx", "utf8"),
      readFile("src/app/matches/page.tsx", "utf8"),
      readFile("src/components/player/PlayerProfileScreen.tsx", "utf8"),
    ])

    for (const source of pages) {
      expect(source).toContain("<SeasonContextLine")
      expect(source).not.toContain("<LeagueSeasonEyebrow")
      expect(source).toContain('app-page-header')
      const titleIndex = source.indexOf("<h1")
      const contextIndex = source.indexOf("<SeasonContextLine")
      expect(titleIndex).toBeGreaterThanOrEqual(0)
      expect(contextIndex).toBeGreaterThan(titleIndex)
    }
    expect(pages[0]).toContain('<BackButton fallbackHref="/" label={t.common.back} />')
    expect(pages[1]).toContain('<BackButton fallbackHref="/" label={t.common.back} />')
    expect(pages[2]).toContain('<BackButton fallbackHref={isSelf ? "/" : "/ranking"} label={t.common.back} />')
  })
})
