import { beforeEach, describe, expect, it, vi } from "vitest"

import { CHAT_LIST_ACCOUNT_HEADER } from "@/lib/chatListMemory"

const mocks = vi.hoisted(() => ({ auth: vi.fn() }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: mocks.auth }))
vi.mock("@/lib/serverChatRealtime", () => ({ broadcastLeagueSeasonChatRefresh: vi.fn(), broadcastLeagueSeasonReadReceipt: vi.fn(), getLeagueSeasonChatRealtimeTopic: () => "topic" }))
import { GET, PATCH, POST } from "@/app/api/league-season-chats/[seasonId]/route"

const seasonId = "74000000-0000-4000-8000-000000000001"
const userId = "71000000-0000-4000-8000-000000000001"
const context = { params: Promise.resolve({ seasonId }) }
function setup(options: { participant?: boolean; registered?: boolean; status?: string; rpcError?: string; messages?: unknown[]; lastReadAt?: string; members?: unknown[]; profiles?: unknown[] } = {}) {
  const rpc = vi.fn().mockResolvedValue({ data: { id: "message" }, error: options.rpcError ? { message: options.rpcError } : null })
  const calls: string[] = []
  const from = vi.fn((table: string) => {
    calls.push(table)
    const query = {
      select: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: table === "seasons" ? { id: seasonId, league_id: "league", name: "Temporada", status: options.status ?? "active" } : options.participant === false || (table === "season_players" && options.registered === false) ? null : { player_id: "player", last_read_at: options.lastReadAt ?? null }, error: null }),
      then(resolve: (value: unknown) => void) { const data = table === "league_season_chat_messages" ? options.messages ?? [] : table === "league_season_chat_participants" ? options.members ?? [] : table === "app_users" ? options.profiles ?? [] : []; return Promise.resolve({ data, error: null, count: 0 }).then(resolve) },
    }
    return query
  })
  mocks.auth.mockResolvedValue({ ok: true, actor: { user: { id: userId, email: "a@example.invalid", displayName: "Jugador" }, supabase: { from, rpc: (name: string, args: unknown) => (name === "league_season_chat_reaction_summary" ? Promise.resolve({ data: [], error: null }) : rpc(name, args)) } } })
  return { rpc, calls }
}
const get = () => new Request(`http://localhost/api/league-season-chats/${seasonId}?markRead=0`)
const messageId = "74000000-0000-4000-8000-000000000003"
const patch = (body: string | null, account = "a@example.invalid") => new Request(get().url, {
  method: "PATCH", headers: { "content-type": "application/json", [CHAT_LIST_ACCOUNT_HEADER]: encodeURIComponent(account) },
  body: JSON.stringify({ messageId, body }),
})
const post = () => new Request(`http://localhost/api/league-season-chats/${seasonId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: "Hola" }) })

describe("league season chat", () => {
  beforeEach(() => vi.resetAllMocks())
  it("denies nonparticipants before reading messages", async () => {
    const { calls } = setup({ participant: false })
    expect((await GET(get(), context)).status).toBe(404)
    expect(calls).not.toContain("league_season_chat_messages")
  })
  it("returns a finished season as read-only", async () => {
    setup({ status: "finished" })
    expect(await (await GET(get(), context)).json()).toMatchObject({ readOnly: true })
  })
  it("lets a linked preseason player read and send", async () => {
    const { rpc } = setup({ status: "upcoming" })
    expect(await (await GET(get(), context)).json()).toMatchObject({ readOnly: false })
    expect((await POST(post(), context)).status).toBe(201)
    expect(rpc).toHaveBeenCalledOnce()
  })
  it("rejects a removed preseason player even if a participant snapshot remains", async () => {
    const { calls, rpc } = setup({ status: "upcoming", registered: false })
    expect((await GET(get(), context)).status).toBe(404)
    expect((await POST(post(), context)).status).toBe(404)
    expect(calls).not.toContain("league_season_chat_messages")
    expect(rpc).not.toHaveBeenCalled()
  })
  it("returns a summary without reading participant profiles or marking the chat read", async () => {
    const { calls } = setup({ messages: [{ sender_display_name: "Ana", body: "Hola", created_at: "2026-11-03T10:00:00Z" }] })
    const response = await GET(new Request(get().url + "&summary=1"), context)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    const body = await response.json()
    expect(body).toMatchObject({ messages: [{ body: "Hola" }], participantCount: 0, unread: 0 })
    expect(body).not.toHaveProperty("participants")
    expect(calls).not.toContain("app_users")
  })
  it("counts unread messages from other participants only", async () => {
    setup({ lastReadAt: "2026-11-01T10:00:00Z", messages: [
      { id: "3", sender_user_id: userId, created_at: "2026-11-03T10:00:00Z" },
      { id: "2", sender_user_id: "other", created_at: "2026-11-02T10:00:00Z" },
      { id: "1", sender_user_id: "other", created_at: "2026-10-31T10:00:00Z" },
    ] })
    expect(await (await GET(get(), context)).json()).toMatchObject({ unread: 1 })
  })
  it("supplies participant avatars and read timestamps for chat receipts", async () => {
    setup({ members: [{ user_id: "other", player_id: "p2", last_read_at: "2026-11-03T10:00:00Z" }], profiles: [{ id: "other", display_name: "Ana", avatar_url: "https://example.test/ana.png" }] })
    expect(await (await GET(get(), context)).json()).toMatchObject({ participants: [{ userId: "other", displayName: "Ana", avatarUrl: "https://example.test/ana.png", lastReadAt: "2026-11-03T10:00:00Z" }] })
  })
  it("validates edit and deletion requests and scopes the change to the authenticated author", async () => {
    const { rpc } = setup()
    expect((await PATCH(patch("  "), context)).status).toBe(400)
    expect((await PATCH(patch("Hola", "other@example.invalid"), context)).status).toBe(403)
    expect(rpc).not.toHaveBeenCalled()
    expect((await PATCH(patch(" Nuevo texto "), context)).status).toBe(200)
    expect(rpc).toHaveBeenLastCalledWith("change_league_season_chat_message", { p_season_id: seasonId, p_user_id: userId, p_message_id: messageId, p_body: "Nuevo texto" })
    expect((await PATCH(patch(null), context)).status).toBe(200)
    expect(rpc).toHaveBeenLastCalledWith("change_league_season_chat_message", expect.objectContaining({ p_body: null }))
  })
  it("rejects an edit or deletion after the time limit", async () => {
    setup({ rpcError: "season_chat_change_expired" })
    expect((await PATCH(patch("Tarde"), context)).status).toBe(409)
    expect((await PATCH(patch(null), context)).status).toBe(409)
  })
  it("only the creator or an administrator can create a poll, and a poll cannot carry media", async () => {
    const { rpc } = setup()
    const poll = (extra: Record<string, unknown> = {}) => new Request(`http://localhost/api/league-season-chats/${seasonId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: "¿Qué día?", poll: { options: ["Martes", "Jueves"] }, ...extra }) })
    expect((await POST(poll(), context)).status).toBe(403)
    expect((await POST(poll({ mediaPath: "x" }), context)).status).toBe(400)
    expect((await POST(poll({ body: "" }), context)).status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })
  it("only the creator or an administrator can post an announcement", async () => {
    const { rpc } = setup()
    const request = new Request(`http://localhost/api/league-season-chats/${seasonId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: "Importante", announcement: true }) })
    expect((await POST(request, context)).status).toBe(403)
    expect(rpc).not.toHaveBeenCalled()
  })
  it("rejects changes to other users' messages and changes in finished seasons", async () => {
    setup({ rpcError: "season_chat_message_not_found" })
    expect((await PATCH(patch(null), context)).status).toBe(404)
    const { rpc } = setup({ status: "finished" })
    expect((await PATCH(patch(null), context)).status).toBe(409)
    expect(rpc).not.toHaveBeenCalled()
  })
  it("uses the database guard for writes and handles a season closing", async () => {
    const { rpc } = setup({ rpcError: "season_chat_read_only" })
    expect((await POST(post(), context)).status).toBe(409)
    expect(rpc).toHaveBeenCalledWith("send_league_season_chat_message", expect.objectContaining({ p_user_id: userId, p_season_id: seasonId }))
  })
})
