import { beforeEach, expect, it, vi } from "vitest"
import { POST as createLeague } from "@/app/api/leagues/route"
import { PUT as updateSeason } from "@/app/api/leagues/[id]/seasons/[seasonId]/settings/route"
import { createScheduledLeagueLocationValue } from "@/lib/leagueLocations"
import { POST as createSeason } from "@/app/api/leagues/[id]/seasons/route"

const state = vi.hoisted(() => ({ update: vi.fn(), seasonStatus: "upcoming", storedLocation: "", locations: [] as Record<string, unknown>[], legacy: [] as Record<string, unknown>[], catalogError: false, allowed: true, mode: "fixed_pairs", createSeason: vi.fn(), writes: [] as { table: string; value: Record<string, unknown> }[] }))
const leagueId = "10000000-0000-4000-8000-000000000001"
const playerIds = Array.from({ length: 6 }, (_, i) => `20000000-0000-4000-8000-${String(i).padStart(12, "0")}`)
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: async () => null }))
vi.mock("@/lib/serverGlobalLocations", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/serverGlobalLocations")>(), saveGlobalLocations: async () => undefined }))
vi.mock("@/lib/serverActivityWrite", () => ({ recordServerActorActivity: async () => undefined }))
vi.mock("@/lib/serverSeasonMutations", () => ({
  updateServerSeasonRoundSettings: (...args: unknown[]) => state.update(...args),
  createServerSeason: (...args: unknown[]) => state.createSeason(...args), isSeasonMutationError: () => false,
}))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: async () => ({ ok: true, actor: actor() }) }))
vi.mock("@/lib/serverLeagueAccess", () => ({ getServerLeagueActor: async () => state.allowed ? { ok: true, actor: actor() } : { ok: false, status: 403, error: "forbidden" } }))

