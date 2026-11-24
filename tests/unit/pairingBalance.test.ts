import { describe, expect, it } from "vitest"
import { balancedSplits, nextBalanced, pairId, pairingGap, shuffleList } from "@/lib/pairingBalance"

const players = [{ key: "a", rate: 80 }, { key: "b", rate: 70 }, { key: "c", rate: 30 }, { key: "d", rate: 20 }]

describe("pairing balance", () => {
  it("puts the best with the worst first", () => {
    const [best] = balancedSplits(players)
    expect(best.gap).toBe(0)
    expect(pairId(best.order)).toBe("a+d|b+c")
  })

  it("steps through the options without repeating, then wraps", () => {
    const shown: string[] = []
    for (let step = 0; step < 3; step += 1) {
      const next = nextBalanced(players, shown)
      expect(shown).not.toContain(next.id)
      shown.push(next.id)
    }
    expect(new Set(shown).size).toBe(3)
    expect(nextBalanced(players, shown).id).toBe("a+d|b+c")
  })

  it("treats missing rates as neutral", () => {
    expect(pairingGap([{ key: "a", rate: null }, { key: "b", rate: null }, { key: "c", rate: 50 }, { key: "d", rate: null }])).toBe(0)
  })

  it("shuffles without losing anyone", () => {
    const mixed = shuffleList(["a", "b", "c", "d"])
    expect([...mixed].sort()).toEqual(["a", "b", "c", "d"])
  })
})
