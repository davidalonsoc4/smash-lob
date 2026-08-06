import { randomUUID } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  isObservabilityWebhookConfigured,
  sendObservabilityEvent,
} from "@/lib/serverObservability"

const original = {
  url: process.env.OBSERVABILITY_WEBHOOK_URL,
  token: process.env.OBSERVABILITY_WEBHOOK_TOKEN,
  level: process.env.OBSERVABILITY_MIN_LEVEL,
}

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

afterEach(() => {
  restore("OBSERVABILITY_WEBHOOK_URL", original.url)
  restore("OBSERVABILITY_WEBHOOK_TOKEN", original.token)
  restore("OBSERVABILITY_MIN_LEVEL", original.level)
  vi.restoreAllMocks()
})

describe("optional observability webhook", () => {
  it("stays disabled without a URL", async () => {
    delete process.env.OBSERVABILITY_WEBHOOK_URL
    expect(isObservabilityWebhookConfigured()).toBe(false)
  })

  it("sends a warning with bearer authentication when configured", async () => {
    process.env.OBSERVABILITY_WEBHOOK_URL = "https://observability.example.test/events"
    process.env.OBSERVABILITY_WEBHOOK_TOKEN = "private-test-token"
    process.env.OBSERVABILITY_MIN_LEVEL = "warn"
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 202 }),
    )

    const sent = await sendObservabilityEvent({
      timestamp: new Date().toISOString(),
      level: "warn",
      environment: "test",
      version: "1.2.13",
      commitSha: null,
      deploymentId: null,
      region: null,
      message: `observability-test-${randomUUID()}`,
      route: "/api/test",
    })

    expect(sent).toBe(true)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer private-test-token",
        "Content-Type": "application/json",
      },
    })
  })
})