vi.mock("@/lib/serverSeasonAccess", () => ({ getServerSeasonAdmin: async () => state.allowed ? { ok: true, actor: actor(), season: { status: state.seasonStatus, totalRounds: 3 } } : { ok: false, status: 403, error: "forbidden" } }))
function actor() {
  return { user: { id: "30000000-0000-4000-8000-000000000001", email: "fixture@example.test", isSuperuser: false, canCreateLeagues: state.allowed }, membership: { role: "creator", playerId: null }, supabase: {
    from: (table: string) => {
      let value: Record<string, unknown> = {}
      const q = { insert: (input: Record<string, unknown>) => { value = input; state.writes.push({ table, value }); return q }, select: () => q, eq: () => q,
        order: async () => ({ data: state.locations, error: state.catalogError ? { code: "unavailable" } : null }),
        single: async () => ({ data: { ...value, id: leagueId, active_season_id: null }, error: null }),
        maybeSingle: async () => ({ data: table === "season_settings" ? { organization_balls_assigned: false, opening_round_enabled: true, opening_round_at: "2099-01-01T09:00:00.000Z", opening_round_location: state.storedLocation, scheduled_start_at: null } : { id: leagueId, modality: state.mode, locations: state.legacy }, error: null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
      }; return q
    },
  } }
}
const request = (value: unknown) => new Request("http://localhost/api/fixture", { method: "POST", body: JSON.stringify(value), headers: { "Content-Type": "application/json" } })
const seasonBody = () => ({ name: "Pair fixture", playerIds, appUserIds: [], newPlayerNames: [], playerCapacity: 6, rosterMode: "fixed", roundWindowMode: "none", mvpSystem: "none", resultConfirmationMode: "none", requiresThreeSets: true, scheduleMode: "single", targetRoundCount: 3, fixedPairs: [[playerIds[0], playerIds[1]], [playerIds[2], playerIds[3]], [playerIds[4], playerIds[5]]] })

beforeEach(() => {
  state.update.mockReset().mockResolvedValue(undefined); state.seasonStatus = "upcoming"; state.storedLocation = "";
  state.locations = []; state.legacy = []; state.catalogError = false;
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

const openingLocation = { id: "40000000-0000-4000-8000-000000000001", name: "Club global", town: "Bilbao", address: "Dirección oficial" }
const openingBody = () => ({ ...seasonBody(), openingRoundEnabled: true, openingRoundAt: "2099-01-01T09:00:00Z", openingRoundLocation: JSON.stringify({ ...openingLocation, address: "Dirección alterada", selectedCourt: "8" }) })
it("accepts a global opening venue without league recommendations and uses catalog metadata", async () => {
  state.locations = [openingLocation]
  const response = await createSeason(request(openingBody()), { params: Promise.resolve({ id: leagueId }) })
  expect(response.status).toBe(200)
  const location = JSON.parse(state.createSeason.mock.calls[0][0].input.openingRoundLocation)
  expect(location.name).toBe("Club global")
  expect(location.address).toBe("Dirección oficial")
  expect(location.selectedCourt).toBeNull()
})
it("keeps existing league venues compatible without requiring a catalog entry", async () => {
  state.legacy = [openingLocation]
  const response = await createSeason(request(openingBody()), { params: Promise.resolve({ id: leagueId }) })
  expect(response.status).toBe(200)
  expect(JSON.parse(state.createSeason.mock.calls[0][0].input.openingRoundLocation).name).toBe("Club global")
})
it("rejects unknown opening locations before creating a season", async () => {
  const response = await createSeason(request(openingBody()), { params: Promise.resolve({ id: leagueId }) })
  expect(response.status).toBe(400)
  expect((await response.json()).error).toBe("opening_round_location_invalid")
  expect(state.createSeason).not.toHaveBeenCalled()
})
it("fails closed when the global catalog cannot be read", async () => {
  state.catalogError = true
  const response = await createSeason(request(openingBody()), { params: Promise.resolve({ id: leagueId }) })
  expect(response.status).toBe(500)
  expect(state.createSeason).not.toHaveBeenCalled()
})
it("keeps the administration requirement when selecting a global venue", async () => {
  state.locations = [openingLocation]; state.allowed = false
  expect((await createSeason(request(openingBody()), { params: Promise.resolve({ id: leagueId }) })).status).toBe(403)
  expect(state.createSeason).not.toHaveBeenCalled()
})

const settingsBody = () => ({ ...openingBody(), calendarVisibilityMode: "full", revealedThroughRound: 0, manualCompletedRounds: [], manualActiveRound: null, registrationFee: { enabled: false, amount: 0, purpose: "", paidPlayerIds: [] }, allowPlayerIncidents: true, allowPlayerSubstitutions: true, availabilityRecommendationsEnabled: false })
const settingsParams = () => ({ params: Promise.resolve({ id: leagueId, seasonId: "50000000-0000-4000-8000-000000000001" }) })
it("accepts a catalog venue when updating an upcoming season with no recommendations", async () => {
  state.locations = [openingLocation]
  expect((await updateSeason(request(settingsBody()), settingsParams())).status).toBe(200)
  expect(JSON.parse(state.update.mock.calls[0][0].settings.openingRoundLocation).address).toBe("Dirección oficial")
})
it("does not rewrite locked opening metadata when the catalog changes after starting", async () => {
  state.seasonStatus = "active"
  state.storedLocation = createScheduledLeagueLocationValue(openingLocation, null)
  state.locations = [{ ...openingLocation, address: "Dirección actualizada" }]
  expect((await updateSeason(request({ ...settingsBody(), openingRoundLocation: state.storedLocation }), settingsParams())).status).toBe(200)
  expect(state.update.mock.calls[0][0].settings.openingRoundLocation).toBe(state.storedLocation)
})
it("rejects unknown opening venues when updating settings", async () => {
  expect((await updateSeason(request(settingsBody()), settingsParams())).status).toBe(400)
  expect(state.update).not.toHaveBeenCalled()
})
it("requires admin access to update opening settings", async () => {
  state.allowed = false
  expect((await updateSeason(request(settingsBody()), settingsParams())).status).toBe(403)
  expect(state.update).not.toHaveBeenCalled()
})
