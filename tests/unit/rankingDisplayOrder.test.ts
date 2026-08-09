import { describe, expect, it } from "vitest"
import { getRankingDisplayPosition, sortRankingRows } from "@/lib/rankingOrder"

describe("ranking display order", () => {
  const players = [
    { id: "p3", points: 5, gamesDiff: 2, gamesFor: 20 },
    { id: "p1", points: 7, gamesDiff: 1, gamesFor: 18 },
    { id: "p2", points: 7, gamesDiff: 1, gamesFor: 18 },
    { id: "p4", points: 5, gamesDiff: 2, gamesFor: 19 },
  ]

  it("uses the same sequential positions shown in the ranking list, including ties", () => {
    expect(sortRankingRows(players).map((player) => player.id)).toEqual(["p1", "p2", "p3", "p4"])
    expect(getRankingDisplayPosition(players, "p1")).toBe(1)
    expect(getRankingDisplayPosition(players, "p2")).toBe(2)
    expect(getRankingDisplayPosition(players, "p3")).toBe(3)
    expect(getRankingDisplayPosition(players, "p4")).toBe(4)
  })
})
