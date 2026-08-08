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
    expect(matchCard).toContain("stackTeamPlayers?: boolean")
    expect(matchCard).toContain("stackPlayers={stackTeamPlayers}")
    expect(matchCard).toContain('rounded-xl bg-neutral-50 px-3 py-2')
    expect(matchCard).toContain('rounded-md border border-neutral-200 bg-white px-2 py-1')
    expect(matchCard).toContain("self-center text-right text-lg font-black")
    expect(roundPage).not.toContain("stackTeamPlayers")
  })
})
