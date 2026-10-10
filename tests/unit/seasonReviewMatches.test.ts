import { describe, expect, it } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import { calculateSeasonStatistics, getSeasonReviewMatches } from "@/lib/seasonStatistics"

function match(id: string, overrides: Partial<MatchData> = {}): MatchData {
  return { id, seasonId: "season", round: 1, status: "finished", sets: [{ a: 6, b: 2 }], pointsA: 1, pointsB: 0, teamA: ["a", "b"], teamB: ["c", "d"], ...overrides } as MatchData
}

describe("matches blocking a season summary", () => {
  it("includes pending, excluded and invalid results, excluding valid and other-season matches", () => {
    const rows = [match("valid"), match("pending", { status: "scheduled" }), match("excluded", { resultCounts: false }), match("empty", { sets: [] }), match("tied", { pointsA: 0, pointsB: 0, sets: [{ a: 0, b: 0 }] }), match("other", { seasonId: "other", sets: [] })]
    expect(getSeasonReviewMatches(rows, "season").map(row => row.id)).toEqual(["pending", "excluded", "empty", "tied"])
  })

  it("orders the review by round without mutating the dataset", () => {
    const rows = [match("later", { round: 4, sets: [] }), match("earlier", { round: 1, resultCounts: false })]
    expect(getSeasonReviewMatches(rows, "season").map(row => row.id)).toEqual(["earlier", "later"])
    expect(rows.map(row => row.id)).toEqual(["later", "earlier"])
  })
})

it("does not award a season championship without valid counted results", () => {
  const playerProfiles = ["a", "b", "c", "d"].map(id => ({ id, displayName: id, leagueId: "league", slug: id, avatarInitials: id }))
  const seasonPlayers = playerProfiles.map(player => ({ seasonId: "season", playerId: player.id }))
  for (const matches of [[], [match("pending", { status: "scheduled" })], [match("excluded", { resultCounts: false })], [match("invalid", { sets: [] })]]) {
    const summary = calculateSeasonStatistics({ seasonId: "season", playerProfiles, seasonPlayers, matches })
    expect(summary.leaders).toEqual([]); expect(summary.leader).toBeNull()
  }
  expect(calculateSeasonStatistics({ seasonId: "season", playerProfiles, seasonPlayers, matches: [match("valid")] }).leaders.length).toBeGreaterThan(0)
})
