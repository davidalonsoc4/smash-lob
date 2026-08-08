import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("shared match teams panel", () => {
  it("is reused by calendar, match detail and home cards", async () => {
    const [panel, card, scoreboard, home] = await Promise.all([
      readFile("src/components/matches/MatchTeamsPanel.tsx", "utf8"),
      readFile("src/components/matches/MatchCard.tsx", "utf8"),
      readFile("src/components/match/MatchScoreboard.tsx", "utf8"),
      readFile("src/app/page.tsx", "utf8"),
    ])

    expect(panel).toContain('mode: "rows" | "versus"')
    expect(panel).toContain("stackPlayers")
    expect(panel).toContain("keepNamesOnOneLine")
    expect(panel).toContain("[&>span]:justify-end")
    expect(card).toContain("<MatchTeamsPanel")
    expect(scoreboard).toContain("<MatchTeamsPanel")
    expect(scoreboard).toContain('mode={isFinished ? "rows" : "versus"}')
    expect(home.match(/<MatchCard/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  })
})
