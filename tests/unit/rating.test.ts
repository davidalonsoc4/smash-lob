import { describe, expect, it } from "vitest"
import { computeRatings, expectedScore, pairLevelGap, ratingToLevel, type RatingMatch } from "@/lib/rating"

const sets = (...items: Array<[number, number]>) => items.map(([a, b]) => ({ a, b }))
let counter = 0
const league = (a: string[], b: string[], result: ReturnType<typeof sets>): RatingMatch => ({ id: `m${(counter += 1)}`, at: `2026-07-01T13:${String(counter).padStart(2, "0")}:00Z`, kind: "league", teamA: a, teamB: b, sets: result })
const friendly = (a: string[], b: string[], result: ReturnType<typeof sets>): RatingMatch => ({ ...league(a, b, result), kind: "friendly" })

// Historial real de produccion (liga del 1-2 de julio y amistosos hasta el 20 de noviembre de 2026).
const history: RatingMatch[] = [
  league(["JA", "AR"], ["UG", "JS"], sets([6, 2], [6, 2], [6, 3])), league(["UG", "AS"], ["AR", "DA"], sets([2, 6], [1, 6], [5, 7])),
  league(["AA", "JS"], ["JA", "JG"], sets([1, 6], [6, 4], [3, 6])), league(["AA", "AR"], ["UG", "JG"], sets([6, 1], [6, 3], [6, 2])),
  league(["JS", "DA"], ["AS", "JA"], sets([6, 1], [6, 3], [6, 0])), league(["JS", "AS"], ["JG", "AR"], sets([6, 7], [1, 6], [1, 6])),
  league(["DA", "JA"], ["UG", "AA"], sets([3, 6], [3, 6], [7, 6])), league(["JG", "JS"], ["JA", "AA"], sets([6, 3], [2, 6], [6, 0])),
  league(["AR", "AS"], ["DA", "UG"], sets([6, 1], [5, 7], [4, 6])), league(["AR", "UG"], ["JS", "JA"], sets([6, 0], [6, 1], [7, 5])),
  league(["AS", "DA"], ["AA", "JG"], sets([6, 1], [7, 6], [6, 1])), league(["UG", "JA"], ["DA", "AA"], sets([2, 6], [5, 7], [4, 6])),
  league(["JS", "AR"], ["JG", "AS"], sets([6, 4], [3, 6], [6, 4])), league(["AA", "AS"], ["DA", "JG"], sets([4, 6], [4, 6], [4, 6])),
  friendly(["DA", "AR"], ["AA", "UG"], sets([6, 3], [7, 5], [6, 2])), friendly(["DA", "AR"], ["RI", "AE"], sets([6, 2], [7, 6])),
  friendly(["DA", "UG"], ["AR", "JG"], sets([1, 6], [6, 2], [6, 3])), friendly(["DA", "AR"], ["RI", "AF"], sets([4, 6], [6, 3], [4, 6])),
  friendly(["DA", "AR"], ["RI", "AF"], sets([6, 4], [4, 6], [3, 6])), friendly(["DA", "AR"], ["RI", "AF"], sets([6, 7], [3, 6])),
]

describe("player rating", () => {
  it("maps ratings to a 0-100 level centred on 50", () => {
    expect(ratingToLevel(1000)).toBe(50)
    expect(ratingToLevel(1400)).toBeGreaterThan(90)
    expect(ratingToLevel(600)).toBeLessThan(10)
    expect(expectedScore(1000, 1000)).toBe(0.5)
  })

  it("orders the real players like the people who know them", () => {
    const ratings = computeRatings(history)
    const level = (key: string) => ratings.get(key)!.level
    for (const top of ["RI", "AF"]) for (const middle of ["DA", "AR"]) expect(level(top)).toBeGreaterThan(level(middle))
    for (const middle of ["DA", "AR"]) expect(level(middle)).toBeGreaterThan(level("UG"))
    for (const low of ["JG", "AA"]) expect(level("UG")).toBeGreaterThan(level(low))
    expect(Math.abs(level("DA") - level("AR"))).toBeLessThan(10)
  })

  it("does not depend on the order the matches arrive in", () => {
    const forward = computeRatings(history)
    const backward = computeRatings([...history].reverse())
    for (const [key, player] of forward) expect(backward.get(key)!.rating).toBeCloseTo(player.rating, 6)
  })

  it("keeps the ratings of a closed group around 1000", () => {
    const ratings = [...computeRatings(history).values()]
    const mean = ratings.reduce((total, player) => total + player.rating, 0) / ratings.length
    expect(mean).toBeGreaterThan(900)
    expect(mean).toBeLessThan(1100)
  })

  it("counts matches, flags provisional levels and records why each match moved the level", () => {
    const ratings = computeRatings(history)
    const rios = ratings.get("RI")!
    expect(rios.matches).toBe(4)
    expect(rios.wins).toBe(3)
    expect(rios.provisional).toBe(true)
    expect(rios.events).toHaveLength(4)
    expect(rios.events[3].partners).toEqual(["AF"])
    expect(ratings.get("DA")!.matches).toBe(13)
    expect(ratings.get("DA")!.provisional).toBe(false)
  })

  it("ignores matches without a winner or with repeated players", () => {
    const ratings = computeRatings([league(["a", "b"], ["c", "d"], sets([6, 6])), league(["a", "a"], ["c", "d"], sets([6, 0]))])
    expect(ratings.size).toBe(0)
  })

  it("measures the gap between pairs in level points", () => {
    const ratings = new Map([["a", 1400], ["b", 600], ["c", 1000], ["d", 1000]])
    expect(pairLevelGap(ratings, ["a", "b"], ["c", "d"])).toBeLessThan(1)
    expect(pairLevelGap(ratings, ["a", "c"], ["b", "d"])).toBeGreaterThan(20)
  })
})
