import { describe, expect, it } from "vitest"
import {
  getCurrentUserMatchOutcome,
  getMatchTeamScores,
} from "@/lib/matchPresentation"

const finishedMatch = {
  status: "finished",
  teamA: ["a1", "a2"],
  teamB: ["b1", "b2"],
  pointsA: 3,
  pointsB: 0,
  sets: [
    { a: 6, b: 2 },
    { a: 6, b: 2 },
    { a: 6, b: 3 },
  ],
}

describe("calendar match presentation", () => {
  it("returns victory or defeat only for a participating user", () => {
    expect(getCurrentUserMatchOutcome(finishedMatch, "a1")).toBe("victory")
    expect(getCurrentUserMatchOutcome(finishedMatch, "b2")).toBe("defeat")
    expect(getCurrentUserMatchOutcome(finishedMatch, "other")).toBeNull()
  })

  it("keeps the normal status before the match is finished", () => {
    expect(
      getCurrentUserMatchOutcome(
        { ...finishedMatch, status: "scheduled" },
        "a1",
      ),
    ).toBeNull()
  })

  it("falls back to sets won when stored points are missing", () => {
    expect(
      getMatchTeamScores({
        ...finishedMatch,
        pointsA: null,
        pointsB: null,
        sets: [
          { a: 6, b: 4 },
          { a: 4, b: 6 },
          { a: 7, b: 5 },
        ],
      }),
    ).toEqual({ teamA: 2, teamB: 1 })
  })
})
