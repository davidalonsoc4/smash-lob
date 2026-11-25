import { describe, expect, it } from "vitest"
import { balancedSplits, bestBalanced, pairId, pairingGap, shufflePairs } from "@/lib/pairingBalance"

const players = [{ key: "a", elo: 1200 }, { key: "b", elo: 1100 }, { key: "c", elo: 900 }, { key: "d", elo: 800 }]

describe("pairing balance", () => {
  it("puts the best with the worst first", () => {
    const [best] = balancedSplits(players)
    expect(best.gap).toBe(0)
    expect(pairId(best.order)).toBe("a+d|b+c")
  })

  it("always returns the single most balanced split", () => {
    expect(pairId(bestBalanced(players))).toBe("a+d|b+c")
    const balanced = [players[0], players[3], players[1], players[2]]
    expect(bestBalanced(balanced).map((player) => player.key)).toEqual(["a", "d", "b", "c"])
  })

  it("treats missing rates as neutral", () => {
    expect(pairingGap([{ key: "a", elo: null }, { key: "b", elo: null }, { key: "c", elo: 1000 }, { key: "d", elo: null }])).toBe(0)
  })

  it("shuffling always changes the pairs and keeps everyone", () => {
    for (let run = 0; run < 200; run += 1) {
      const mixed = shufflePairs(players)
      expect(mixed.map((player) => player.key).sort()).toEqual(["a", "b", "c", "d"])
      expect(pairId(mixed)).not.toBe(pairId(players))
    }
  })
})
