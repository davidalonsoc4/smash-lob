import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("shared match teams panel", () => {
  it("stays compact for calendar/home while match detail uses its own pairing panel", async () => {
    const [panel, card, scoreboard, home, detail, detailPanel, detailView] = await Promise.all([
      readFile("src/components/matches/MatchTeamsPanel.tsx", "utf8"),
      readFile("src/components/matches/MatchCard.tsx", "utf8"),
      readFile("src/components/match/MatchScoreboard.tsx", "utf8"),
      readFile("src/app/page.tsx", "utf8"),
      readFile("src/app/match/[id]/page.tsx", "utf8"),
      readFile("src/components/match/MatchDetailPairingPanel.tsx", "utf8"),
      readFile("src/components/match/MatchDetailView.tsx", "utf8"),
    ])

    expect(panel).toContain('mode: "rows" | "versus"')
    expect(panel).toContain("stackPlayers")
    expect(panel).toContain("keepNamesOnOneLine")
    expect(panel).toContain("[&>span]:justify-end")
    expect(panel).not.toContain("Pareja A")
    expect(panel).not.toContain("Pareja B")
    expect(card).toContain("<MatchTeamsPanel")
    expect(scoreboard).toContain("<MatchTeamsPanel")
    expect(scoreboard).toContain('mode={isFinished ? "rows" : "versus"}')
    expect(home.match(/<MatchCard/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
    expect(detail).toContain("<MatchDetailView")
    expect(detailView).toContain("<MatchDetailPairingPanel")
    expect(detailPanel).toContain('label="Pareja A"')
    expect(detailPanel).toContain('label="Pareja B"')
  })
})
