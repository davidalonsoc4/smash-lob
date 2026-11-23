import { describe, expect, it } from "vitest"
import { coinTossForViewer } from "@/lib/leagueCoinToss"
import type { CoinToss } from "@/lib/matchCoinToss"

const toss: CoinToss = { calledHeadsTeam: 1, result: "heads", winnerTeam: 1, winnerChoice: "serve", servingTeam: 1, tossCount: 1, tossedAt: "2026-11-26T15:45:00Z" }
const match = { id: "m1", teamA: ["p1", "p2"], teamB: ["p3", "p4"] }
const tosses = new Map([["m1", toss]])

describe("coin toss in the data of the league", () => {
  it("gives the toss to the players of the match", () => {
    expect(coinTossForViewer({ match, membership: { playerId: "p3", role: "player", experienceMode: "player" }, isSpectator: false, tosses })).toEqual(toss)
  })

  it("says there is none (null) to a player of a match that has not been tossed", () => {
    expect(coinTossForViewer({ match: { ...match, id: "m2" }, membership: { playerId: "p1", role: "player" }, isSpectator: false, tosses })).toBeNull()
  })

  it("gives it to the administrators in the administration view, and says nothing to the ones in the player view", () => {
    expect(coinTossForViewer({ match, membership: { playerId: "p9", role: "admin", experienceMode: "admin" }, isSpectator: false, tosses })).toEqual(toss)
    expect(coinTossForViewer({ match, membership: { playerId: "p9", role: "creator", experienceMode: "player" }, isSpectator: false, tosses })).toBeUndefined()
  })

  it("says nothing to who does not play the match, to the spectators and to who is not in the league", () => {
    expect(coinTossForViewer({ match, membership: { playerId: "p9", role: "player", experienceMode: "player" }, isSpectator: false, tosses })).toBeUndefined()
    expect(coinTossForViewer({ match, membership: { playerId: "p1", role: "player" }, isSpectator: true, tosses })).toBeUndefined()
    expect(coinTossForViewer({ match, membership: null, isSpectator: false, tosses })).toBeUndefined()
  })

  it("says nothing when the tosses could not be read (the card asks for its own)", () => {
    expect(coinTossForViewer({ match, membership: { playerId: "p1", role: "player" }, isSpectator: false, tosses: null })).toBeUndefined()
  })
})
