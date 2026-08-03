import { describe, expect, it } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import { getPlayerScopeStats } from "@/lib/playerHistory"

describe("historical player identity", () => {
  it("aggregates one stable player id across seasons", () => {
    const matches = [
      {
        id: "old",
        seasonId: "season-old",
        status: "finished",
        resultCounts: true,
        teamA: ["stable-player"],
        teamB: ["rival"],
        pointsA: 2,
        pointsB: 0,
        sets: [{ a: 6, b: 4 }, { a: 6, b: 3 }],
      },
      {
        id: "new",
        seasonId: "season-new",
        status: "finished",
        resultCounts: true,
        teamA: ["rival"],
        teamB: ["stable-player"],
        pointsA: 2,
        pointsB: 1,
        sets: [{ a: 6, b: 3 }, { a: 4, b: 6 }, { a: 6, b: 2 }],
      },
    ] as MatchData[]

    expect(
      getPlayerScopeStats({
        playerId: "stable-player",
        seasonIds: ["season-old", "season-new"],
        matches,
      }),
    ).toEqual({
      points: 3,
      gamesDiff: 0,
      gamesFor: 23,
      gamesAgainst: 23,
      matchesPlayed: 2,
      wins: 1,
      losses: 1,
    })
  })
})
