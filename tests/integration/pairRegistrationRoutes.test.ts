import { beforeEach, expect, it, vi } from "vitest"
import { POST as join } from "@/app/api/leagues/[id]/seasons/[seasonId]/registration/route"
import { PATCH as save } from "@/app/api/leagues/[id]/seasons/[seasonId]/pairs/route"
import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"

const league = "10000000-0000-4000-8000-000000000001", season = "20000000-0000-4000-8000-000000000001"
const players = [1,2,3,4].map(index => `30000000-0000-4000-8000-${String(index).padStart(12,"0")}`)
const user = "40000000-0000-4000-8000-000000000001"
const state = vi.hoisted(() => ({ allowed: true, error: null as string | null, rpc: vi.fn() }))
function actor() {
  const q = { select: () => q, eq: () => q, in: () => q, single: async () => ({ data: { league_id: league, player_id: players[0], role: "player" }, error: null }), then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve) }
  return { user: { id: user, email: "fixture@example.test", profileCompletedAt: "2026-01-01", isSuperuser: false }, supabase: { from: () => q, rpc: state.rpc } } as unknown as ServerLeagueActor
}
vi.mock("@/lib/serverLeagueAccess", () => ({ getServerLeagueActor: async () => state.allowed ? { ok: true, actor: actor() } : { ok: false, status: 403, error: "forbidden" } }))
vi.mock("@/lib/serverSeasonAccess", () => ({ requireMutableSeasonForActor: async () => ({ ok: true }), getServerSeasonAdmin: async () => state.allowed ? { ok: true, actor: actor(), season: { status: "upcoming" } } : { ok: false, status: 403, error: "forbidden" } }))
vi.mock("@/lib/serverActivityWrite", () => ({ recordServerActorActivity: async () => undefined }))
vi.mock("@/lib/serverSeasonWaitlist", () => ({ assertSeasonWaitlistEligible: vi.fn(), joinSeasonWaitlist: vi.fn() }))
const params = { params: Promise.resolve({ id: league, seasonId: season }) }
const request = (method: string, body?: unknown) => new Request("http://localhost/api/fixture", { method, ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) })
beforeEach(() => {
  state.allowed = true; state.error = null; state.rpc.mockReset()
  state.rpc.mockImplementation(async name => ({ data: name === "server_set_registration_pairs" ? true : [{ player_id: players[0], registered_count: 2, player_capacity: 4, roster_complete: false }], error: state.error ? { message: state.error } : null }))
})
it("preserves the individual registration RPC and identity", async () => {
  const response = await join(request("POST"), params)
  expect(response.status).toBe(200)
  expect(state.rpc).toHaveBeenCalledWith("server_join_self_registration_season_v2", expect.objectContaining({ p_user_id: user, p_historical_player_id: null }))
  expect((await response.json()).membership.playerId).toBe(players[0])
})
it.each([players[1], null])("persists partner selection %s through the atomic server RPC", async partnerPlayerId => {
  expect((await join(request("POST", { partnerPlayerId }), params)).status).toBe(200)
  expect(state.rpc).toHaveBeenCalledWith("server_join_pair_registration", expect.objectContaining({ p_user_id: user, p_partner_player_id: partnerPlayerId }))
})
it("rejects malformed partners before any mutation", async () => {
  expect((await join(request("POST", { partnerPlayerId: "unknown" }), params)).status).toBe(400)
  expect(state.rpc).not.toHaveBeenCalled()
})
it("returns a recoverable conflict for a taken partner", async () => {
  state.error = "partner_unavailable"
  expect((await join(request("POST", { partnerPlayerId: players[1] }), params)).status).toBe(409)
})
const edit = () => ({ roster: Object.fromEntries(players.map(id => [id, null])), pairs: [[players[0],players[1]],[players[2],players[3]]] })
it("requires organizer access before changing pairs", async () => {
  state.allowed = false
  expect((await save(request("PATCH", edit()), params)).status).toBe(403)
  expect(state.rpc).not.toHaveBeenCalled()
})
it("uses the authenticated actor and roster snapshot for an organizer edit", async () => {
  const response = await save(request("PATCH", { ...edit(), actorUserId: players[3] }), params)
  expect(response.status).toBe(200)
  expect(state.rpc).toHaveBeenCalledWith("server_set_registration_pairs", expect.objectContaining({ p_actor_user_id: user, p_roster: edit().roster, p_pairs: edit().pairs }))
  expect(await response.json()).toMatchObject({ calendarInvalidated: true })
})
it.each(["roster_changed", "played_calendar_immutable", "registration_closed"])("preserves %s as a conflict", async code => {
  state.error = code
  expect((await save(request("PATCH", edit()), params)).status).toBe(409)
})
it("rejects repeated or foreign players before calling the database", async () => {
  const body = edit(); body.pairs[1][0] = players[0]
  expect((await save(request("PATCH", body), params)).status).toBe(400)
  expect(state.rpc).not.toHaveBeenCalled()
})
