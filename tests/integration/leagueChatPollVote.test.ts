import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ actor: vi.fn(), rpc: vi.fn(), broadcast: vi.fn() }))
vi.mock("@/lib/serverLeagueSeasonChatAccess", () => ({ getLeagueSeasonChatActor: mocks.actor }))
vi.mock("@/lib/serverChatRealtime", () => ({ broadcastLeagueSeasonChatRefresh: mocks.broadcast }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: vi.fn().mockResolvedValue(null) }))
vi.mock("@/lib/serverLeagueChatMessages", () => ({
  LEAGUE_CHAT_MESSAGE_FIELDS: "id",
  shapeLeagueChatMessages: vi.fn(async (_actor: unknown, _season: string, rows: Array<{ id: string }>) => rows.map((row) => ({ id: row.id, poll: { total: 1 } }))),
}))
import { POST } from "@/app/api/league-season-chats/[seasonId]/poll/route"

const seasonId = "74000000-0000-4000-8000-000000000001"
const messageId = "75000000-0000-4000-8000-000000000002"
const optionId = "76000000-0000-4000-8000-000000000003"
const userId = "71000000-0000-4000-8000-000000000001"
const context = { params: Promise.resolve({ seasonId }) }
const request = (body: unknown) => new Request("http://localhost/poll", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })

function setup(rpcError?: string) {
  mocks.rpc.mockResolvedValue({ error: rpcError ? { message: rpcError } : null })
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: messageId }, error: null }),
  }
  mocks.actor.mockResolvedValue({
    ok: true,
    season: { league_id: "league", status: "active" },
    actor: { user: { id: userId }, supabase: { rpc: mocks.rpc, from: vi.fn(() => query) } },
  })
}

describe("voting in a league chat poll", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects malformed votes", async () => {
    setup()
    expect((await POST(request({ messageId: "nope", optionId }), context)).status).toBe(400)
    expect((await POST(request({ messageId, optionId: "nope" }), context)).status).toBe(400)
    expect((await POST(request({ messageId }), context)).status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it("votes as the signed-in person and shares the new result", async () => {
    setup()
    const response = await POST(request({ messageId, optionId }), context)
    expect(response.status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith("vote_league_season_chat_poll", { p_season_id: seasonId, p_user_id: userId, p_message_id: messageId, p_option_id: optionId })
    expect(mocks.broadcast).toHaveBeenCalledWith("league", seasonId, messageId)
    expect((await response.json()).message.id).toBe(messageId)
  })

  it("withdraws a vote with a null option", async () => {
    setup()
    expect((await POST(request({ messageId, optionId: null }), context)).status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith("vote_league_season_chat_poll", expect.objectContaining({ p_option_id: null }))
  })

  it("does not vote in a finished season or in a poll that does not exist", async () => {
    setup("season_chat_read_only")
    expect((await POST(request({ messageId, optionId }), context)).status).toBe(409)
    setup("season_chat_poll_not_found")
    expect((await POST(request({ messageId, optionId }), context)).status).toBe(404)
  })

  it("answers like a missing chat to someone who is not a participant", async () => {
    mocks.actor.mockResolvedValue({ ok: false, status: 404, error: "league_chat_not_found" })
    expect((await POST(request({ messageId, optionId }), context)).status).toBe(404)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
})
