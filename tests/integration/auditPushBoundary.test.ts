import { afterEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ send: vi.fn(), vapid: vi.fn(), access: vi.fn() }))
vi.mock("web-push", () => ({ sendNotification: mocks.send, setVapidDetails: mocks.vapid }))
vi.mock("@/lib/serverLeagueAccess", () => ({ getServerLeagueActor: mocks.access }))
import { processPushRetryQueue } from "@/lib/serverPushRetry"
import { POST } from "@/app/api/notifications/subscribe/route"
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

it("rejects an internal subscription before accessing or writing user data", async () => {
  const response = await POST(new Request("http://fixture.test/", { method: "POST", body: JSON.stringify({ leagueId: "11111111-1111-4111-8111-111111111111", subscription: { endpoint: "https://127.0.0.1/private", keys: { p256dh: "fixture", auth: "fixture" } } }) }))
  expect(response.status).toBe(400)
  expect(mocks.access).not.toHaveBeenCalled()
})

it("discards an old unsafe retry endpoint without making a network request", async () => {
  vi.stubEnv("VAPID_SUBJECT", "mailto:fixture@example.test")
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "fixture")
  vi.stubEnv("VAPID_PRIVATE_KEY", "fixture")
  const updates: Record<string, unknown>[] = []
  const query = {
    select: () => query, eq: () => query, lte: () => query, order: () => query, limit: () => query,
    update: (value: Record<string, unknown>) => { updates.push(value); return query },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [{ id: "retry", endpoint: "https://127.0.0.1/private", attempts: 0 }], error: null }).then(resolve),
  }
  expect(await processPushRetryQueue({ from: () => query })).toEqual({ attempted: 1, sent: 0, discarded: 1 })
  expect(mocks.send).not.toHaveBeenCalled()
  expect(updates[0]).toMatchObject({ status: "discarded", last_error: "invalid_push_endpoint" })
})
