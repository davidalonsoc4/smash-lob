import { describe, expect, it, vi } from "vitest"
import { generateAndPersistMexicanoRound } from "@/lib/serverDynamicMexicano"
import type { AuthenticatedAppUser } from "@/lib/serverAuth"

const players = Array.from({ length: 8 }, (_, index) => ({ id: `player-${index + 1}`, full_name: `Jugador ${index + 1}` }))
const completedRound = [
  { round_number: 1, court_number: 1, team_a_one_id: "player-1", team_a_two_id: "player-8", team_b_one_id: "player-2", team_b_two_id: "player-7", score_a: 16, score_b: 12 },
  { round_number: 1, court_number: 2, team_a_one_id: "player-3", team_a_two_id: "player-6", team_b_one_id: "player-4", team_b_two_id: "player-5", score_a: 14, score_b: 14 },
]

function actorWith(matches: typeof completedRound, overrides: Record<string, unknown> = {}, roster: Array<(typeof players)[number] & { pair_number?: number }> = players) {
  const rpc = vi.fn().mockResolvedValue({ data: true, error: null })
  const tournament = { format: "dynamic_mexicano", status: matches.length ? "in_progress" : "draft", court_count: 2, round_count: 6, generation_seed: 41, ...overrides }
  const from = vi.fn((table: string) => {
    const result = table === "rapid_tournament_players" ? roster : table === "rapid_tournament_matches" ? matches : []
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: tournament, error: null }),
      then: (resolve: (value: unknown) => void) => Promise.resolve({ data: result, error: null }).then(resolve),
    }
    return query
  })
  return { actor: { supabase: { from, rpc }, user: { id: "creator" } } as unknown as AuthenticatedAppUser, rpc }
}

describe("dynamic Mexicano server generation", () => {
  it("persists the first round and lets the RPC start the draft atomically", async () => {
    const { actor, rpc } = actorWith([])
    await expect(generateAndPersistMexicanoRound(actor, "tournament", "creator")).resolves.toMatchObject({ ok: true, round: 1 })
    expect(rpc).toHaveBeenCalledWith("generate_dynamic_mexicano_round", expect.objectContaining({ p_round_number: 1, p_matches: expect.arrayContaining([expect.objectContaining({ court_number: 1 })]) }))
  })

  it("rejects advancing while the current round is incomplete", async () => {
    const incomplete = completedRound.map((match, index) => index ? match : { ...match, score_a: null, score_b: null }) as unknown as typeof completedRound
    const { actor, rpc } = actorWith(incomplete)
    await expect(generateAndPersistMexicanoRound(actor, "tournament", "creator")).resolves.toEqual({ ok: false, status: 409, error: "previous_round_incomplete" })
    expect(rpc).not.toHaveBeenCalled()
  })

  it("generates only the next round after all previous results", async () => {
    const { actor, rpc } = actorWith(completedRound)
    await expect(generateAndPersistMexicanoRound(actor, "tournament", "creator")).resolves.toMatchObject({ ok: true, round: 2 })
    expect(rpc).toHaveBeenCalledWith("generate_dynamic_mexicano_round", expect.objectContaining({ p_round_number: 2, p_matches: expect.any(Array) }))
  })

  it("stops after the configured final round", async () => {
    const finalRound = completedRound.map((match) => ({ ...match, round_number: 6 }))
    const { actor, rpc } = actorWith(finalRound)
    await expect(generateAndPersistMexicanoRound(actor, "tournament", "creator")).resolves.toEqual({ ok: false, status: 409, error: "dynamic_tournament_complete" })
    expect(rpc).not.toHaveBeenCalled()
  })
  it("uses fixed teams when the tournament pairing mode is fixed", async () => {
    const roster = players.map((player,i) => ({ ...player, pair_number: Math.floor(i/2)+1 }))
    const { actor, rpc } = actorWith([], { pairing: "fixed" }, roster)
    expect(await generateAndPersistMexicanoRound(actor,"tournament","creator")).toMatchObject({ ok: true, round: 1 })
    const pairById = new Map(roster.map(player => [player.id,player.pair_number]))
    for (const match of rpc.mock.calls[0][1].p_matches) for (const pair of [match.team_a,match.team_b]) expect(pairById.get(pair[0])).toBe(pairById.get(pair[1]))
  })
  it("does not persist a dynamic round with incomplete saved pairs", async () => {
    const { actor, rpc } = actorWith([], { pairing: "fixed" })
    expect(await generateAndPersistMexicanoRound(actor,"tournament","creator")).toMatchObject({ ok: false, status: 409, error: "invalid_tournament_schedule" })
    expect(rpc).not.toHaveBeenCalled()
  })
})
