import { createHash } from "node:crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), creator: vi.fn(), auth: vi.fn(), service: vi.fn(), rate: vi.fn() }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: mocks.rate }))
vi.mock("@/lib/serverRapidTournaments", () => ({ requireRapidTournamentCreator: mocks.creator }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: mocks.auth }))
vi.mock("@/lib/supabaseServer", () => ({ createSupabaseServiceClient: mocks.service }))
vi.mock("@/lib/appUrl", () => ({ getPublicAppBaseUrl: () => "https://pre.smashandlob.com" }))

import { GET as previewInvite } from "@/app/api/tournament-invites/[code]/route"
import { POST as claimInvite } from "@/app/api/tournament-invites/[code]/claim/route"
import { POST as createInvite } from "@/app/api/tournaments/[id]/invite/route"

const token = "a".repeat(43), tournamentId = "47b0b645-4790-491f-8f15-b1fe8bf8be13", playerId = "a2bd4f89-621c-4be5-9e4f-5e2decc003c9"
describe("rapid tournament shared invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.rate.mockResolvedValue(null); mocks.rpc.mockResolvedValue({ data: true, error: null })
    mocks.creator.mockResolvedValue({ ok: true, tournamentId, actor: { user: { id: "creator-uuid" }, supabase: { rpc: mocks.rpc } } })
    mocks.auth.mockResolvedValue({ ok: true, actor: { user: { id: "claimed-user" }, supabase: { rpc: vi.fn(async () => ({ data: tournamentId, error: null })) } } })
    mocks.service.mockReturnValue({ from: (table: string) => { const query: Record<string, unknown> = {}; for (const method of ["select", "eq", "gt", "is", "order"]) query[method] = vi.fn(() => query); query.maybeSingle = vi.fn(async () => table === "rapid_tournament_join_invites" ? { data: { tournament_id: tournamentId, expires_at: "2026-11-01T00:00:00Z", revoked_at: null }, error: null } : { data: { id: tournamentId, name: "Americana", starts_at: "2026-10-30T09:00:00Z", status: "draft" }, error: null }); query.then = (resolve: (value: unknown) => unknown) => resolve({ data: [{ id: playerId, full_name: "Jugador" }], error: null }); return query } })
  })
  it("only previews an active opaque shared token with available profiles", async () => {
    expect((await previewInvite(new Request("http://localhost"), { params: Promise.resolve({ code: "short" }) })).status).toBe(404)
    const response = await previewInvite(new Request("http://localhost"), { params: Promise.resolve({ code: token }) })
    expect(response.status).toBe(200); const data = await response.json()
    expect(data).toMatchObject({ tournament: { id: tournamentId }, players: [{ id: playerId, name: "Jugador" }] })
    expect(JSON.stringify(data)).not.toContain(createHash("sha256").update(token).digest("hex"))
  })
  it("claims only the selected profile through the authenticated shared-invite RPC", async () => {
    const rpc = vi.fn(async () => ({ data: tournamentId, error: null })); mocks.auth.mockResolvedValueOnce({ ok: true, actor: { user: { id: "claimed-user" }, supabase: { rpc } } })
    const response = await claimInvite(new Request("http://localhost", { method: "POST", body: JSON.stringify({ playerId }), headers: { "Content-Type": "application/json" } }), { params: Promise.resolve({ code: token }) })
    expect(response.status).toBe(200); expect(rpc).toHaveBeenCalledWith("claim_rapid_tournament_join_invite", { p_code_hash: createHash("sha256").update(token).digest("hex"), p_user_id: "claimed-user", p_player_id: playerId })
  })
  it("creates one common invite only for the tournament creator", async () => {
    const response = await createInvite(new Request("http://localhost", { method: "POST" }), { params: Promise.resolve({ id: tournamentId }) })
    expect(response.status).toBe(200); const payload = await response.json(); expect(payload.url).toContain("/tournament-invite/")
    expect(mocks.rpc).toHaveBeenCalledWith("create_rapid_tournament_join_invite", expect.objectContaining({ p_tournament_id: tournamentId, p_creator_user_id: "creator-uuid", p_code_hash: expect.stringMatching(/^[0-9a-f]{64}$/) }))
  })
})
