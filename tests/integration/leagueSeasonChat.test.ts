import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ auth: vi.fn() }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: mocks.auth }))
vi.mock("@/lib/serverChatRealtime", () => ({ broadcastLeagueSeasonChatRefresh: vi.fn(), getLeagueSeasonChatRealtimeTopic: () => "topic" }))
import { GET, POST } from "@/app/api/league-season-chats/[seasonId]/route"

const seasonId = "74000000-0000-4000-8000-000000000001"
const userId = "71000000-0000-4000-8000-000000000001"
const context = { params: Promise.resolve({ seasonId }) }
function setup(options: { participant?: boolean; registered?: boolean; status?: string; rpcError?: string; messages?: unknown[]; lastReadAt?: string; members?: unknown[]; profiles?: unknown[] } = {}) {
  const rpc = vi.fn().mockResolvedValue({ data: { id: "message" }, error: options.rpcError ? { message: options.rpcError } : null })
  const calls: string[] = []
  const from = vi.fn((table: string) => {
    calls.push(table)
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: table === "seasons" ? { id: seasonId, league_id: "league", name: "Temporada", status: options.status ?? "active" } : options.participant === false || (table === "season_players" && options.registered === false) ? null : { player_id: "player", last_read_at: options.lastReadAt ?? null }, error: null }),
      then(resolve: (value: unknown) => void) { const data = table === "league_season_chat_messages" ? options.messages ?? [] : table === "league_season_chat_participants" ? options.members ?? [] : table === "app_users" ? options.profiles ?? [] : []; return Promise.resolve({ data, error: null, count: 0 }).then(resolve) },
    }
    return query
  })
  mocks.auth.mockResolvedValue({ ok: true, actor: { user: { id: userId, email: "a@example.invalid", displayName: "Jugador" }, supabase: { from, rpc } } })
  return { rpc, calls }
}
const get = () => new Request(`http://localhost/api/league-season-chats/${seasonId}?markRead=0`)
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
  it("uses the database guard for writes and handles a season closing", async () => {
    const { rpc } = setup({ rpcError: "season_chat_read_only" })
    expect((await POST(post(), context)).status).toBe(409)
    expect(rpc).toHaveBeenCalledWith("send_league_season_chat_message", expect.objectContaining({ p_user_id: userId, p_season_id: seasonId }))
  })
})
