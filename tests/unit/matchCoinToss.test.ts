import { describe, expect, it } from "vitest"
import {
  COIN_TOSS_CLOSES_AFTER_MS, COIN_TOSS_OPENS_BEFORE_MS, faceCalledByTeam, getCoinTossWindow, otherCoinTossTeam,
  pendingCoinTossStep, resolveServingTeam, type CoinToss,
} from "@/lib/matchCoinToss"

const START = Date.parse("2026-11-26T16:00:00Z")
const toss = (patch: Partial<CoinToss> = {}): CoinToss => ({
  calledHeadsTeam: 1, result: "heads", winnerTeam: 1, winnerChoice: null, otherChoice: null, servingTeam: null, tossCount: 1, tossedAt: "2026-11-26T15:45:00Z", ...patch,
})

describe("coin toss window", () => {
  it("opens 30 minutes before the booked time and closes 4 hours after it", () => {
    const base = { scheduledAt: new Date(START).toISOString(), requireTime: true }
    expect(getCoinTossWindow({ ...base, now: START - COIN_TOSS_OPENS_BEFORE_MS - 1 })).toEqual({ state: "early", opensAt: "2026-11-26T15:30:00.000Z" })
    expect(getCoinTossWindow({ ...base, now: START - COIN_TOSS_OPENS_BEFORE_MS }).state).toBe("open")
    expect(getCoinTossWindow({ ...base, now: START + 10 * 60_000 }).state).toBe("open")
    expect(getCoinTossWindow({ ...base, now: START + COIN_TOSS_CLOSES_AFTER_MS }).state).toBe("open")
    expect(getCoinTossWindow({ ...base, now: START + COIN_TOSS_CLOSES_AFTER_MS + 1 }).state).toBe("late")
  })

  it("needs a time in a league match, but a friendly without one can toss whenever", () => {
    expect(getCoinTossWindow({ scheduledAt: null, now: START, requireTime: true }).state).toBe("unscheduled")
    expect(getCoinTossWindow({ scheduledAt: null, now: START, requireTime: false }).state).toBe("open")
    expect(getCoinTossWindow({ scheduledAt: "not a date", now: START, requireTime: true }).state).toBe("unscheduled")
  })
})

describe("coin toss choices", () => {
  it("knows who serves first from what the winner picks", () => {
    expect(resolveServingTeam(2, "serve", null)).toBe(2)
    expect(resolveServingTeam(2, "return", null)).toBe(1)
    expect(resolveServingTeam(2, null, null)).toBeNull()
  })

  it("lets the other team decide after the winner picks the side", () => {
    expect(resolveServingTeam(2, "side", null)).toBeNull()
    expect(resolveServingTeam(2, "side", "serve")).toBe(1)
    expect(resolveServingTeam(2, "side", "return")).toBe(2)
  })

  it("says what is left to choose", () => {
    expect(pendingCoinTossStep(toss())).toBe("winner")
    expect(pendingCoinTossStep(toss({ winnerChoice: "side" }))).toBe("other")
    expect(pendingCoinTossStep(toss({ winnerChoice: "side", otherChoice: "return" }))).toBe(null)
    expect(pendingCoinTossStep(toss({ winnerChoice: "serve" }))).toBe(null)
  })

  it("matches each team with its face", () => {
    expect(faceCalledByTeam(1, 1)).toBe("heads")
    expect(faceCalledByTeam(1, 2)).toBe("tails")
    expect(faceCalledByTeam(2, 2)).toBe("heads")
    expect(otherCoinTossTeam(1)).toBe(2)
  })
})
