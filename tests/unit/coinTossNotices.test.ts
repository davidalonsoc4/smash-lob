import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
import { createCoinTossOpenEvents } from "@/lib/serverCoinTossNotices"

const NOW = new Date("2026-11-26T15:40:00Z")
const match = (id: string, patch: Record<string, unknown> = {}) => ({
  id, league_id: "l1", season_id: "s1", round: 3, team_a: ["a", "b"], team_b: ["c", "d"], scheduled_at: "2026-11-26T16:00:00Z", result_recorded_at: null, ...patch,
})

/** A tiny stand-in for the data client: what each table already holds, and the events that get inserted. */
function fakeClient({ tossed = [], noticed = [] }: { tossed?: string[]; noticed?: string[] }) {
  const inserted: Array<Record<string, unknown>> = []
  const client = {
    from: (table: string) => ({
      select: () => ({
        in: (_column: string, ids: string[]) => {
          const rows = (table === "match_coin_tosses" ? tossed : noticed).filter((id) => ids.includes(id)).map((match_id) => ({ match_id }))
          const result = Promise.resolve({ data: rows, error: null })
          return Object.assign(result, { eq: () => ({ in: () => result }) })
        },
        eq: () => ({ in: (_c: string, ids: string[]) => Promise.resolve({ data: noticed.filter((id) => ids.includes(id)).map((match_id) => ({ match_id })), error: null }) }),
      }),
      insert: (row: Record<string, unknown>) => {
        inserted.push(row)
        return { select: () => ({ single: async () => ({ data: { id: `event-${inserted.length}` }, error: null }) }) }
      },
    }),
  }
  return { client: client as never, inserted }
}

describe("notice that the coin toss is open (leagues)", () => {
  it("creates one event for a match whose toss has just opened, with its players", async () => {
    const { client, inserted } = fakeClient({})
    const ids = await createCoinTossOpenEvents({ supabase: client, matches: [match("m1")], now: NOW })
    expect(ids).toEqual(["event-1"])
    expect(inserted[0]).toMatchObject({ type: "match_coin_toss_open", match_id: "m1", description: "Ya puedes sortear el saque de tu partido." })
    expect((inserted[0].metadata as { participantIds: string[] }).participantIds).toEqual(["a", "b", "c", "d"])
  })

  it("skips matches that are not due, that have a result, that were tossed already, or that were already told", async () => {
    const { client, inserted } = fakeClient({ tossed: ["tossed"], noticed: ["noticed"] })
    const ids = await createCoinTossOpenEvents({
      supabase: client, now: NOW,
      matches: [match("early", { scheduled_at: "2026-11-26T18:00:00Z" }), match("done", { result_recorded_at: "2026-11-26T15:00:00Z" }), match("tossed"), match("noticed"), match("ok")],
    })
    expect(ids).toEqual(["event-1"])
    expect(inserted.map((row) => row.match_id)).toEqual(["ok"])
  })
})
