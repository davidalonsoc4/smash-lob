import { beforeEach, describe, expect, it, vi } from "vitest"

const getServerLeagueActor = vi.fn()

vi.mock("@/lib/serverLeagueAccess", () => ({
  getServerLeagueActor,
}))

const { POST } = await import("@/app/api/notifications/unsubscribe/route")

describe("notification unsubscribe API", () => {
  beforeEach(() => {
    getServerLeagueActor.mockReset()
  })

  it("rejects cross-league access before touching subscriptions", async () => {
    getServerLeagueActor.mockResolvedValue({
      ok: false,
      status: 403,
      error: "forbidden",
    })

    const response = await POST(
      new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        body: JSON.stringify({
          leagueId: "019fc39c-26cf-43e1-9d4b-9439d3366675",
          endpoint: "https://push.example/device",
        }),
      }),
    )

    expect(response.status).toBe(403)
    expect(getServerLeagueActor).toHaveBeenCalledWith(
      "019fc39c-26cf-43e1-9d4b-9439d3366675",
      { requireMember: true },
    )
  })

  it("deletes only the current user's exact league endpoint", async () => {
    const query = {
      delete: vi.fn(),
      eq: vi.fn(),
      then: (resolve: (value: { error: null }) => void) =>
        resolve({ error: null }),
    }
    query.delete.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    const from = vi.fn().mockReturnValue(query)

    getServerLeagueActor.mockResolvedValue({
      ok: true,
      actor: {
        supabase: { from },
        user: { email: "member@example.test" },
      },
    })

    const response = await POST(
      new Request("http://localhost/api/notifications/unsubscribe", {
        method: "POST",
        body: JSON.stringify({
          leagueId: "019fc39c-26cf-43e1-9d4b-9439d3366675",
          endpoint: "https://push.example/device",
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(from).toHaveBeenCalledWith("push_subscriptions")
    expect(query.delete).toHaveBeenCalledOnce()
    expect(query.eq.mock.calls).toEqual([
      ["league_id", "019fc39c-26cf-43e1-9d4b-9439d3366675"],
      ["endpoint", "https://push.example/device"],
      ["user_email", "member@example.test"],
    ])
  })
})
