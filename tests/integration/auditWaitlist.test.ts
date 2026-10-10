import { beforeEach, expect, it, vi } from "vitest"
const gate = vi.hoisted(() => vi.fn())
vi.mock("@/lib/serverLeagueAccess", () => ({ getServerLeagueActor: gate }))
import { GET } from "@/app/api/leagues/[id]/seasons/[seasonId]/waitlist/route"
import { joinSeasonWaitlist } from "@/lib/serverSeasonWaitlist"
const leagueId = "11111111-1111-4111-8111-111111111111"
const seasonId = "22222222-2222-4222-8222-222222222222"
beforeEach(() => vi.clearAllMocks())

it.each(["waiting", "promoted"])("returns authenticated own %s entry and real position without exposing the queue", async (status) => {
  const rows = [{ user_id: "first", status: "waiting", position: 1 }, { user_id: "second", status: "waiting", position: 2 }, { user_id: "account", status, position: 3 }]
  const supabase = { from: (table: string) => {
    let userFilter: unknown
    const query = { select: () => query, eq: (key: string, value: unknown) => { if (key === "user_id") userFilter = value; return query }, in: () => query, order: () => query,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === "season_waitlist" ? rows.filter((row) => !userFilter || row.user_id === userFilter) : [{ id: "account", display_name: "Fixture" }], error: null }).then(resolve) }
    return query
  } }
  gate.mockResolvedValue({ ok: true, actor: { supabase, membership: { userId: "fixture@example.test", role: "player" }, user: { id: "account", isSuperuser: false } } })
  const response = await GET(new Request("http://fixture.test/"), { params: Promise.resolve({ id: leagueId, seasonId }) })
  const payload = await response.json()
  expect(payload.items).toHaveLength(1)
  expect(payload.ownEntry).toMatchObject({ user_id: "account", status })
  expect(payload.position).toBe(status === "waiting" ? 3 : null)
  expect(JSON.stringify(payload)).not.toContain('"first"')
})

it("reactivates a cancelled entry at the end and clears its old promotion", async () => {
  const stored = { id: "entry", status: "cancelled", position: 1, promoted_at: "old", confirmation_expires_at: "old" }
  const query = { select: () => query, eq: () => query, order: () => query, limit: () => query,
    maybeSingle: vi.fn().mockResolvedValueOnce({ data: { ...stored }, error: null }).mockResolvedValueOnce({ data: { position: 7 }, error: null }).mockImplementation(async () => ({ data: { ...stored }, error: null })),
    update: (value: Partial<typeof stored>) => { Object.assign(stored, value); return query },
  }
  const result = await joinSeasonWaitlist({ supabase: { from: () => query }, leagueId, seasonId, userId: "account" })
  expect(result).toMatchObject({ status: "waiting", position: 8, promoted_at: null, confirmation_expires_at: null })
})
