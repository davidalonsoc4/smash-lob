import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn(), maybeSingle: vi.fn(), single: vi.fn(), generate: vi.fn() }))
const people = vi.hoisted(() => ({ selectable: vi.fn() }))
vi.mock("@/lib/serverRapidTournamentPeople", () => ({ getRapidTournamentSelectablePeople: people.selectable }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: mocks.auth }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: vi.fn(async () => null) }))
vi.mock("@/lib/serverDynamicMexicano", () => ({ generateAndPersistMexicanoRound: mocks.generate }))

import { GET as readTournament, DELETE as deleteTournament } from "@/app/api/tournaments/[id]/route"
import { POST as restartTournament } from "@/app/api/tournaments/[id]/restart/route"
import { GET as listTournaments, POST as createTournament } from "@/app/api/tournaments/route"
import { POST as drawTournament } from "@/app/api/tournaments/[id]/draw/route"
import { POST as startTournament } from "@/app/api/tournaments/[id]/start/route"
import { PUT as saveResult } from "@/app/api/tournaments/[id]/matches/[matchId]/result/route"
import { POST as finishTournament } from "@/app/api/tournaments/[id]/finish/route"
import { POST as finishEmptyTournament } from "@/app/api/tournaments/[id]/finish-empty/route"
import { POST as generateNextRound } from "@/app/api/tournaments/[id]/next-round/route"
import { requireRapidTournamentAccess } from "@/lib/serverRapidTournaments"

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
      single: mocks.single,
    }
    const supabase = {
      from: vi.fn(() => query),
      rpc: mocks.rpc,
    }
    mocks.auth.mockResolvedValue({ ok: true, actor: { supabase, user: { id: "creator-uuid", email: "creator@example.test" } } })
    mocks.maybeSingle.mockResolvedValue({ data: { id: tournamentId, created_by_user_id: "creator-uuid", player_count: 12, court_count: 2, round_count: 6, status: "draft", format: "balanced_americana" }, error: null })
    mocks.single.mockResolvedValue({ data: { format: "balanced_americana" }, error: null })
    mocks.generate.mockResolvedValue({ ok: true, round: 2 })
  })

  it("keeps creator tournament lists available before account-link columns are installed", async () => {
    const tournament = { id: tournamentId, name: "Americana anterior", description: "", starts_at: "2026-10-17T07:00:00Z", status: "draft", created_at: "2026-10-16T12:00:00Z", finished_at: null, created_by_user_id: "creator-uuid" }
    const from = vi.fn((table: string) => {
      const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn(async () => ({ data: [tournament], error: null })),
        then: (resolve: (value: unknown) => void) => Promise.resolve({ data: null, error: table === "rapid_tournament_players" ? { code: "42703", message: "column rapid_tournament_players.user_id does not exist" } : null }).then(resolve),
      }
      return query
    })
    mocks.auth.mockResolvedValueOnce({ ok: true, actor: { supabase: { from }, user: { id: "creator-uuid" } } })
    const response = await listTournaments(request("/api/tournaments"))
    expect(response.status).toBe(200)
    expect((await response.json()).tournaments).toMatchObject([{ id: tournamentId, name: "Americana anterior", role: "creator" }])
    expect(from).toHaveBeenCalledWith("rapid_tournament_players")
    expect(from).toHaveBeenCalledWith("rapid_tournaments")
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

  it("grants read access only to the creator or an account linked to a tournament player", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: tournamentId, created_by_user_id: "another-user" }, error: null })
      .mockResolvedValueOnce({ data: { id: "player-link" }, error: null })
    await expect(requireRapidTournamentAccess(tournamentId)).resolves.toMatchObject({ ok: true, role: "participant" })
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: tournamentId, created_by_user_id: "another-user" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    await expect(requireRapidTournamentAccess(tournamentId)).resolves.toMatchObject({ ok: false, status: 404 })
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: tournamentId, created_by_user_id: "creator-uuid" }, error: null })
    await expect(requireRapidTournamentAccess(tournamentId)).resolves.toMatchObject({ ok: true, role: "creator" })
  })

  it("creates only complete, unique twelve-player tournaments through the atomic database RPC", async () => {
    mocks.rpc.mockResolvedValue({ data: tournamentId, error: null })
    const duplicate = await createTournament(request("/api/tournaments", { name: "Americana", startsAt: "2026-10-17T07:00:00Z", courtNames: ["Pista 1", "Pista 2"], players: [...names.slice(0, 11), " jugador a " ] }))
    expect(duplicate.status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
    const created = await createTournament(request("/api/tournaments", { name: "Americana", startsAt: "2026-10-17T07:00:00Z", courtNames: ["Pista 1", "Pista 2"], players: names }))
    expect(created.status).toBe(201)
    expect(await created.json()).toEqual({ id: tournamentId })
    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_rapid_tournament_flexible",
      expect.objectContaining({
        p_creator_user_id: "creator-uuid",
        p_player_names: expect.arrayContaining(names),
        p_reservation_minutes: 120,
        p_preparation_minutes: 2,
        p_round_count: 6,
      }),
    )
  })

  it("accepts only supported rapid tournament sizes, courts, booking times and preparation windows", async () => {
    mocks.rpc.mockResolvedValue({ data: tournamentId, error: null })
    const base = { name: "Americana flexible", startsAt: "2026-10-17T07:00:00Z", players: Array.from({ length: 8 }, (_, index) => `Jugador ${index + 1}`) }
    const valid = await createTournament(request("/api/tournaments", { ...base, playerCount: 8, courtNames: ["Pista 1"], reservationMinutes: 60, preparationMinutes: 4 }))
    expect(valid.status).toBe(201)
    expect(mocks.rpc).toHaveBeenCalledWith("create_rapid_tournament_flexible", expect.objectContaining({ p_reservation_minutes: 60, p_preparation_minutes: 4, p_round_count: 3, p_court_names: ["Pista 1"] }))
    const tooMuchPreparation = await createTournament(request("/api/tournaments", { ...base, playerCount: 8, courtNames: ["Pista 1"], reservationMinutes: 60, preparationMinutes: 5 }))
    expect(tooMuchPreparation.status).toBe(400)
    const unsupportedBooking = await createTournament(request("/api/tournaments", { ...base, playerCount: 8, courtNames: ["Pista 1"], reservationMinutes: 75, preparationMinutes: 0 }))
    expect(unsupportedBooking.status).toBe(400)
    const invalidSize = await createTournament(request("/api/tournaments", { ...base, playerCount: 7, courtNames: ["Pista 1"], reservationMinutes: 60, preparationMinutes: 0 }))
    expect(invalidSize.status).toBe(400)
  })

  it("creates a dynamic Mexicano without pre-generating matches", async () => {
    mocks.rpc.mockResolvedValue({ data: tournamentId, error: null })
    const response = await createTournament(request("/api/tournaments", { name: "Mexicano", startsAt: "2026-10-17T07:00:00Z", courtNames: ["Pista 1", "Pista 2"], players: names, format: "dynamic_mexicano" }))
    expect(response.status).toBe(201)
    expect(mocks.rpc).toHaveBeenCalledWith("create_dynamic_mexicano_tournament", expect.objectContaining({ p_player_names: names, p_round_count: 6, p_generation_seed: expect.any(Number) }))
    expect(mocks.rpc.mock.calls[0][1]).not.toHaveProperty("p_matches")
  })

  it("denies copying another organizer's tournament before writing", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const response = await createTournament(request("/api/tournaments", {
      name: "Copia", startsAt: "2027-01-01T09:00:00Z", players: names,
      courtNames: ["Pista 1", "Pista 2"], duplicateOf: tournamentId,
    }))
    expect(response.status).toBe(404)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it("keeps permitted account links after authorizing the original creator", async () => {
    const userId = "5b028680-92f9-4cc3-80a6-59e34fab0529"
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: mocks.maybeSingle,
      then: (resolve: (value: unknown) => void) => Promise.resolve({ data: [{ user_id: userId, full_name: "Ana vinculada" }], error: null }).then(resolve),
    }
    const actor = { supabase: { from: vi.fn(() => query), rpc: mocks.rpc }, user: { id: "creator-uuid" } }
    mocks.auth.mockResolvedValue({ ok: true, actor })
    people.selectable.mockResolvedValue({ people: [{ userId, displayName: "Ana vinculada" }], error: null })
    mocks.rpc.mockResolvedValue({ data: tournamentId, error: null })
    const response = await createTournament(request("/api/tournaments", {
      name: "Copia", startsAt: "2027-01-01T09:00:00Z", players: names,
      courtNames: ["Pista 1", "Pista 2"], duplicateOf: tournamentId, format: "dynamic_mexicano",
      playerUserIds: [userId, ...Array(11).fill(null)],
    }))
    expect(response.status).toBe(201)
    expect(mocks.rpc).toHaveBeenCalledWith("create_dynamic_mexicano_tournament", expect.objectContaining({ p_player_names: ["Ana vinculada", ...names.slice(1)] }))
  })

  it.each([8, 10, 16])("creates a %i-player tournament with canonical registered names", async (count) => {
    const userId = "5b028680-92f9-4cc3-80a6-59e34fab0529"
    people.selectable.mockResolvedValue({ people: [{ userId, displayName: "Nombre registrado" }], error: null })
    mocks.rpc.mockResolvedValue({ data: tournamentId, error: null })
    const response = await createTournament(request("/api/tournaments", {
      name: "Mexicano con cuentas", startsAt: "2027-01-01T09:00:00Z", format: "dynamic_mexicano",
      players: Array.from({ length: count }, (_, i) => `Manual ${i}`), playerCount: count,
      playerUserIds: [userId, ...Array(count - 1).fill(null)], courtNames: ["Pista 1", "Pista 2"],
    }))
    expect(response.status).toBe(201)
    expect(mocks.rpc).toHaveBeenCalledWith("create_dynamic_mexicano_tournament", expect.objectContaining({
      p_player_names: ["Nombre registrado", ...Array.from({ length: count - 1 }, (_, i) => `Manual ${i + 1}`)],
    }))
  })

  it("rejects duplicate names introduced by canonical account resolution", async () => {
    const userId = "5b028680-92f9-4cc3-80a6-59e34fab0529"
    people.selectable.mockResolvedValue({ people: [{ userId, displayName: "Manual 1" }], error: null })
    const response = await createTournament(request("/api/tournaments", {
      name: "Cuentas", startsAt: "2027-01-01T09:00:00Z", format: "dynamic_mexicano",
      players: Array.from({ length: 8 }, (_, i) => `Manual ${i}`), playerCount: 8,
      playerUserIds: [userId, ...Array(7).fill(null)], courtNames: ["Pista 1"],
    }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "duplicate_player_names" })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it("allows reroll and start only through creator-bound state RPCs", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: false, error: null }).mockResolvedValueOnce({ data: true, error: null })
    const locked = await drawTournament(request(`/api/tournaments/${tournamentId}/draw`), params({ id: tournamentId }))
    expect(locked.status).toBe(409)
    const started = await startTournament(request(`/api/tournaments/${tournamentId}/start`), params({ id: tournamentId }))
    expect(started.status).toBe(200)
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "reroll_rapid_tournament_flexible", expect.objectContaining({ p_creator_user_id: "creator-uuid", p_player_user_ids: Array(12).fill(null), p_matches: expect.any(Array) }))
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

  it("only finishes an unscored tournament through the creator-bound cleanup action", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: false, error: null }).mockResolvedValueOnce({ data: true, error: null })
    const blocked = await finishEmptyTournament(request(`/api/tournaments/${tournamentId}/finish-empty`), params({ id: tournamentId }))
    expect(blocked.status).toBe(409)
    expect(mocks.rpc).toHaveBeenLastCalledWith("finish_empty_rapid_tournament", { p_tournament_id: tournamentId, p_creator_user_id: "creator-uuid" })
    const finished = await finishEmptyTournament(request(`/api/tournaments/${tournamentId}/finish-empty`), params({ id: tournamentId }))
    expect(finished.status).toBe(200)
    mocks.auth.mockResolvedValueOnce({ ok: false, status: 401, error: "unauthenticated" })
    expect((await finishEmptyTournament(request(`/api/tournaments/${tournamentId}/finish-empty`), params({ id: tournamentId }))).status).toBe(401)
  })

  it("keeps next-round generation behind creator access and reports generation gates", async () => {
    const generated = await generateNextRound(request(`/api/tournaments/${tournamentId}/next-round`), params({ id: tournamentId }))
    expect(generated.status).toBe(200)
    expect(mocks.generate).toHaveBeenCalledWith(expect.anything(), tournamentId, "creator-uuid")
    mocks.generate.mockResolvedValueOnce({ ok: false, status: 409, error: "previous_round_incomplete" })
    const blocked = await generateNextRound(request(`/api/tournaments/${tournamentId}/next-round`), params({ id: tournamentId }))
    expect(blocked.status).toBe(409)
    expect(await blocked.json()).toEqual({ error: "previous_round_incomplete" })
  })

  it("binds restart and deletion to the authenticated creator and finished state", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pre.smashandlob.com")
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-17T12:00:00Z"))
    for (const action of [restartTournament, deleteTournament]) {
      mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      expect((await action(request(`/api/tournaments/${tournamentId}`), params({ id: tournamentId }))).status).toBe(404)
      expect(mocks.rpc).not.toHaveBeenCalled()
      mocks.rpc.mockResolvedValueOnce({ data: false, error: null })
      expect((await action(request(`/api/tournaments/${tournamentId}`), params({ id: tournamentId }))).status).toBe(409)
      mocks.rpc.mockResolvedValueOnce({ data: true, error: null })
      expect((await action(request(`/api/tournaments/${tournamentId}`), params({ id: tournamentId }))).status).toBe(200)
      expect(mocks.rpc).toHaveBeenLastCalledWith(action === restartTournament ? "restart_rapid_tournament_for_testing" : "delete_finished_rapid_tournament", { p_tournament_id: tournamentId, p_creator_user_id: "creator-uuid" })
      mocks.rpc.mockClear()
      mocks.auth.mockResolvedValueOnce({ ok: false, status: 401, error: "unauthenticated" })
      expect((await action(request(`/api/tournaments/${tournamentId}`), params({ id: tournamentId }))).status).toBe(401)
    }
    vi.unstubAllEnvs()
  })

  it("rejects testing restart in Production and after its expiry without calling Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://smashandlob.com")
    vi.stubEnv("NEXT_PUBLIC_APP_VARIANT", "pre")
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-17T12:00:00Z"))
    expect((await restartTournament(request(`/api/tournaments/${tournamentId}/restart`), params({ id: tournamentId }))).status).toBe(404)
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pre.smashandlob.com")
    vi.stubEnv("VERCEL_ENV", "production")
    expect((await restartTournament(request(`/api/tournaments/${tournamentId}/restart`), params({ id: tournamentId }))).status).toBe(404)
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.mocked(Date.now).mockReturnValue(Date.parse("2026-10-26T00:00:00Z"))
    expect((await restartTournament(request(`/api/tournaments/${tournamentId}/restart`), params({ id: tournamentId }))).status).toBe(404)
    expect(mocks.rpc).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })

  it("reports database failures without pretending restart or deletion succeeded", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3100")
    vi.stubEnv("VERCEL_ENV", "")
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-17T12:00:00Z"))
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "database_unavailable" } })
    for (const action of [restartTournament, deleteTournament]) expect((await action(request(`/api/tournaments/${tournamentId}`), params({ id: tournamentId }))).status).toBe(500)
    vi.unstubAllEnvs()
  })

  it("returns actual-start schedules after reload while preserving stored round IDs", async () => {
    const stored = { id: tournamentId, starts_at: "2026-10-17T07:00:00Z", started_at: "2026-10-17T07:05:00Z", safety_margin_minutes: 9, player_count: 12, court_count: 2, reservation_minutes: 120, round_count: 6, round_minutes: 16, transition_minutes: 3, preparation_minutes: 2 }
    const rows: Record<string, unknown[]> = { rapid_tournament_players: [{ id: "player-a", slot: "A", full_name: "Jugador A" }], rapid_tournament_matches: [], rapid_tournament_rounds: [1, 6].map((round_number) => ({ id: `round-${round_number}`, round_number, starts_at: stored.starts_at, ends_at: stored.starts_at })) }
    const from = vi.fn((table: string) => {
      let selectedColumns = ""
      const query = { select: vi.fn((columns: string) => { selectedColumns = columns; return query }), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: tournamentId }, error: null }), single: vi.fn().mockResolvedValue({ data: stored, error: null }), order: vi.fn().mockReturnThis(), then: (resolve: (value: unknown) => void) => Promise.resolve(table === "rapid_tournament_players" && selectedColumns.includes("user_id") ? { data: null, error: { code: "42703", message: "column rapid_tournament_players.user_id does not exist" } } : { data: rows[table] ?? [], error: null }).then(resolve) }
      return query
    })
    mocks.auth.mockResolvedValue({ ok: true, actor: { supabase: { from }, user: { id: "creator-uuid" } } })
    const response = await readTournament(request(`/api/tournaments/${tournamentId}`), params({ id: tournamentId }))
    const result = await response.json()
    expect(response.status).toBe(200)
    expect(result.tournament.startedAt).toBe(stored.started_at)
    expect(result.tournament.configuration).toMatchObject({ preparationMinutes: 2, safetyMarginMinutes: 7 })
    expect(result.players).toEqual([{ id: "player-a", slot: "A", name: "Jugador A", hasAccount: false }])
    expect(result.rounds).toEqual([{ id: "round-1", round: 1, startsAt: "2026-10-17T07:07:00.000Z", endsAt: "2026-10-17T07:23:00.000Z" }, { id: "round-6", round: 6, startsAt: "2026-10-17T08:42:00.000Z", endsAt: "2026-10-17T08:58:00.000Z" }])
    expect(Number.isFinite(Date.parse(result.serverNow))).toBe(true)
  })
})
