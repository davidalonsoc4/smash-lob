import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ dispatch: vi.fn(), log: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/serverPushDispatch", () => ({ dispatchPushForActivityEvent: mocks.dispatch }))
vi.mock("@/lib/serverLog", () => ({ logServerEvent: mocks.log }))

import { insertServerActivityEvent } from "@/lib/serverActivityWrite"

const supabase = { from: () => ({ insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: "e1" }, error: null }) }) }) }) } as never
const create = () => insertServerActivityEvent({ supabase, leagueId: "L1", actorEmail: "a@example.com", actorDisplayName: "A", type: "league_chat_announcement", title: "t" })

describe("activity push leaves a trace when it cannot be sent", () => {
  beforeEach(() => vi.clearAllMocks())

  it("logs the reason (e.g. missing VAPID) and still returns the event", async () => {
    mocks.dispatch.mockResolvedValue({ ok: false, sent: 0, reason: "missing_vapid" })
    await expect(create()).resolves.toBe("e1")
    expect(mocks.log).toHaveBeenCalledWith("warn", "activity_push_not_sent", expect.objectContaining({ errorCode: "missing_vapid", leagueId: "L1" }))
  })

  it("logs when the dispatch throws, without breaking the activity", async () => {
    mocks.dispatch.mockRejectedValue(new Error("boom"))
    await expect(create()).resolves.toBe("e1")
    expect(mocks.log).toHaveBeenCalledWith("warn", "activity_push_not_sent", expect.objectContaining({ errorCode: "dispatch_exception" }))
  })

  it("stays quiet when the push was handled", async () => {
    mocks.dispatch.mockResolvedValue({ ok: true, sent: 1 })
    await create()
    expect(mocks.log).not.toHaveBeenCalled()
  })
})
