import { expect, it, vi } from "vitest"
const gate = vi.hoisted(() => vi.fn())
vi.mock("@/lib/serverMatchAccess", () => ({ getServerMatchActor: gate }))
vi.mock("@/lib/serverActivityWrite", () => ({ recordServerActorActivity: vi.fn() }))
vi.mock("@/lib/serverChatRealtime", () => ({ broadcastMatchChatRefresh: vi.fn() }))
import { PUT } from "@/app/api/matches/[matchId]/result/route"

it("rejects a two-set tie before writing a league result", async () => {
  const update = vi.fn()
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { requires_three_sets: false }, error: null }), update }
  gate.mockResolvedValue({ ok: true, actor: { isAdmin: true, user: { id: "fixture" }, match: { status: "scheduling", leagueId: "league", seasonId: "season" }, supabase: { from: () => query } } })
  const response = await PUT(new Request("http://fixture.test/", { method: "PUT", body: JSON.stringify({ sets: [{ a: 6, b: 0 }, { a: 0, b: 6 }] }) }), { params: Promise.resolve({ matchId: "11111111-1111-4111-8111-111111111111" }) })
  expect(response.status).toBe(400)
  expect(update).not.toHaveBeenCalled()
})
