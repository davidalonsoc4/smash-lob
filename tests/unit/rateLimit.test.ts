import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  consumeRateLimit,
  enforceRequestRateLimit,
} from "@/lib/serverRateLimit"

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

    expect(
      enforceRequestRateLimit({
        request,
        scope,
        limit: 1,
        windowMs: 30_000,
      }),
    ).toBeNull()
    const response = enforceRequestRateLimit({
      request,
      scope,
      limit: 1,
      windowMs: 30_000,
    })

    expect(response?.status).toBe(429)
    expect(response?.headers.get("Retry-After")).toMatch(/^\d+$/)
    await expect(response?.json()).resolves.toMatchObject({
      error: "rate_limited",
    })
  })
})
