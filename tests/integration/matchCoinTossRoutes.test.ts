import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ actor: vi.fn(), load: vi.fn(), run: vi.fn(), personal: vi.fn(), manageable: vi.fn(), auth: vi.fn() }))
vi.mock("@/lib/serverMatchAccess", () => ({ getServerMatchActor: mocks.actor }))
vi.mock("@/lib/serverMatchCoinToss", () => ({ loadCoinToss: mocks.load, runCoinTossAction: mocks.run }))
// The time rule only applies in production; these tests check the rule itself, so it is switched on here.
vi.mock("@/lib/matchCoinToss", async (original) => ({ ...(await original<typeof import("@/lib/matchCoinToss")>()), isCoinTossTimeWindowEnforced: () => true }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: vi.fn().mockResolvedValue(null) }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: mocks.auth }))
vi.mock("@/lib/serverPersonalMatches", () => ({ loadPersonalMatch: mocks.personal, loadManageablePersonalMatch: mocks.manageable }))
import { GET as leagueGet, POST as leaguePost } from "@/app/api/matches/[matchId]/coin-toss/route"
import { GET as friendlyGet, POST as friendlyPost } from "@/app/api/personal-matches/[id]/coin-toss/route"

const matchId = "74000000-0000-4000-8000-000000000001"
const context = { params: Promise.resolve({ matchId, id: matchId }) }
const post = (body: unknown) => new Request("http://localhost/coin-toss", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
const NOW = Date.parse("2026-11-26T15:45:00Z")

function leagueActor(patch: Record<string, unknown> = {}, match: Record<string, unknown> = {}) {
  mocks.actor.mockResolvedValue({
    ok: true,
    actor: { supabase: {}, user: { id: "user" }, isSpectator: false, isAdmin: false, participantPlayerId: "player", match: { status: "scheduled", scheduledAt: "2026-11-26T16:00:00Z", ...match }, ...patch },
  })
}

describe("league coin toss route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(NOW)
    mocks.load.mockResolvedValue({ ok: true, toss: null })
    mocks.run.mockResolvedValue({ status: 200, json: { coinToss: { result: "heads" } } })
  })

  it("shows the toss to the players and the administrators, not to spectators or outsiders", async () => {
    leagueActor()
    expect((await leagueGet(new Request("http://localhost"), context)).status).toBe(200)
    leagueActor({ isAdmin: true, participantPlayerId: null })
    expect((await leagueGet(new Request("http://localhost"), context)).status).toBe(200)
    leagueActor({ isSpectator: true })
    expect((await leagueGet(new Request("http://localhost"), context)).status).toBe(403)
    leagueActor({ participantPlayerId: null })
    expect((await leagueGet(new Request("http://localhost"), context)).status).toBe(403)
  })

  it("counts the window from the booked time of the match", async () => {
    leagueActor()
    expect((await (await leagueGet(new Request("http://localhost"), context)).json()).window.state).toBe("open")
    leagueActor({}, { scheduledAt: "2026-11-26T18:00:00Z" })
    expect((await (await leagueGet(new Request("http://localhost"), context)).json()).window.state).toBe("early")
    leagueActor({}, { scheduledAt: null })
    expect((await (await leagueGet(new Request("http://localhost"), context)).json()).window.state).toBe("unscheduled")
  })

  it("only tosses in a season that can change and in a match that has not been played", async () => {
    for (const status of ["finished", "postponed"]) {
      leagueActor({}, { status })
      expect((await leaguePost(post({ action: "toss", headsTeam: 1 }), context)).status).toBe(409)
    }
    expect(mocks.run).not.toHaveBeenCalled()
    // Not yet scheduled in the app: it can still be played, so it can toss (the window code decides about the time).
    leagueActor({}, { status: "scheduling", scheduledAt: "2026-11-26T16:00:00Z" })
    expect((await leaguePost(post({ action: "toss", headsTeam: 1 }), context)).status).toBe(200)
    mocks.run.mockClear()
    leagueActor()
    expect((await leaguePost(post({ action: "toss", headsTeam: 1 }), context)).status).toBe(200)
    expect(mocks.actor).toHaveBeenLastCalledWith(matchId, expect.objectContaining({ requireMutableSeason: true, requireLeagueAccess: true }))
    expect(mocks.run).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: "league", matchId }, window: { state: "open", opensAt: null } }))
  })

  it("answers like a missing match for a malformed id", async () => {
    expect((await leagueGet(new Request("http://localhost"), { params: Promise.resolve({ matchId: "nope" }) })).status).toBe(400)
  })
})

describe("friendly coin toss route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(NOW)
    mocks.auth.mockResolvedValue({ ok: true, actor: { supabase: {}, user: { id: "user" } } })
    mocks.load.mockResolvedValue({ ok: true, toss: null })
    mocks.run.mockResolvedValue({ status: 200, json: { coinToss: { result: "tails" } } })
  })

  it("shows the toss to a participant and nobody else", async () => {
    mocks.personal.mockResolvedValue({ scheduledAt: "2026-11-26T16:00:00Z" })
    expect((await friendlyGet(new Request("http://localhost"), context)).status).toBe(200)
    mocks.personal.mockResolvedValue(null)
    expect((await friendlyGet(new Request("http://localhost"), context)).status).toBe(404)
  })

  it("lets who can edit the friendly toss, and only while it has not been played", async () => {
    mocks.manageable.mockResolvedValue("forbidden")
    expect((await friendlyPost(post({ action: "toss", headsTeam: 1 }), context)).status).toBe(403)
    mocks.manageable.mockResolvedValue({ status: "finished", played_at: "2026-11-26T16:00:00Z" })
    expect((await friendlyPost(post({ action: "toss", headsTeam: 1 }), context)).status).toBe(409)
    expect(mocks.run).not.toHaveBeenCalled()
    mocks.manageable.mockResolvedValue({ status: "scheduled", played_at: "2026-11-26T16:00:00Z" })
    expect((await friendlyPost(post({ action: "toss", headsTeam: 1 }), context)).status).toBe(200)
    expect(mocks.run).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: "friendly", matchId } }))
  })

  it("lets a friendly without a time toss whenever", async () => {
    mocks.manageable.mockResolvedValue({ status: "scheduled", played_at: null })
    await friendlyPost(post({ action: "toss", headsTeam: 1 }), context)
    expect(mocks.run).toHaveBeenCalledWith(expect.objectContaining({ window: { state: "open", opensAt: null } }))
  })
})
