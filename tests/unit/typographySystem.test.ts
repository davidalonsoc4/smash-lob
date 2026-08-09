import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { describe, expect, it } from "vitest"

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const resolved = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(resolved)))
    if (entry.isFile() && /\.(ts|tsx|css)$/.test(entry.name)) files.push(resolved)
  }
  return files
}

describe("semantic typography system", () => {
  it("uses scalable semantic roles instead of fixed pixel text utilities", async () => {
    const files = await walk("src")
    const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n")
    expect(source).not.toMatch(/text-\[\d+px\]/)

    const globals = await readFile("src/app/globals.css", "utf8")
    expect(globals).toContain("--app-font-size-adjust: 0px")
    expect(globals).toContain("font-size: calc(16px + var(--app-font-size-adjust))")
    for (const role of [
      ".type-caption",
      ".type-small",
      ".type-page-title",
      ".type-section-title",
      ".type-panel-title",
      ".type-player-name",
      ".type-player-name-prominent",
      ".type-player-name-hero",
    ]) expect(globals).toContain(role)
  })

  it("keeps equivalent player names aligned across the main surfaces", async () => {
    const [ranking, matchCard, teams, personalStats, playerStats, pairing] = await Promise.all([
      readFile("src/components/ranking/RankingTable.tsx", "utf8"),
      readFile("src/components/matches/MatchCard.tsx", "utf8"),
      readFile("src/components/matches/MatchTeamsPanel.tsx", "utf8"),
      readFile("src/components/personal/PersonalProfileStatistics.tsx", "utf8"),
      readFile("src/components/player/PlayerStatsPanel.tsx", "utf8"),
      readFile("src/components/match/MatchDetailPairingPanel.tsx", "utf8"),
    ])
    expect(ranking).toContain("type-player-name")
    expect(matchCard.includes("type-player-name") || teams.includes("type-player-name")).toBe(true)
    expect(personalStats).toContain("type-player-name")
    expect(playerStats).toContain("type-player-name")
    expect(pairing).toContain("type-player-name-prominent")
  })

  it("keeps page headers focused on title and context instead of generic descriptions", async () => {
    const files = (await walk("src/app")).filter((file) => file.endsWith(".tsx"))
    const allowedContextTokens = [
      "activeLeague.description",
      "player.displayName",
      "Cuenta de espectador · acceso de solo lectura.",
    ]

    for (const file of files) {
      const source = await readFile(file, "utf8")
      for (const match of source.matchAll(/<header\b[^>]*>[\s\S]*?<\/header>/g)) {
        const header = match[0]
        const titleEnd = header.indexOf("</h1>")
        if (titleEnd < 0) continue
        const afterTitle = header.slice(titleEnd + "</h1>".length)
        if (!/<p\b/.test(afterTitle)) continue
        expect(allowedContextTokens.some((token) => afterTitle.includes(token)), file).toBe(true)
      }
    }
  })

  it("keeps panel titles on one semantic size and NAVBAR buttons fixed", async () => {
    const files = (await walk("src")).filter((file) => file.endsWith(".tsx"))
    for (const file of files) {
      const source = await readFile(file, "utf8")
      for (const match of source.matchAll(/className="([^"]*type-panel-title[^"]*)"/g)) {
        expect(match[1], file).not.toMatch(/\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl)\b/)
      }
    }

    const [bottomNav, globals] = await Promise.all([
      readFile("src/components/layout/BottomNav.tsx", "utf8"),
      readFile("src/app/globals.css", "utf8"),
    ])
    expect(bottomNav).toContain("app-bottom-nav-icon")
    expect(bottomNav).not.toContain("type-caption font-black")
    expect(globals).toContain("font-size: 11px")
    expect(globals).toContain("max-width: 448px")
  })

  it("keeps compact-page from silently shrinking typography", async () => {
    const globals = await readFile("src/app/globals.css", "utf8")
    const compact = globals.slice(globals.indexOf(".compact-page"))
    expect(compact).not.toMatch(/\.compact-page[^}]*font-size\s*:/)
  })
})
