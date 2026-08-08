import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("league calendar match card layout", () => {
  it("stacks each calendar team while keeping other MatchCard contexts unchanged", async () => {
    const [matchesPage, matchCard, roundPage] = await Promise.all([
      read("src/app/matches/page.tsx"),
      read("src/components/matches/MatchCard.tsx"),
      read("src/app/round/[id]/page.tsx"),
    ])

    expect(matchesPage).toContain("stackTeamPlayers")
    expect(matchesPage).toContain("currentUserId={currentUserId}")
    expect(matchCard).toContain("stackTeamPlayers?: boolean")
    expect(matchCard).toContain("currentUserId?: string | null")
    expect(matchCard).toContain("stackPlayers={stackTeamPlayers}")
    expect(matchCard).toContain('rounded-xl bg-neutral-50 px-3 py-2')
    expect(matchCard).toContain('aria-label="Juegos por set de la pareja A"')
    expect(matchCard).toContain('aria-label="Juegos por set de la pareja B"')
    expect(matchCard).toContain("getCurrentUserMatchOutcome(match, currentUserId)")
    expect(matchCard).toContain('currentUserOutcome === "victory" ? "green" : "red"')
    expect(matchCard).toContain("t.matches.victory")
    expect(matchCard).toContain("t.matches.defeat")
    expect(matchCard).toContain("isFinished && !stackTeamPlayers")
    expect(roundPage).not.toContain("stackTeamPlayers")
  })
})
