import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn(), maybeSingle: vi.fn() }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: mocks.auth }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: vi.fn(async () => null) }))

import { GET as readTournament } from "@/app/api/tournaments/[id]/route"
import { POST as createTournament } from "@/app/api/tournaments/route"
import { POST as drawTournament } from "@/app/api/tournaments/[id]/draw/route"
import { POST as startTournament } from "@/app/api/tournaments/[id]/start/route"
import { PUT as saveResult } from "@/app/api/tournaments/[id]/matches/[matchId]/result/route"
import { POST as finishTournament } from "@/app/api/tournaments/[id]/finish/route"

const tournamentId = "47b0b645-4790-491f-8f15-b1fe8bf8be13"
const matchId = "a2bd4f89-621c-4be5-9e4f-5e2decc003c9"
const names = "ABCDEFGHIJKL".split("").map((slot) => `Jugador ${slot}`)

function request(url: string, body?: unknown, method = body ? "POST" : "GET") {
  return new Request(`http://localhost${url}`, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) })
}

function params<T extends { id: string; matchId?: string }>(values: T): { params: Promise<T> } {
  return { params: Promise.resolve(values) }
}

describe("rapid tournament creator routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: names.map((full_name) => ({ full_name })), error: null }),
      maybeSingle: mocks.maybeSingle,
    }
    const supabase = {
      from: vi.fn(() => query),
      rpc: mocks.rpc,
    }
    mocks.auth.mockResolvedValue({ ok: true, actor: { supabase, user: { id: "creator-uuid", email: "creator@example.test" } } })
    mocks.maybeSingle.mockResolvedValue({ data: { id: tournamentId }, error: null })
  })

  it("hides an owned tournament from non-creators and unauthenticated requests", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const hidden = await readTournament(request(`/api/tournaments/${tournamentId}`), params({ id: tournamentId }))
    expect(hidden.status).toBe(404)
    expect((await hidden.json()).error).toBe("tournament_not_found")
    mocks.auth.mockResolvedValueOnce({ ok: false, status: 401, error: "unauthenticated" })
    const unauthenticated = await readTournament(request(`/api/tournaments/${tournamentId}`), params({ id: tournamentId }))
    expect(unauthenticated.status).toBe(401)
  })

  it("creates only complete, unique twelve-player tournaments through the atomic database RPC", async () => {
    mocks.rpc.mockResolvedValue({ data: tournamentId, error: null })
    const duplicate = await createTournament(request("/api/tournaments", { name: "Americana", startsAt: "2026-10-17T07:00:00Z", courtNames: ["Pista 1", "Pista 2"], players: [...names.slice(0, 11), " jugador a " ] }))
    expect(duplicate.status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
    const created = await createTournament(request("/api/tournaments", { name: "Americana", startsAt: "2026-10-17T07:00:00Z", courtNames: ["Pista 1", "Pista 2"], players: names }))
    expect(created.status).toBe(201)
    expect(await created.json()).toEqual({ id: tournamentId })
    expect(mocks.rpc).toHaveBeenCalledWith("create_rapid_tournament", expect.objectContaining({ p_creator_user_id: "creator-uuid", p_shuffled_names: expect.arrayContaining(names) }))
  })

  it("allows reroll and start only through creator-bound state RPCs", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: false, error: null }).mockResolvedValueOnce({ data: true, error: null })
    const locked = await drawTournament(request(`/api/tournaments/${tournamentId}/draw`), params({ id: tournamentId }))
    expect(locked.status).toBe(409)
    const started = await startTournament(request(`/api/tournaments/${tournamentId}/start`), params({ id: tournamentId }))
    expect(started.status).toBe(200)
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "reroll_rapid_tournament", expect.objectContaining({ p_creator_user_id: "creator-uuid" }))
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "start_rapid_tournament", { p_tournament_id: tournamentId, p_creator_user_id: "creator-uuid" })
  })

  it("rejects invalid scores before persistence and records valid corrections as the creator", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null })
    const zero = await saveResult(request(`/api/tournaments/${tournamentId}/matches/${matchId}/result`, { scoreA: 0, scoreB: 0 }, "PUT"), params({ id: tournamentId, matchId }))
    expect(zero.status).toBe(400)
    const invalid = await saveResult(request(`/api/tournaments/${tournamentId}/matches/${matchId}/result`, { scoreA: 1.5, scoreB: -1 }, "PUT"), params({ id: tournamentId, matchId }))
    expect(invalid.status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
    const saved = await saveResult(request(`/api/tournaments/${tournamentId}/matches/${matchId}/result`, { scoreA: 19, scoreB: 19 }, "PUT"), params({ id: tournamentId, matchId }))
    expect(saved.status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith("record_rapid_tournament_result", { p_tournament_id: tournamentId, p_match_id: matchId, p_creator_user_id: "creator-uuid", p_score_a: 19, p_score_b: 19 })
  })

  it("does not finish before every result exists", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null })
    const response = await finishTournament(request(`/api/tournaments/${tournamentId}/finish`), params({ id: tournamentId }))
    expect(response.status).toBe(409)
    expect(mocks.rpc).toHaveBeenCalledWith("finish_rapid_tournament", { p_tournament_id: tournamentId, p_creator_user_id: "creator-uuid" })
  })

  it("returns actual-start schedules after reload while preserving stored round IDs", async () => {
    const stored = { id: tournamentId, starts_at: "2026-10-17T07:00:00Z", started_at: "2026-10-17T07:05:00Z", safety_margin_minutes: 9 }
    const rows: Record<string, unknown[]> = { rapid_tournament_players: [], rapid_tournament_matches: [], rapid_tournament_rounds: [1, 6].map((round_number) => ({ id: `round-${round_number}`, round_number, starts_at: stored.starts_at, ends_at: stored.starts_at })) }
    const from = vi.fn((table: string) => {
      const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: tournamentId }, error: null }), single: vi.fn().mockResolvedValue({ data: stored, error: null }), order: vi.fn().mockReturnThis(), then: (resolve: (value: unknown) => void) => Promise.resolve({ data: rows[table] ?? [], error: null }).then(resolve) }
      return query
    })
    mocks.auth.mockResolvedValue({ ok: true, actor: { supabase: { from }, user: { id: "creator-uuid" } } })
    const response = await readTournament(request(`/api/tournaments/${tournamentId}`), params({ id: tournamentId }))
    const result = await response.json()
    expect(response.status).toBe(200)
    expect(result.tournament.startedAt).toBe(stored.started_at)
    expect(result.tournament.configuration).toMatchObject({ preparationMinutes: 2, safetyMarginMinutes: 7 })
    expect(result.rounds).toEqual([{ id: "round-1", round: 1, startsAt: "2026-10-17T07:07:00.000Z", endsAt: "2026-10-17T07:23:00.000Z" }, { id: "round-6", round: 6, startsAt: "2026-10-17T08:42:00.000Z", endsAt: "2026-10-17T08:58:00.000Z" }])
    expect(Number.isFinite(Date.parse(result.serverNow))).toBe(true)
  })
})
