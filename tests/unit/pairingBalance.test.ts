import { describe, expect, it } from "vitest"
import { balancedSplits, bestBalanced, pairId, pairingGap, shouldSwapBySide, shufflePairs } from "@/lib/pairingBalance"

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

describe("win chance", () => {
  it("is 50 % for equal pairs and grows with the gap", async () => {
    const { winChance } = await import("@/lib/pairingBalance")
    expect(winChance(0)).toBe(0.5)
    expect(Math.round(winChance(100) * 100)).toBe(64)
    expect(Math.round(winChance(282) * 100)).toBe(84)
  })
})

describe("shouldSwapBySide", () => {
  const p = (side: "drive" | "reves" | "versatile" | null, elo = 1000) => ({ side, elo })
  it("puts each player on their side", () => {
    expect(shouldSwapBySide(p("drive"), p("reves"), "reves")).toBe(true)
    expect(shouldSwapBySide(p("reves"), p("drive"), "reves")).toBe(false)
    expect(shouldSwapBySide(p("reves"), p("drive"), "drive")).toBe(true)
  })
  it("adapts the versatile one", () => {
    expect(shouldSwapBySide(p("versatile"), p("reves"), "reves")).toBe(true)
    expect(shouldSwapBySide(p("drive"), p("versatile"), "reves")).toBe(true)
    expect(shouldSwapBySide(p("reves"), p("versatile"), "reves")).toBe(false)
  })
  it("gives the side to the higher Elo when both want the same", () => {
    expect(shouldSwapBySide(p("drive", 1100), p("drive", 1000), "reves")).toBe(true)
    expect(shouldSwapBySide(p("drive", 1000), p("drive", 1100), "reves")).toBe(false)
    expect(shouldSwapBySide(p("reves", 1000), p("reves", 1100), "reves")).toBe(true)
  })
})
