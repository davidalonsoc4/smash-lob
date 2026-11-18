import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ announce: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/serverTutorialChatShare", () => ({ announceTutorialInLeagues: mocks.announce }))

import { runScheduledTutorialAnnouncements } from "@/lib/serverTutorialScheduledAnnouncements"

const tutorial = { id: "t1", title: "Bienvenida", description: "", position: 1, audience: "leagues", video_path: "v.mp4", poster_path: "p.jpg", width: 1080, height: 1920, duration_ms: 1000, created_by: "admin-id" }

/** Supabase double: `due` are the tutorials found as due; `claimable` decides if the atomic claim wins. */
function fakeSupabase(options: { due: unknown[]; claimable?: boolean; unannounced?: string[] }) {
  const calls: { table: string; op: string; values?: unknown; filters: [string, unknown][] }[] = []
  const chain = (table: string) => {
    const filters: [string, unknown][] = []
    let op = "select"
    let values: unknown
    const q: Record<string, unknown> = {}
    for (const name of ["select", "lte", "limit"]) q[name] = () => q
    q.eq = (column: string, value: unknown) => { filters.push([column, value]); return q }
    q.is = (column: string, value: unknown) => { filters.push([column, value]); return q }
    q.update = (next: unknown) => { op = "update"; values = next; return q }
    q.then = (resolve: (value: unknown) => void) => {
      calls.push({ table, op, values, filters: [...filters] })
      if (table === "tutorial_videos") resolve(op === "update" ? { data: options.claimable === false ? [] : [{ id: "t1" }], error: null } : { data: options.due, error: null })
      else resolve({ data: (options.unannounced ?? []).map((id) => ({ league_id: id })), error: null })
    }
    return q
  }
  return { supabase: { from: chain } as never, calls }
}

describe("scheduled tutorial announcements", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.announce.mockResolvedValue({ posted: 2, skipped: [{ leagueId: "L3", leagueName: "X", reason: "no_season" }] }) })

  it("announces the due tutorial in the leagues that were not announced and reports the outcome", async () => {
    const fake = fakeSupabase({ due: [tutorial], unannounced: ["L1", "L2"] })
    const summary = await runScheduledTutorialAnnouncements({ supabase: fake.supabase, now: new Date("2026-11-20T10:00:00Z") })
    expect(summary).toEqual({ tutorials: 1, posted: 2, skipped: 1 })
    expect(mocks.announce).toHaveBeenCalledWith(expect.objectContaining({ leagueIds: ["L1", "L2"], tutorial: expect.objectContaining({ id: "t1" }), user: expect.objectContaining({ id: "admin-id", isSuperuser: true }) }))
    // The flag is cleared by the claim, so the tutorial is never announced twice.
    expect(fake.calls.find((call) => call.op === "update")?.values).toEqual({ announce_on_publish: false })
  })

  it("does nothing when another run already claimed the tutorial", async () => {
    const fake = fakeSupabase({ due: [tutorial], claimable: false, unannounced: ["L1"] })
    const summary = await runScheduledTutorialAnnouncements({ supabase: fake.supabase })
    expect(summary).toEqual({ tutorials: 0, posted: 0, skipped: 0 })
    expect(mocks.announce).not.toHaveBeenCalled()
  })

  it("claims but does not announce when every league was already announced", async () => {
    const fake = fakeSupabase({ due: [tutorial], unannounced: [] })
    const summary = await runScheduledTutorialAnnouncements({ supabase: fake.supabase })
    expect(summary).toEqual({ tutorials: 1, posted: 0, skipped: 0 })
    expect(mocks.announce).not.toHaveBeenCalled()
  })

  it("skips tutorials that are not for leagues", async () => {
    const fake = fakeSupabase({ due: [{ ...tutorial, audience: "public" }], unannounced: ["L1"] })
    await runScheduledTutorialAnnouncements({ supabase: fake.supabase })
    expect(mocks.announce).not.toHaveBeenCalled()
  })
})
