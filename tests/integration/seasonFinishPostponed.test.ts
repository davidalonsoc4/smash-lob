import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ admin: vi.fn(), finish: vi.fn(), count: 0 }))
vi.mock("@/lib/serverSeasonAccess", () => ({ getServerSeasonAdmin: mocks.admin }))
vi.mock("@/lib/serverSeasonMutations", () => ({
  finishServerActiveSeason: mocks.finish,
  isSeasonMutationError: () => false,
}))
vi.mock("@/lib/serverActivityWrite", () => ({ recordServerActorActivity: vi.fn().mockResolvedValue("event") }))
vi.mock("@/lib/serverSeasonAwards", () => ({
  getServerSeasonAwards: vi.fn().mockResolvedValue({ winnerPlayerIds: [], winnerNames: [], mvpPlayerIds: [], mvpNames: [] }),
}))
import { POST } from "@/app/api/leagues/[id]/seasons/[seasonId]/finish/route"

const leagueId = "72000000-0000-4000-8000-000000000001"
const seasonId = "74000000-0000-4000-8000-000000000001"
const context = { params: Promise.resolve({ id: leagueId, seasonId }) }
const request = (body: unknown) => new Request("http://localhost/finish", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
})

function setup(postponed: number) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then(resolve: (value: unknown) => void) { return Promise.resolve({ count: postponed, error: null }).then(resolve) },
  }
  mocks.admin.mockResolvedValue({
    ok: true,
    season: { id: seasonId, totalRounds: 4 },
    actor: { supabase: { from: vi.fn(() => query) }, user: { id: "u", email: "a@example.invalid" }, membership: null },
  })
  mocks.finish.mockResolvedValue({ seasons: [] })
}

describe("finishing a season with matches postponed out of date", () => {
  beforeEach(() => vi.clearAllMocks())

  it("asks for confirmation instead of finishing", async () => {
    setup(2)
    const response = await POST(request({}), context)
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: "season_has_postponed_matches", postponedCount: 2 })
    expect(mocks.finish).not.toHaveBeenCalled()
  })

  it("does not accept anything weaker than an explicit true", async () => {
    setup(1)
    expect((await POST(request({ confirmPostponed: "yes" }), context)).status).toBe(409)
    expect((await POST(request({ confirmPostponed: 1 }), context)).status).toBe(409)
    expect(mocks.finish).not.toHaveBeenCalled()
  })

  it("finishes once the administrator confirms", async () => {
    setup(1)
    expect((await POST(request({ confirmPostponed: true }), context)).status).toBe(200)
    expect(mocks.finish).toHaveBeenCalledTimes(1)
  })

  it("finishes without asking when nothing is postponed", async () => {
    setup(0)
    expect((await POST(request({}), context)).status).toBe(200)
    expect(mocks.finish).toHaveBeenCalledTimes(1)
  })
})
