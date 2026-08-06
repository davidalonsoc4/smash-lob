import { randomUUID } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  consumeRateLimit,
  enforceRequestRateLimit,
} from "@/lib/serverRateLimit"

const originalRedisEnvironment = {
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}

afterEach(() => {
  restoreEnvironment("UPSTASH_REDIS_REST_URL", originalRedisEnvironment.url)
  restoreEnvironment("UPSTASH_REDIS_REST_TOKEN", originalRedisEnvironment.token)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("rate limiting", () => {
  it("returns Retry-After after the configured limit", () => {
    const key = `test-${randomUUID()}`

    expect(
      consumeRateLimit({ key, limit: 2, windowMs: 10_000, now: 1_000 }),
    ).toMatchObject({ allowed: true, remaining: 1 })
    expect(
      consumeRateLimit({ key, limit: 2, windowMs: 10_000, now: 2_000 }),
    ).toMatchObject({ allowed: true, remaining: 0 })
    expect(
      consumeRateLimit({ key, limit: 2, windowMs: 10_000, now: 3_000 }),
    ).toEqual({ allowed: false, remaining: 0, retryAfter: 8 })
  })

  it("opens a new window after expiry", () => {
    const key = `test-${randomUUID()}`
    consumeRateLimit({ key, limit: 1, windowMs: 1_000, now: 1_000 })
    expect(
      consumeRateLimit({ key, limit: 1, windowMs: 1_000, now: 2_001 }),
    ).toMatchObject({ allowed: true })
  })

  it("returns a comprehensible 429 response with Retry-After", async () => {
    const request = new Request("https://pre.smashandlob.com/api/suggestions", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.77" },
    })
    const scope = `test-blocked-${randomUUID()}`

    await expect(
      enforceRequestRateLimit({
        request,
        scope,
        limit: 1,
        windowMs: 30_000,
      }),
    ).resolves.toBeNull()
    const response = await enforceRequestRateLimit({
      request,
      scope,
      limit: 1,
      windowMs: 30_000,
    })

    expect(response?.status).toBe(429)
    expect(response?.headers.get("Retry-After")).toMatch(/^\d+$/)
    expect(response?.headers.get("X-Smash-Lob-RateLimit-Backend")).toBe(
      "memory",
    )
    await expect(response?.json()).resolves.toMatchObject({
      error: "rate_limited",
    })
  })

  it("uses the distributed backend when both Upstash variables exist", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.test"
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token"
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: [1, 30_000] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: [2, 28_000] }), { status: 200 }),
      )
    vi.stubGlobal("fetch", fetchMock)

    const request = new Request("https://pre.smashandlob.com/api/suggestions", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.78" },
    })
    const scope = `test-distributed-${randomUUID()}`

    await expect(
      enforceRequestRateLimit({ request, scope, limit: 1, windowMs: 30_000 }),
    ).resolves.toBeNull()
    const response = await enforceRequestRateLimit({
      request,
      scope,
      limit: 1,
      windowMs: 30_000,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(response?.status).toBe(429)
    expect(response?.headers.get("Retry-After")).toBe("28")
    expect(response?.headers.get("X-Smash-Lob-RateLimit-Backend")).toBe(
      "redis",
    )
  })
})
