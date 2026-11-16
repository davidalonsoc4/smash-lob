import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  session: vi.fn(),
  requireUser: vi.fn(),
  loadManageable: vi.fn(),
}))
vi.mock("@/lib/supabaseServer", () => ({ createSupabaseServiceClient: mocks.client }))
vi.mock("@/auth", () => ({ auth: mocks.session }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: async () => null }))
vi.mock("@/lib/serverAuth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/serverAuth")>()),
  requireAuthenticatedAppUser: mocks.requireUser,
}))
vi.mock("@/lib/serverPersonalMatches", () => ({ loadManageablePersonalMatch: mocks.loadManageable }))

import { GET } from "@/app/api/public-personal-match/[code]/route"
import { POST } from "@/app/api/personal-matches/[id]/share-link/route"

const matchId = "11111111-1111-4111-8111-111111111111"
const code = "PM-ABCD-EFGH-JKLM"

function database(overrides: { links?: Record<string, unknown>[] } = {}) {
  const tables: Record<string, Record<string, unknown>[]> = {
    personal_match_share_links: overrides.links ?? [{ match_id: matchId, code, is_active: true }],
    personal_matches: [{ id: matchId, played_at: "2026-11-20T18:00:00.000Z", location_name: "Club Norte", sets: [{ a: 6, b: 2 }], status: "finished", created_by_user_id: "secret-creator" }],
    personal_match_participants: [
      { match_id: matchId, team: 1, slot: 1, user_id: "user-1", display_name: "Ana" },
      { match_id: matchId, team: 1, slot: 2, user_id: null, display_name: "Bea" },
      { match_id: matchId, team: 2, slot: 1, user_id: "user-3", display_name: "Carla" },
      { match_id: matchId, team: 2, slot: 2, user_id: null, display_name: "Dani" },
    ],
    app_users: [{ id: "user-1", email: "ana@example.test" }, { id: "outsider", email: "otro@example.test" }],
  }
  const inserted: Record<string, unknown>[] = []
  return {
    inserted,
    from: (table: string) => {
      const filters: [string, unknown][] = []
      let insertRow: Record<string, unknown> | null = null
      const rows = () => (tables[table] ?? []).filter((row) => filters.every(([key, value]) => row[key] === value))
      const query: Record<string, unknown> = {
        select: () => query,
        eq: (key: string, value: unknown) => { filters.push([key, value]); return query },
        insert: (row: Record<string, unknown>) => { insertRow = row; inserted.push(row); tables[table].push(row); return query },
        single: async () => ({ data: insertRow, error: null }),
        maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows(), error: null }).then(resolve),
      }
      return query
    },
  }
}

const publicRequest = () => new Request("http://fixture.test/")
const call = (value: string) => GET(publicRequest(), { params: Promise.resolve({ code: value }) })

beforeEach(() => {
  vi.clearAllMocks()
  mocks.session.mockResolvedValue(null)
})

describe("public friendly share link", () => {
  it("serves a sanitized read-only view to anonymous visitors without ids", async () => {
    mocks.client.mockReturnValue(database())
    const response = await call(code)
    expect(response.status).toBe(200)
    const text = await response.text()
    expect(JSON.parse(text)).toMatchObject({ viewer: "spectator", matchId: null, match: { status: "finished", teams: [["Ana", "Bea"], ["Carla", "Dani"]] } })
    for (const secret of ["user-1", "user-3", "secret-creator", matchId, "ana@example.test"]) expect(text).not.toContain(secret)
  })

  it("keeps signed-in non-participants as spectators", async () => {
    mocks.client.mockReturnValue(database())
    mocks.session.mockResolvedValue({ user: { email: "otro@example.test" } })
    expect(await (await call(code)).json()).toMatchObject({ viewer: "spectator", matchId: null })
  })

  it("sends linked participants to the real match", async () => {
    mocks.client.mockReturnValue(database())
    mocks.session.mockResolvedValue({ user: { email: "ANA@example.test" } })
    expect(await (await call(code)).json()).toMatchObject({ viewer: "participant", matchId })
  })

  it("rejects unknown, inactive and malformed codes", async () => {
    mocks.client.mockReturnValue(database({ links: [{ match_id: matchId, code, is_active: false }] }))
    expect((await call(code)).status).toBe(404)
    expect((await call("!!")).status).toBe(400)
  })
})

describe("friendly share link creation", () => {
  const post = (id = matchId) => POST(new Request("http://fixture.test/", { method: "POST" }), { params: Promise.resolve({ id }) })

  it("requires a signed-in user and permission to manage the match", async () => {
    mocks.requireUser.mockResolvedValueOnce({ ok: false, error: "unauthorized", status: 401 })
    expect((await post()).status).toBe(401)

    mocks.requireUser.mockResolvedValue({ ok: true, actor: { user: { id: "user-1" }, supabase: database() } })
    mocks.loadManageable.mockResolvedValueOnce("forbidden")
    expect((await post()).status).toBe(403)
    mocks.loadManageable.mockResolvedValueOnce(null)
    expect((await post()).status).toBe(404)
    expect((await post("not-a-uuid")).status).toBe(400)
  })

  it("reuses the active link instead of creating another", async () => {
    const supabase = database()
    mocks.requireUser.mockResolvedValue({ ok: true, actor: { user: { id: "user-1" }, supabase } })
    mocks.loadManageable.mockResolvedValue({ id: matchId })
    const body = await (await post()).json()
    expect(body.code).toBe(code)
    expect(body.url).toMatch(new RegExp(`/spectate/match/${code}$`))
    expect(supabase.inserted).toHaveLength(0)
  })

  it("creates a PM- code for the match on first use", async () => {
    const supabase = database({ links: [] })
    mocks.requireUser.mockResolvedValue({ ok: true, actor: { user: { id: "user-1" }, supabase } })
    mocks.loadManageable.mockResolvedValue({ id: matchId })
    const body = await (await post()).json()
    expect(body.code).toMatch(/^PM-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    expect(supabase.inserted[0]).toMatchObject({ match_id: matchId, created_by_user_id: "user-1", is_active: true })
  })
})
