import { expect, it, vi } from "vitest"
import { duplicateServerSeason } from "@/lib/serverSeasonDuplication"
import { updateServerSeasonRoundOrder } from "@/lib/serverSeasonMutations"

type Row = Record<string, unknown>
type Client = Parameters<typeof updateServerSeasonRoundOrder>[0]["supabase"]

it.each([[2], [1, 1], [1, 2, 4]])("rejects incomplete/invalid round order %j before any write", async (...values) => {
  const roundOrder = values as number[]
  const update = vi.fn()
  const q = { select: () => q, eq: () => q, update,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [{ id: "a", round: 1 }, { id: "b", round: 2 }, { id: "c", round: 3 }], error: null }).then(resolve) }
  await expect(updateServerSeasonRoundOrder({ supabase: { from: () => q } as unknown as Client, seasonId: "season", roundOrder })).rejects.toMatchObject({ code: "invalid_round_order" })
  expect(update).not.toHaveBeenCalled()
})

it("duplicates an extended season with its original custom round count", async () => {
  const writes: Record<string, Row[]> = {}
  const source = { id: "source", league_id: "league", name: "Source", status: "finished", total_rounds: 14, completed_rounds: 14 }
  const playerIds = Array.from({ length: 8 }, (_, i) => `player-${i}`)
  const db = { from: (table: string) => {
    const filters: Record<string, unknown> = {}
    let inserted: Row[] | null = null
    const result = () => {
      if (inserted) return inserted
      if (table === "seasons") return filters.status ? [] : [source]
      if (table === "season_settings") return [{ schedule_mode: "extended", round_window_mode: "none" }]
      if (table === "season_players") return playerIds.map((player_id) => ({ player_id, status: "active" }))
      if (table === "players") return playerIds.map((id) => ({ id, display_name: id, league_id: "league" }))
      return []
    }
    const q = { select: () => q, eq: (key: string, value: unknown) => { filters[key] = value; return q }, in: () => q, limit: () => q,
      insert: (value: Row | Row[]) => { inserted = Array.isArray(value) ? value : [{ ...value, id: "created" }]; writes[table] = inserted; return q },
      update: () => q, maybeSingle: async () => ({ data: result()[0] ?? null, error: null }), single: async () => ({ data: result()[0], error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: result(), error: null }).then(resolve),
    }
    return q
  } }
  const actor = { supabase: db } as unknown as Parameters<typeof duplicateServerSeason>[0]["actor"]
  const result = await duplicateServerSeason({ actor, leagueId: "league", sourceSeasonId: "source", name: "Copy" })
  expect(result.duplicatedSeason.totalRounds).toBe(14)
  expect(writes.seasons[0].total_rounds).toBe(14)
  expect(new Set(writes.matches.map((match) => match.round)).size).toBe(14)
})
