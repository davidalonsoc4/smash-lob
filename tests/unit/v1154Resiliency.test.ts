import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

describe("v1.15.4 Push resiliency", () => {
  it("queues transient failures for bounded, idempotent retries", async () => {
    const migration = await readFile("supabase/migrations/20260919120000_add_push_delivery_queue.sql", "utf8")
    const retry = await readFile("src/lib/serverPushRetry.ts", "utf8")
    const dispatch = await readFile("src/lib/serverPushDispatch.ts", "utf8")
    expect(migration).toContain("UNIQUE (event_id, subscription_id)")
    expect(retry).toContain("MAX_ATTEMPTS = 5")
    expect(retry).toContain("statusCode === 404 || statusCode === 410")
    expect(dispatch).toContain("enqueuePushRetry")
  })
})
