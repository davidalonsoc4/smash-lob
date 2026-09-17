import { describe, expect, it } from "vitest"
import {
  calculateBallCustodianAssignment,
  getOpeningRoundBallAllocation,
} from "@/lib/ballCustodianAssignment"

describe("calculateBallCustodianAssignment", () => {
  it("uses the minimum number of custodians and priority for ties", () => {
    const result = calculateBallCustodianAssignment({
      seasonPlayerIds: ["david", "alain", "alvaro", "unai"],
      priorityPlayerIds: ["david", "alain"],
      matches: [
        { id: "m1", round: 1, teamA: ["david", "alain"], teamB: ["alvaro", "unai"] },
        { id: "m2", round: 2, teamA: ["david", "alvaro"], teamB: ["alain", "unai"] },
      ],
    })

    expect(result.custodianPlayerIds).toEqual(["david"])
    expect(result.totalBotes).toBe(2)
    expect(result.byMatchId).toEqual({ m1: "david", m2: "david" })
  })

  it("balances assignments between selected custodians", () => {
    const result = calculateBallCustodianAssignment({
      seasonPlayerIds: ["a", "b", "c", "d"],
      priorityPlayerIds: ["a", "b"],
      matches: [
        { id: "m1", round: 1, teamA: ["a"], teamB: ["c"] },
        { id: "m2", round: 2, teamA: ["b"], teamB: ["d"] },
      ],
    })

    expect(result.custodianPlayerIds).toEqual(["a", "b"])
    expect(result.botesByPlayerId).toEqual({ a: 1, b: 1 })
    expect(result.totalBotes).toBe(2)
  })

  it("restricts the minimum custodian set to the selected eligible players", () => {
    const result = calculateBallCustodianAssignment({
      seasonPlayerIds: ["a", "b", "c", "d"],
      eligiblePlayerIds: ["b", "c"],
      matches: [
        { id: "m1", round: 1, teamA: ["a", "d"], teamB: ["b", "d"] },
        { id: "m2", round: 2, teamA: ["a", "c"], teamB: ["d", "a"] },
      ],
    })

    expect(result.custodianPlayerIds).toEqual(["b", "c"])
    expect(result.unassignedMatchIds).toEqual([])
    expect(result.totalBotes).toBe(2)
  })

  it("reports matches that have no selected eligible participant", () => {
    const result = calculateBallCustodianAssignment({
      seasonPlayerIds: ["a", "b", "c", "d"],
      eligiblePlayerIds: ["x"],
      matches: [
        { id: "m1", round: 1, teamA: ["a", "b"], teamB: ["c", "d"] },
      ],
    })

    expect(result.byMatchId).toEqual({})
    expect(result.unassignedMatchIds).toEqual(["m1"])
  })

  it("supports additional bottles that are not attached to a match", () => {
    const result = calculateBallCustodianAssignment({
      matches: [
        { id: "m1", round: 1, teamA: ["a", "b"], teamB: ["c", "d"] },
        { id: "m2", round: 2, teamA: ["a", "c"], teamB: ["b", "d"] },
      ],
      seasonPlayerIds: ["a", "b", "c", "d", "creator"],
      priorityPlayerIds: ["a", "b", "c", "d"],
      additionalBotesByPlayerId: { creator: 2 },
    })

    expect(result.custodianPlayerIds).toContain("creator")
    expect(result.botesByPlayerId.creator).toBe(2)
    expect(result.totalBotes).toBe(4)
    expect(Object.keys(result.byMatchId)).toHaveLength(2)
  })

  it("waits for the calendar before assigning opening-round bottles", () => {
    expect(getOpeningRoundBallAllocation([], "creator")).toEqual({
      fixedAssignmentsByMatchId: {},
      additionalBotesByPlayerId: {},
    })
  })

  it("assigns every first-round match to the organizer and calculates later rounds normally", () => {
    const matches = [
      { id: "m2", round: 1, teamA: ["e", "f"], teamB: ["g", "h"] },
      { id: "m1", round: 1, teamA: ["a", "b"], teamB: ["c", "d"] },
      { id: "m3", round: 1, teamA: ["i", "j"], teamB: ["k", "l"] },
      { id: "m4", round: 2, teamA: ["a", "b"], teamB: ["e", "f"] },
      { id: "m5", round: 2, teamA: ["c", "d"], teamB: ["i", "j"] },
      { id: "m6", round: 2, teamA: ["g", "h"], teamB: ["k", "m"] },
    ]
    const openingAllocation = getOpeningRoundBallAllocation(matches, "creator")
    const result = calculateBallCustodianAssignment({
      matches,
      seasonPlayerIds: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"],
      priorityPlayerIds: ["a", "c", "g", "b", "d", "e", "f", "h", "i", "j", "k", "l", "m"],
      eligiblePlayerIds: ["a", "c", "g"],
      fixedAssignmentsByMatchId: openingAllocation.fixedAssignmentsByMatchId,
      additionalBotesByPlayerId: openingAllocation.additionalBotesByPlayerId,
    })

    expect(openingAllocation.fixedAssignmentsByMatchId).toEqual({ m1: "creator", m2: "creator", m3: "creator" })
    expect(openingAllocation.additionalBotesByPlayerId).toEqual({})
    expect(result.byMatchId).toEqual({ m1: "creator", m2: "creator", m3: "creator", m4: "a", m5: "c", m6: "g" })
    expect(result.botesByPlayerId).toEqual({ a: 1, c: 1, g: 1, creator: 3 })
    expect(result.custodianPlayerIds).toEqual(["a", "c", "g", "creator"])
    expect(result.totalBotes).toBe(6)
    expect(result.unassignedMatchIds).toEqual([])
  })

  it("assigns the actual first-round match count without adding extra bottles", () => {
    const openingAllocation = getOpeningRoundBallAllocation([
      { id: "m1", round: 1, teamA: ["a", "b"], teamB: ["c", "d"] },
      { id: "m2", round: 2, teamA: ["a", "c"], teamB: ["b", "d"] },
    ], "creator")

    expect(openingAllocation).toEqual({
      fixedAssignmentsByMatchId: { m1: "creator" },
      additionalBotesByPlayerId: {},
    })
  })
})
