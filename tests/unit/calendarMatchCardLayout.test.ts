import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("league calendar match card layout", () => {
  it("uses shared versus panels while pending and finished score rows after results", async () => {
    const [matchesPage, matchCard, teamsPanel, eventMeta, setGameScore, roundPage] = await Promise.all([
      read("src/app/matches/page.tsx"),
      read("src/components/matches/MatchCard.tsx"),
      read("src/components/matches/MatchTeamsPanel.tsx"),
      read("src/components/matches/MatchEventMeta.tsx"),
      read("src/components/matches/SetGameScore.tsx"),
      read("src/app/round/[id]/page.tsx"),
    ])

    expect(matchesPage).toContain("stackTeamPlayers")
    expect(matchesPage).toContain("showMissingScheduleHint")
    expect(matchesPage).not.toContain("currentUserNextMatch")
    expect(matchCard).toContain("<MatchTeamsPanel")
    expect(matchCard).toContain('mode={isFinished ? "rows" : "versus"}')
    expect(teamsPanel).toContain("Pareja A")
    expect(teamsPanel).toContain("Pareja B")
    expect(teamsPanel).toContain("VS")
    expect(teamsPanel).toContain("items-end")
    expect(teamsPanel).toContain("stackPlayers")
    expect(matchCard).toContain("!isFinished && !hasScheduleDetails && showMissingScheduleHint")
    expect(matchCard).toContain("t.dashboard.addSchedule")
    expect(matchCard).toContain("border-dashed")
    expect(matchCard).toContain("<MatchEventMeta")
    expect(eventMeta).toContain('weekday: "long"')
    expect(matchCard).toContain('aria-label="Juegos por set de la pareja A"')
    expect(matchCard).toContain('aria-label="Juegos por set de la pareja B"')
    expect(matchCard).toContain("<SetGameScore")
    expect(setGameScore).toContain("style={{ fontWeight: won ? 700 : 400 }}")
    expect(roundPage).not.toContain("stackTeamPlayers")
  })
})
