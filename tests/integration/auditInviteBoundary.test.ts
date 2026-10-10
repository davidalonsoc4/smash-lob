import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ client: vi.fn() }))
vi.mock("@/lib/supabaseServer", () => ({ createSupabaseServiceClient: mocks.client }))
import { GET } from "@/app/api/invites/[code]/route"

const leagueId = "11111111-1111-4111-8111-111111111111"
const seasonId = "22222222-2222-4222-8222-222222222222"
beforeEach(() => vi.clearAllMocks())

function fixture() {
  const tables: Record<string, Record<string, unknown>[]> = {
    leagues: [{ id: leagueId, name: "Fixture", invite_code: "VALID-CODE", active_season_id: seasonId }],
    seasons: [{ id: seasonId, league_id: leagueId, status: "active" }],
    matches: [{ id: "match", league_id: leagueId, season_id: seasonId, round: 1, team_a: ["a", "b"], team_b: ["c", "d"], incident_notes: "private-note", incident_reason: "private-reason", booking_reservations: [{ amount: 24 }], booking_transfers: [{ amount: 6 }] }],
    season_settings: [{ league_id: leagueId, season_id: seasonId, registration_fee: { enabled: true, amount: 5, payments: [{ playerId: "private-payer", isPaid: true }], expenses: [{ id: "expense", title: "private-expense", amount: 5, createdAt: "2026-01-01" }] } }],
  }
  return { from: (table: string) => {
    let columns = ""
    const filters: [string, unknown][] = []
    const result = () => (tables[table] ?? []).filter((row) => filters.every(([key, value]) => row[key] === value))
      .map((row) => Object.fromEntries(columns.split(",").map((key) => [key, row[key]])))
    const query = {
      select: (value: string) => { columns = value; return query },
      eq: (key: string, value: unknown) => { filters.push([key, value]); return query },
      is: (key: string, value: unknown) => { filters.push([key, value]); return query },
      in: () => query, limit: () => query,
      maybeSingle: async () => ({ data: result()[0] ?? null, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: result(), error: null }).then(resolve),
    }
    return query
  } }
}

describe("public league invitation boundary", () => {
  it("does not treat a league UUID as an invitation", async () => {
    mocks.client.mockReturnValue(fixture())
    const response = await GET(new Request(`http://fixture.test/?leagueId=${leagueId}`), { params: Promise.resolve({ code: "WRONG-CODE" }) })
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ snapshot: null })
  })
  it("keeps valid invitations usable without exposing private finances or incident text", async () => {
    mocks.client.mockReturnValue(fixture())
    const response = await GET(new Request(`http://fixture.test/?leagueId=${leagueId}`), { params: Promise.resolve({ code: "VALID-CODE" }) })
    expect(response.status).toBe(200)
    const text = await response.text()
    for (const privateValue of ["private-note", "private-reason", "private-payer", "private-expense"]) expect(text).not.toContain(privateValue)
    const snapshot = JSON.parse(text).snapshot
    expect(snapshot.matches[0].teamA).toEqual(["a", "b"])
    expect(snapshot.matches[0].courtBooking.transfers).toEqual([])
    expect(snapshot.seasonSnapshot.seasonSettings[0].registrationFee.payments).toEqual([])
  })
})
