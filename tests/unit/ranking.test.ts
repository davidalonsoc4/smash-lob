import { describe, expect, it } from "vitest"
import { calculateSeasonRanking } from "@/lib/ranking"

function player(id: string, displayName: string) {
  return {
    id,
    leagueId: "league-a",
    displayName,
    slug: displayName.toLowerCase(),
    avatarInitials: displayName.slice(0, 2),
    avatarUrl: null,
  }
}

function seasonPlayer(playerId: string) {
  return {
    seasonId: "season-a",
    playerId,
    status: "active" as const,
    joinedFromRound: null,
    replacedFromRound: null,
  }
}

describe("season ranking and tie-breaks", () => {
  it("sorts by points, games difference and games for", () => {
    const playerProfiles = [
      player("a", "Ana"),
      player("b", "Bea"),
      player("c", "Carla"),
      player("d", "Diana"),
    ]
    const ranking = calculateSeasonRanking({
      seasonId: "season-a",
      playerProfiles,
      seasonPlayers: playerProfiles.map(({ id }) => seasonPlayer(id)),
      matches: [
        {
          id: "match-a",
          seasonId: "season-a",
          round: 1,
          status: "finished",
          teamA: ["a", "b"],
          teamB: ["c", "d"],
          pointsA: 2,
          pointsB: 1,
          sets: [
            { a: 6, b: 4 },
            { a: 3, b: 6 },
            { a: 6, b: 2 },
          ],
        },
      ],
    })

    expect(ranking.map(({ id }) => id)).toEqual(["a", "b", "c", "d"])
    expect(ranking[0]).toMatchObject({
      points: 2,
      gamesFor: 15,
      gamesAgainst: 12,
      gamesDiff: 3,
      wins: 1,
    })
    expect(ranking[2]).toMatchObject({ points: 1, losses: 1 })
  })

  it("ignores unfinished and explicitly non-counting results", () => {
    const playerProfiles = [player("a", "Ana"), player("b", "Bea")]
    const ranking = calculateSeasonRanking({
      seasonId: "season-a",
      playerProfiles,
      seasonPlayers: playerProfiles.map(({ id }) => seasonPlayer(id)),
      matches: [
        {
          id: "draft",
          seasonId: "season-a",
          round: 1,
          status: "scheduled",
          teamA: ["a"],
          teamB: ["b"],
          pointsA: 2,
          pointsB: 0,
          sets: [{ a: 6, b: 0 }],
        },
        {
          id: "friendly",
          seasonId: "season-a",
          round: 2,
          status: "finished",
          resultCounts: false,
          teamA: ["a"],
          teamB: ["b"],
          pointsA: 2,
          pointsB: 0,
          sets: [{ a: 6, b: 0 }],
        },
      ],
    })

    expect(ranking.every(({ matchesPlayed, points }) => matchesPlayed === 0 && points === 0)).toBe(true)
  })
})
