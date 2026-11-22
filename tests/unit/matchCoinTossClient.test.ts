import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchCoinToss, isCoinTossFresh, prefetchCoinToss, rememberCoinToss, rememberedCoinToss, subscribeCoinToss } from "@/lib/matchCoinTossClient"
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

describe("coin toss requests", () => {
  afterEach(() => vi.unstubAllGlobals())
  const answer = (coinToss: CoinToss | null) => new Response(JSON.stringify({ coinToss, window: { state: "open", opensAt: null } }), { status: 200 })

  it("shares one request between calls made at the same time, and remembers the answer", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => answer(toss))
    vi.stubGlobal("fetch", fetchMock)
    const [first, second] = await Promise.all([fetchCoinToss("league", "shared"), fetchCoinToss("league", "shared")])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(first?.coinToss).toEqual(toss)
    expect(second?.coinToss).toEqual(toss)
    expect(rememberedCoinToss("league", "shared")).toEqual(toss)
  })

  it("does not ask ahead of time for what it has just heard, and does ask for what it has not", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => answer(null))
    vi.stubGlobal("fetch", fetchMock)
    rememberCoinToss("league", "heard", toss)
    expect(isCoinTossFresh("league", "heard")).toBe(true)
    prefetchCoinToss("league", "heard")
    expect(fetchMock).not.toHaveBeenCalled()
    expect(isCoinTossFresh("league", "heard", Date.now() + 10_000)).toBe(false)
    prefetchCoinToss("league", "unknown")
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(rememberedCoinToss("league", "unknown")).toBeNull())
  })

  it("tells who is listening when a toss is remembered, until they stop", () => {
    const heard: Array<CoinToss | null> = []
    const stop = subscribeCoinToss("friendly", "listened", (next) => heard.push(next))
    rememberCoinToss("friendly", "listened", toss)
    rememberCoinToss("friendly", "other", null)
    stop()
    rememberCoinToss("friendly", "listened", null)
    expect(heard).toEqual([toss])
  })

  it("answers null when the server says no, and does not remember it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 403 })))
    expect(await fetchCoinToss("league", "forbidden")).toBeNull()
    expect(rememberedCoinToss("league", "forbidden")).toBeUndefined()
  })
})
