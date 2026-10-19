import { createHash } from "node:crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ service: vi.fn(), auth: vi.fn(), creator: vi.fn(), rpc: vi.fn() }))
vi.mock("@/lib/supabaseServer", () => ({ createSupabaseServiceClient: mocks.service }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: mocks.auth }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: vi.fn(async () => null) }))
vi.mock("@/lib/serverRapidTournaments", () => ({ requireRapidTournamentCreator: mocks.creator }))

import { GET as previewInvite } from "@/app/api/tournament-invites/[code]/route"
import { POST as claimInvite } from "@/app/api/tournament-invites/[code]/claim/route"
import { POST as createInvite } from "@/app/api/tournaments/[id]/invites/[playerId]/route"

const token = "a".repeat(43)
const tournamentId = "47b0b645-4790-491f-8f15-b1fe8bf8be13"
const playerId = "a2bd4f89-621c-4be5-9e4f-5e2decc003c9"

describe("rapid tournament private invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.rpc.mockResolvedValue({ data: true, error: null })
    mocks.creator.mockResolvedValue({ ok: true, tournamentId, actor: { user: { id: "creator-uuid" }, supabase: { rpc: mocks.rpc } } })
    mocks.auth.mockResolvedValue({
      ok: true,
      actor: { user: { id: "claimed-user" }, supabase: { rpc: vi.fn(async () => ({ data: tournamentId, error: null })) } },
    })
    mocks.service.mockReturnValue({ from: (table: string) => {
      const query: Record<string, unknown> = {}
      for (const method of ["select", "eq", "gt", "is"]) query[method] = vi.fn(() => query)
      query.maybeSingle = vi.fn(async () => table === "rapid_tournament_invites"
        ? { data: { tournament_id: tournamentId, player_id: playerId, expires_at: "2026-11-01T00:00:00Z", claimed_at: null, revoked_at: null }, error: null }
        : table === "rapid_tournaments"
          ? { data: { id: tournamentId, name: "Americana", starts_at: "2026-10-30T09:00:00Z", status: "draft" }, error: null }
          : { data: { full_name: "Jugador" }, error: null })
      return query
    } })
  })

  it("only previews an active opaque token and never returns its hash", async () => {
    expect((await previewInvite(new Request("http://localhost"), { params: Promise.resolve({ code: "short" }) })).status).toBe(404)
    const response = await previewInvite(new Request("http://localhost"), { params: Promise.resolve({ code: token }) })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toMatchObject({ tournament: { id: tournamentId, name: "Americana" }, playerName: "Jugador" })
    expect(JSON.stringify(data)).not.toContain(createHash("sha256").update(token).digest("hex"))
  })

  it("binds a claimed invite to the authenticated account using only the token hash", async () => {
    const rpc = vi.fn(async () => ({ data: tournamentId, error: null }))
    mocks.auth.mockResolvedValueOnce({ ok: true, actor: { user: { id: "claimed-user" }, supabase: { rpc } } })
    const response = await claimInvite(new Request("http://localhost", { method: "POST" }), { params: Promise.resolve({ code: token }) })
    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith("claim_rapid_tournament_invite", { p_code_hash: createHash("sha256").update(token).digest("hex"), p_user_id: "claimed-user" })
  })

  it("creates an invitation only for a creator and an eligible unlinked player", async () => {
    const response = await createInvite(new Request("http://localhost", { method: "POST" }), { params: Promise.resolve({ id: tournamentId, playerId }) })
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.url).toContain("/tournament-invite/")
    expect(mocks.rpc).toHaveBeenCalledWith("create_rapid_tournament_invite", expect.objectContaining({
      p_tournament_id: tournamentId, p_player_id: playerId, p_creator_user_id: "creator-uuid",
      p_code_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
    }))
    expect(payload.url).not.toContain(mocks.rpc.mock.calls[0][1].p_code_hash)
  })
})
