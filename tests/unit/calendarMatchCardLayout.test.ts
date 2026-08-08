import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("league calendar match card layout", () => {
  it("stacks each calendar team and uses the shared bold-only set marker", async () => {
    const [matchesPage, matchCard, setGameScore, roundPage] = await Promise.all([
      read("src/app/matches/page.tsx"),
      read("src/components/matches/MatchCard.tsx"),
      read("src/components/matches/SetGameScore.tsx"),
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
    expect(matchCard).toContain("<SetGameScore")
    expect(matchCard).toContain("won={set.a > set.b}")
    expect(matchCard).toContain("won={set.b > set.a}")
    expect(setGameScore).toContain("style={{ fontWeight: won ? 700 : 400 }}")
    expect(setGameScore).toContain("border-transparent bg-neutral-100")
    expect(setGameScore).toContain("text-xs text-neutral-400")
    expect(setGameScore).not.toContain("border-neutral-300 bg-white")
    expect(setGameScore).not.toContain("text-sm text-neutral-950")
    expect(matchCard).toContain("getCurrentUserMatchOutcome(match, currentUserId)")
    expect(matchCard).toContain('currentUserOutcome === "victory" ? "green" : "red"')
    expect(matchCard).toContain("t.matches.victory")
    expect(matchCard).toContain("t.matches.defeat")
    expect(matchCard).toContain("isFinished && !stackTeamPlayers")
    expect(roundPage).not.toContain("stackTeamPlayers")
  })
})
