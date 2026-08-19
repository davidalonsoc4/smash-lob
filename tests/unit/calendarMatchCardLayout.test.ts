import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("league calendar match card layout", () => {
  it("uses shared versus panels while pending and finished score rows after results", async () => {
    const [matchesPage, matchCard, teamsPanel, eventMeta, setGameScore, roundPage, statusStyles] = await Promise.all([
      read("src/app/matches/page.tsx"),
      read("src/components/matches/MatchCard.tsx"),
      read("src/components/matches/MatchTeamsPanel.tsx"),
      read("src/components/matches/MatchEventMeta.tsx"),
      read("src/components/matches/SetGameScore.tsx"),
      read("src/app/round/[id]/page.tsx"),
      read("src/lib/statusStyles.ts"),
    ])

    expect(matchesPage).toContain("stackTeamPlayers")
    expect(matchesPage).toContain("showMissingScheduleHint")
    expect(matchesPage).toContain("nextPendingUserMatch")
    expect(matchesPage).toContain("getNextMatch(currentUserMatches)")
    expect(matchesPage).toContain("match.id === nextPendingUserMatch?.id")
    expect(matchesPage).toContain('headerLeftLabel={tx(`Jornada ${match.round}`)}')
    expect(matchesPage).toContain('statusPosition="right"')
    expect(matchesPage).toContain("hideMissingScheduleMeta")
    expect(matchesPage).not.toContain('"Jugado" : "Pendiente de jugar"')
    expect(matchCard).toContain("<MatchTeamsPanel")
    expect(matchCard).toContain("showChevron = false")
    expect(matchCard).toContain('statusPosition === "left"')
    expect(matchCard).toContain('statusPosition === "right"')
    expect(matchCard).toContain('{statusNode}</div>')
    expect(matchCard).toContain("hideMissingRows={hideMissingScheduleMeta}")
    expect(matchCard).toContain("outcomeNode ?")
    expect(statusStyles).toContain("type-caption font-medium uppercase tracking-wide")
    expect(matchCard).toContain('mode={isFinished ? "rows" : "versus"}')
    expect(teamsPanel).not.toContain("Pareja A")
    expect(teamsPanel).toContain("grid min-w-0 flex-1")
    expect(teamsPanel).not.toContain("Pareja B")
    expect(teamsPanel).toContain("VS")
    expect(teamsPanel).toContain("items-end")
    expect(teamsPanel).toContain("stackPlayers")
    expect(matchCard).toContain("!isFinished && !hasScheduleDetails && showMissingScheduleHint")
    expect(matchCard).toContain("t.dashboard.addSchedule")
    expect(matchCard).toContain("border-dashed")
    expect(matchCard).toContain("<MatchEventMeta")
    expect(eventMeta).toContain('weekday: "long"')
    expect(matchCard).toContain('aria-label={tx("Juegos por set de la pareja A")}')
    expect(matchCard).toContain('aria-label={tx("Juegos por set de la pareja B")}')
    expect(matchCard).toContain("<SetGameScore")
    expect(setGameScore).toContain("style={{ fontWeight: won ? 700 : 400 }}")
    expect(roundPage).not.toContain("stackTeamPlayers")
  })
})
