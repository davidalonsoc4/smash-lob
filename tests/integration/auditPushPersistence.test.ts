import { afterEach, expect, it, vi } from "vitest"
const send = vi.hoisted(() => vi.fn())
vi.mock("web-push", () => ({ sendNotification: send, setVapidDetails: vi.fn() }))
import { enqueuePushRetry, processPushRetryQueue } from "@/lib/serverPushRetry"
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

function client({ readError = false, writeError = false, endpoint = "https://fcm.googleapis.com/send/fixture" } = {}) {
  const updates: Record<string, unknown>[] = []
  let writing = false
  const q = { select: () => q, eq: () => q, lte: () => q, order: () => q, limit: () => q,
    upsert: () => { writing = true; return q }, update: (value: Record<string, unknown>) => { updates.push(value); writing = true; return q },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: writing ? null : [{ id: "retry", endpoint, attempts: 0, payload: {}, p256dh: "fixture", auth: "fixture" }], error: (writing ? writeError : readError) ? { message: "Injected database failure" } : null }).then(resolve),
  }
  return { from: () => q, updates }
}

it("reports failed enqueue and lookup instead of pretending the queue is empty", async () => {
  await expect(enqueuePushRetry({ supabase: client({ writeError: true }), eventId: "event", subscription: { id: "sub", endpoint: "https://fcm.googleapis.com/send/fixture", p256dh: "fixture", auth: "fixture" }, payload: {} })).rejects.toThrow("push_retry_enqueue_failed")
  await expect(processPushRetryQueue(client({ readError: true }))).rejects.toThrow("push_retry_lookup_failed")
  expect(send).not.toHaveBeenCalled()
})

it.each(["delivered", "transport-failed", "unsafe-endpoint"])("reports persistence failure for %s", async (scenario) => {
  vi.stubEnv("VAPID_SUBJECT", "mailto:fixture@example.test")
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "fixture")
  vi.stubEnv("VAPID_PRIVATE_KEY", "fixture")
  if (scenario === "transport-failed") send.mockRejectedValueOnce({ statusCode: 503 })
  else send.mockResolvedValueOnce(undefined)
  const db = client({ writeError: true, ...(scenario === "unsafe-endpoint" ? { endpoint: "https://127.0.0.1/private" } : {}) })
  await expect(processPushRetryQueue(db)).rejects.toThrow(scenario === "delivered" ? "push_retry_sent_update_failed" : "push_retry_update_failed")
  expect(db.updates).toHaveLength(1)
  expect(db.updates[0].status).toBe(scenario === "delivered" ? "sent" : scenario === "unsafe-endpoint" ? "discarded" : "pending")
  expect(send).toHaveBeenCalledTimes(scenario === "unsafe-endpoint" ? 0 : 1)
})
