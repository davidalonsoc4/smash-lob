import { describe, expect, it } from "vitest"
import { rememberCoinToss, rememberedCoinToss } from "@/lib/matchCoinTossClient"
import type { CoinToss } from "@/lib/matchCoinToss"

const toss: CoinToss = { calledHeadsTeam: 1, result: "heads", winnerTeam: 1, winnerChoice: "serve", servingTeam: 1, tossCount: 1, tossedAt: "2026-11-26T15:45:00Z" }

describe("remembered coin toss", () => {
  it("knows nothing about a match it has not heard about, and keeps what the server said (even that there is no toss)", () => {
    expect(rememberedCoinToss("friendly", "never-seen")).toBeUndefined()
    rememberCoinToss("friendly", "a", null)
    expect(rememberedCoinToss("friendly", "a")).toBeNull()
    rememberCoinToss("friendly", "a", toss)
    expect(rememberedCoinToss("friendly", "a")).toEqual(toss)
  })

  it("keeps a league match and a friendly with the same id apart", () => {
    rememberCoinToss("league", "same", toss)
    expect(rememberedCoinToss("friendly", "same")).toBeUndefined()
  })

  it("forgets the oldest matches when it has too many", () => {
    for (let index = 0; index < 80; index++) rememberCoinToss("friendly", `bulk-${index}`, null)
    expect(rememberedCoinToss("friendly", "bulk-0")).toBeUndefined()
    expect(rememberedCoinToss("friendly", "bulk-79")).toBeNull()
  })
})
