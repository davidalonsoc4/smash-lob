import { beforeEach, expect, it, vi } from "vitest"
import { POST as createLeague } from "@/app/api/leagues/route"
import { POST as createSeason } from "@/app/api/leagues/[id]/seasons/route"

const state = vi.hoisted(() => ({ allowed: true, mode: "fixed_pairs", createSeason: vi.fn(), writes: [] as { table: string; value: Record<string, unknown> }[] }))
const leagueId = "10000000-0000-4000-8000-000000000001"
const playerIds = Array.from({ length: 6 }, (_, i) => `20000000-0000-4000-8000-${String(i).padStart(12, "0")}`)
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: async () => null }))
vi.mock("@/lib/serverGlobalLocations", () => ({ saveGlobalLocations: async () => undefined }))
vi.mock("@/lib/serverActivityWrite", () => ({ recordServerActorActivity: async () => undefined }))
vi.mock("@/lib/serverSeasonMutations", () => ({
  createServerSeason: (...args: unknown[]) => state.createSeason(...args), isSeasonMutationError: () => false,
}))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: async () => ({ ok: true, actor: actor() }) }))
vi.mock("@/lib/serverLeagueAccess", () => ({ getServerLeagueActor: async () => state.allowed ? { ok: true, actor: actor() } : { ok: false, status: 403, error: "forbidden" } }))

function actor() {
  return { user: { id: "30000000-0000-4000-8000-000000000001", email: "fixture@example.test", isSuperuser: false, canCreateLeagues: state.allowed }, membership: { role: "creator", playerId: null }, supabase: {
    from: (table: string) => {
      let value: Record<string, unknown> = {}
      const q = { insert: (input: Record<string, unknown>) => { value = input; state.writes.push({ table, value }); return q }, select: () => q, eq: () => q,
        single: async () => ({ data: { ...value, id: leagueId, active_season_id: null }, error: null }),
        maybeSingle: async () => ({ data: { id: leagueId, modality: state.mode }, error: null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
      }; return q
    },
  } }
}
const request = (value: unknown) => new Request("http://localhost/api/fixture", { method: "POST", body: JSON.stringify(value), headers: { "Content-Type": "application/json" } })
const seasonBody = () => ({ name: "Pair fixture", playerIds, appUserIds: [], newPlayerNames: [], playerCapacity: 6, rosterMode: "fixed", roundWindowMode: "none", mvpSystem: "none", resultConfirmationMode: "none", requiresThreeSets: true, scheduleMode: "single", targetRoundCount: 3, fixedPairs: [[playerIds[0], playerIds[1]], [playerIds[2], playerIds[3]], [playerIds[4], playerIds[5]]] })

beforeEach(() => {
  state.allowed = true; state.mode = "fixed_pairs"; state.writes = []; state.createSeason.mockReset()
  state.createSeason.mockResolvedValue({ matches: [], seasonSnapshot: { activeSeasonIds: {}, seasons: [] } })
})
it.each(["individual", "fixed_pairs"])("persists the chosen league mode %s and returns it in the snapshot", async modality => {
  const result = await createLeague(request({ leagueName: "Fixture", leagueSlug: "fixture", inviteCode: "SL-8KQ4-P7M2-X9RA", modality }))
  expect(result.status).toBe(200)
  expect(state.writes.find(write => write.table === "leagues")?.value.modality).toBe(modality)
  expect((await result.json()).league.modality).toBe(modality)
})
it("rejects unauthorized creation and unknown modes without writes", async () => {
  state.allowed = false
  expect((await createLeague(request({ leagueName: "Fixture", leagueSlug: "fixture", inviteCode: "SL-8KQ4-P7M2-X9RA" }))).status).toBe(403)
  state.allowed = true
  expect((await createLeague(request({ leagueName: "Fixture", leagueSlug: "fixture", inviteCode: "SL-8KQ4-P7M2-X9RA", modality: "universal" }))).status).toBe(400)
  expect(state.writes).toHaveLength(0)
})
it("creates a three-pair season with a bye, respecting server-side league mode", async () => {
  const result = await createSeason(request(seasonBody()), { params: Promise.resolve({ id: leagueId }) })
  expect(result.status).toBe(200)
  expect(state.createSeason.mock.calls[0][0].input.fixedPairs).toEqual(seasonBody().fixedPairs)
  expect(state.createSeason.mock.calls[0][0].input.targetRoundCount).toBe(3)
})
it.each(["duplicate", "missing", "stranger", "odd"])("rejects %s fixed-pair configuration before mutation", async variant => {
  const body = seasonBody()
  if (variant === "duplicate") body.fixedPairs[1][0] = playerIds[0]
  if (variant === "missing") body.fixedPairs.pop()
  if (variant === "stranger") body.fixedPairs[0][0] = "90000000-0000-4000-8000-000000000001"
  if (variant === "odd") body.playerIds = playerIds.slice(0, 5)
  expect((await createSeason(request(body), { params: Promise.resolve({ id: leagueId }) })).status).toBe(400)
  expect(state.createSeason).not.toHaveBeenCalled()
})
it("accepts self-registration pairs without inventing partners before enrollment", async () => {
  const body = { ...seasonBody(), playerIds: [], fixedPairs: undefined, rosterMode: "self_registration" }
  expect((await createSeason(request(body), { params: Promise.resolve({ id: leagueId }) })).status).toBe(200)
  expect(state.createSeason).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ rosterMode: "self_registration", fixedPairs: undefined, playerCapacity: 6 }) }))
})
it("preserves the admin guard for season creation", async () => {
  state.allowed = false
  expect((await createSeason(request(seasonBody()), { params: Promise.resolve({ id: leagueId }) })).status).toBe(403)
  expect(state.createSeason).not.toHaveBeenCalled()
})
