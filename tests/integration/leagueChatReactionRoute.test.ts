import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ actor: vi.fn(), rpc: vi.fn(), broadcast: vi.fn() }))
vi.mock("@/lib/serverLeagueSeasonChatAccess", () => ({ getLeagueSeasonChatActor: mocks.actor }))
vi.mock("@/lib/serverChatRealtime", () => ({ broadcastLeagueSeasonChatRefresh: mocks.broadcast }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: vi.fn().mockResolvedValue(null) }))
vi.mock("@/lib/serverLeagueChatMessages", () => ({
  LEAGUE_CHAT_MESSAGE_FIELDS: "id",
  shapeLeagueChatMessages: vi.fn(async (_actor: unknown, _season: string, rows: Array<{ id: string }>) => rows.map((row) => ({ id: row.id, reactions: [{ key: "fire", count: 1, mine: true }] }))),
}))
import { POST } from "@/app/api/league-season-chats/[seasonId]/reaction/route"

const seasonId = "74000000-0000-4000-8000-000000000001"
const messageId = "75000000-0000-4000-8000-000000000002"
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

describe("reacting to a league chat message", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects malformed reactions", async () => {
    setup()
    expect((await POST(request({ messageId: "nope", reaction: "fire" }), context)).status).toBe(400)
    expect((await POST(request({ messageId, reaction: "🔥" }), context)).status).toBe(400)
    expect((await POST(request({ messageId, reaction: "angry" }), context)).status).toBe(400)
    expect((await POST(request({ messageId }), context)).status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it("reacts as the signed-in person and shares the new reactions", async () => {
    setup()
    const response = await POST(request({ messageId, reaction: "fire" }), context)
    expect(response.status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith("react_league_season_chat_message", { p_season_id: seasonId, p_user_id: userId, p_message_id: messageId, p_reaction: "fire" })
    expect(mocks.broadcast).toHaveBeenCalledWith("league", seasonId, messageId)
    expect((await response.json()).message).toMatchObject({ id: messageId, reactions: [{ key: "fire", count: 1, mine: true }] })
  })

  it("withdraws the reaction with null", async () => {
    setup()
    expect((await POST(request({ messageId, reaction: null }), context)).status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith("react_league_season_chat_message", expect.objectContaining({ p_reaction: null }))
  })

  it("does not react in a finished season or to a message that does not exist", async () => {
    setup("season_chat_read_only")
    expect((await POST(request({ messageId, reaction: "fire" }), context)).status).toBe(409)
    setup("season_chat_message_not_found")
    expect((await POST(request({ messageId, reaction: "fire" }), context)).status).toBe(404)
  })

  it("answers like a missing chat to someone who is not a participant", async () => {
    mocks.actor.mockResolvedValue({ ok: false, status: 404, error: "league_chat_not_found" })
    expect((await POST(request({ messageId, reaction: "fire" }), context)).status).toBe(404)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
})
