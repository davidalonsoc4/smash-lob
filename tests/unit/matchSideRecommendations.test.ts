import { describe, expect, it } from "vitest"
import { recommendPairSides } from "@/lib/matchSideRecommendations"

describe("pair side recommendations", () => {
  it.each([
    ["drive", "reves", "drive", "reves"],
    ["reves", "drive", "reves", "drive"],
    ["drive", "versatile", "drive", "reves"],
    ["reves", "versatile", "reves", "drive"],
    ["versatile", "drive", "reves", "drive"],
    ["versatile", "reves", "drive", "reves"],
  ] as const)("respects %s + %s without needing a ranking", (a, b, expectedA, expectedB) => {
    expect(recommendPairSides([{ preferredSide: a }, { preferredSide: b }])).toEqual([expectedA, expectedB])
  })

  it.each(["drive", "reves"] as const)("lets the higher-ranked player keep %s, regardless of pair order", side => {
    const opposite = side === "drive" ? "reves" : "drive"
    expect(recommendPairSides([{ preferredSide: side, rankingPosition: 1 }, { preferredSide: side, rankingPosition: 5 }])).toEqual([side, opposite])
    expect(recommendPairSides([{ preferredSide: side, rankingPosition: 5 }, { preferredSide: side, rankingPosition: 1 }])).toEqual([opposite, side])
  })

  it.each([null, undefined, 0, -1, 1.5, NaN, Infinity, 3])("does not invent a ranking tie-break for %s", rank => {
    expect(recommendPairSides([{ preferredSide: "reves", rankingPosition: rank }, { preferredSide: "reves", rankingPosition: 3 }])).toEqual([null, null])
  })

  it("leaves two versatile players, unknown preferences and incomplete pairs to agreement", () => {
    expect(recommendPairSides([{ preferredSide: "versatile", rankingPosition: 1 }, { preferredSide: "versatile", rankingPosition: 5 }])).toEqual([null, null])
    expect(recommendPairSides([{}, { preferredSide: "drive" }])).toEqual([null, null])
    expect(recommendPairSides([{ preferredSide: "versatile" }, {}])).toEqual([null, null])
    expect(recommendPairSides([{ preferredSide: "drive" }])).toEqual([null, null])
  })
})
