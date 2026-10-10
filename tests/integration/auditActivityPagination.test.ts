import { expect, it } from "vitest"
import { fetchServerActivityPage } from "@/lib/serverActivity"
import { parseActivityCursor } from "@/lib/activityCursor"

const stamp = "2026-10-10T08:00:00.123456+00:00"
const id = (n: number) => `11111111-1111-4111-8111-${String(n).padStart(12, "0")}`

function viewerFor(rows: Array<Record<string, unknown>>) {
  const supabase = { from: () => {
    const filters: Array<(row: Record<string, unknown>) => boolean> = []
    const orders: string[] = []
    let limit = Infinity
    const q = {
      select: () => q, eq: (key: string, value: unknown) => { filters.push((row) => row[key] === value); return q },
      lt: (key: string, value: string) => { filters.push((row) => String(row[key]) < value); return q },
      or: (expression: string) => {
        const match = expression.match(/^created_at.lt.(.*),and\(created_at.eq.(.*),id.lt.(.*)\)$/)!
        filters.push((row) => String(row.created_at) < match[1] || (row.created_at === match[2] && String(row.id) < match[3]))
        return q
      },
      order: (key: string) => { orders.push(key); return q }, limit: (value: number) => { limit = value; return q },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows.filter((row) => filters.every((filter) => filter(row))).sort((a, b) => {
        for (const key of orders) { const result = String(b[key]).localeCompare(String(a[key])); if (result) return result }
        return 0
      }).slice(0, limit), error: null }).then(resolve),
    }
    return q
  } }
  return { supabase, isCompetitionAdmin: false, membership: { playerId: "viewer" } } as unknown as Parameters<typeof fetchServerActivityPage>[0]["viewer"]
}

it("pages through identical timestamps without losing or duplicating any event", async () => {
  const rows = [1, 4, 2, 3, 5].map((n) => ({ id: id(n), league_id: "league", type: "league_updated", created_at: stamp }))
  const viewer = viewerFor(rows)
  const found: string[] = []
  let cursor: string | null = null
  do {
    const page = await fetchServerActivityPage({ viewer, leagueId: "league", limit: 2, createdAtBefore: cursor })
    found.push(...page.items.map((event) => event.id))
    cursor = page.nextCursor
  } while (cursor)
  expect(found).toEqual([5, 4, 3, 2, 1].map(id))
})

it("advances over an entirely private page without exposing its events", async () => {
  const viewer = viewerFor([3, 2, 1].map((n) => ({ id: id(n), league_id: "league", created_at: stamp, type: n > 1 ? "match_ball_custodian_assigned" : "league_updated", metadata: { targetPlayerIds: ["other"] } })))
  const first = await fetchServerActivityPage({ viewer, leagueId: "league", limit: 2 })
  expect(first.items).toEqual([])
  expect(first.nextCursor).toBeTruthy()
  const second = await fetchServerActivityPage({ viewer, leagueId: "league", limit: 2, createdAtBefore: first.nextCursor })
  expect(second.items.map((event) => event.id)).toEqual([id(1)])
  expect(second.nextCursor).toBeNull()
})

it("accepts legacy timestamp bounds and rejects filter injection", () => {
  expect(parseActivityCursor(stamp)).toEqual({ createdAt: stamp, id: null })
  for (const cursor of ["bad", `${stamp}|id.lt.fake`, `${stamp}|${id(1)}|extra`, `${stamp},id.gt.0`]) {
    expect(() => parseActivityCursor(cursor)).toThrow("invalid_activity_cursor")
  }
})
