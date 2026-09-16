import { describe, expect, it } from "vitest"
import { calculateBallCustodianAssignment } from "@/lib/ballCustodianAssignment"

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
  })
})
