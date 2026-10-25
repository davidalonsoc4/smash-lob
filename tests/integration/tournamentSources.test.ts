import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ auth: vi.fn(), limited: vi.fn() }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: mocks.auth }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: mocks.limited }))
import { GET } from "@/app/api/tournaments/sources/route"

function fixture(superuser = false, errorTable?: string) {
  const calls: Array<{ table: string; column: string; value: unknown }> = []
  const data: Record<string, unknown[]> = {
    league_memberships: [{ league_id: "managed" }],
    leagues: [{ id: "managed", name: "Mi liga" }],
    seasons: [{ id: "season-1", league_id: "managed", name: "Temporada 1" }],
  }
  const from = vi.fn((table: string) => {
    const query = {
      select: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
      eq(column: string, value: unknown) { calls.push({ table, column, value }); return query },
      in(column: string, value: unknown) { calls.push({ table, column, value }); return query },
      then(resolve: (result: unknown) => void) { return Promise.resolve({ data: data[table], error: table === errorTable ? { code: "test" } : null }).then(resolve) },
    }
    return query
  })
  mocks.auth.mockResolvedValue({ ok: true, actor: { supabase: { from }, user: { id: "organizer", isSuperuser: superuser } } })
  return { calls, data, from }
}
const request = () => new Request("http://localhost/api/tournaments/sources")

describe("tournament season sources", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.limited.mockResolvedValue(null) })
  it("returns only administrated seasons and constrains both queries on the server", async () => {
    const { calls } = fixture()
    const response = await GET(request())
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(await response.json()).toEqual({ sources: [{ leagueId: "managed", leagueName: "Mi liga", seasonId: "season-1", seasonName: "Temporada 1" }] })
    expect(calls).toContainEqual({ table: "league_memberships", column: "user_id", value: "organizer" })
    expect(calls).toContainEqual({ table: "league_memberships", column: "role", value: ["creator", "admin"] })
    expect(calls).toContainEqual({ table: "leagues", column: "id", value: ["managed"] })
    expect(calls).toContainEqual({ table: "seasons", column: "league_id", value: ["managed"] })
  })
  it("does not query seasons for a player without administration permissions", async () => {
    const { data, from } = fixture(); data.league_memberships = []
    expect(await (await GET(request())).json()).toEqual({ sources: [] })
    expect(from).toHaveBeenCalledTimes(1)
  })
  it("allows application superusers without fabricating league memberships", async () => {
    const { calls, from } = fixture(true)
    expect((await GET(request())).status).toBe(200)
    expect(from).not.toHaveBeenCalledWith("league_memberships")
    expect(calls).toEqual([])
  })
  it.each(["league_memberships", "leagues", "seasons"])("fails closed when %s cannot be read", async table => {
    fixture(false, table)
    const response = await GET(request())
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: "tournament_source_lookup_failed" })
  })
  it("requires authentication", async () => {
    mocks.auth.mockResolvedValue({ ok: false, status: 401, error: "unauthenticated" })
    expect((await GET(request())).status).toBe(401)
  })
  it("honours rate limits before querying accounts", async () => {
    mocks.limited.mockResolvedValue(new Response(null, { status: 429 }))
    expect((await GET(request())).status).toBe(429)
    expect(mocks.auth).not.toHaveBeenCalled()
  })
})
