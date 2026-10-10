import { expect, it, vi } from "vitest"
const gate = vi.hoisted(() => vi.fn())
vi.mock("@/lib/serverMatchAccess", () => ({ getServerMatchActor: gate }))
vi.mock("@/lib/serverChatRealtime", () => ({ getMatchChatRealtimeTopic: () => null, broadcastMatchChatRefresh: async () => null }))
import { GET } from "@/app/api/matches/[matchId]/chat/route"

it("keeps approved coordination after its proposal leaves the recent message window", async () => {
  const matchId = "11111111-1111-4111-8111-111111111111"
  const participants = ["a", "b", "c", "d"].map((id) => ({ id, userId: `user-${id}` }))
  const proposal = { id: "proposal", kind: "date_proposal", payload: { options: [{ key: "date-1", startsAt: "2099-01-05T18:00:00Z" }] }, created_at: "2026-10-01T00:00:00Z", sender_user_id: "user-a" }
  const tables: Record<string, Array<Record<string, unknown>>> = {
    players: participants.map((p) => ({ id: p.id, display_name: p.id })),
    league_memberships: participants.map((p) => ({ player_id: p.id, user_id: p.userId })), app_users: [], seasons: [{ status: "active" }],
    match_chat_messages: [...Array.from({ length: 60 }, (_, i) => ({ id: `text-${i}`, kind: "text", body: "Fixture", payload: {}, created_at: "2026-10-02T00:00:00Z", sender_user_id: "user-a" })), proposal],
    match_chat_proposal_responses: participants.map((p) => ({ message_id: proposal.id, user_id: p.userId, option_key: "date-1", response: "available" })), match_chat_reads: [],
  }
  const db = { from: (table: string) => {
    let limit = Infinity
    const filters: Array<(row: Record<string, unknown>) => boolean> = []
    const q = { select: () => q, eq: () => q,
      in: (key: string, values: unknown[]) => { filters.push((row) => values.includes(row[key])); return q },
      order: () => q, limit: (value: number) => { limit = value; return q },
      maybeSingle: async () => ({ data: tables[table]?.[0], error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: (tables[table] ?? []).filter((row) => filters.every((filter) => filter(row))).slice(0, limit), error: null }).then(resolve),
    }
    return q
  } }
  gate.mockResolvedValue({ ok: true, actor: { supabase: db, user: { id: "user-a", isSuperuser: false }, participantPlayerId: "a", isAdmin: false, match: { id: matchId, leagueId: "league", seasonId: "season", participantIds: participants.map((p) => p.id), status: "scheduling", round: 1, resultRecordedAt: null } } })
  const response = await GET(new Request("http://fixture.test/chat?markRead=0"), { params: Promise.resolve({ matchId }) })
  if (!response) throw new Error("Expected a chat response")
  const payload = await response.json()
  expect(response.status).toBe(200)
  expect(payload.messages).toHaveLength(60)
  expect(payload.coordination.status).toBe("awaiting_booking")
  expect(payload.coordination.approvedDates).toHaveLength(1)
})
