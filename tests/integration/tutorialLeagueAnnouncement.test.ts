import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ notify: vi.fn(), broadcast: vi.fn(), metadata: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("sharp", () => ({ default: () => ({ metadata: mocks.metadata }) }))
vi.mock("@/lib/serverChatRealtime", () => ({ broadcastLeagueSeasonChatRefresh: mocks.broadcast }))
vi.mock("@/lib/serverLeagueChatAnnouncement", () => ({ notifyLeagueChatAnnouncement: mocks.notify }))

import { announceTutorialInLeagues } from "@/lib/serverTutorialChatShare"

const tutorial = { id: "t1", title: "Bienvenida", description: "", position: 1, audience: "leagues" as const, video_path: "v.mp4", poster_path: "p.jpg", width: 1080, height: 1920, duration_ms: 36000 }
const user = { id: "admin", email: "a@example.com" } as never

/** Minimal Supabase double: records writes and answers the few reads the announcer makes. */
function fakeSupabase(options: { announced?: string[]; openSeasons: Record<string, string | null>; names: Record<string, string>; rpcFails?: boolean }) {
  const updates: { table: string; values: unknown; filters: Record<string, unknown> }[] = []
  const rpcs: { name: string; args: Record<string, unknown> }[] = []
  const copies: { from: string; to: string }[] = []
  const chain = (table: string) => {
    const filters: Record<string, unknown> = {}
    let update: unknown = null
    const q: Record<string, unknown> = {}
    const answer = (single: boolean) => {
      if (table === "tutorial_video_leagues") return { data: Object.keys(options.names).map((id) => ({ league_id: id, announced_at: options.announced?.includes(id) ? "2026-11-18T10:00:00Z" : null })), error: null }
      if (table === "leagues") return { data: Object.entries(options.names).map(([id, name]) => ({ id, name })), error: null }
      if (table === "seasons") {
        const seasonId = options.openSeasons[String(filters.league_id)]
        return { data: single ? (seasonId ? { id: seasonId } : null) : [], error: null }
      }
      return { data: null, error: null }
    }
    for (const name of ["select", "in", "order", "limit"]) q[name] = () => q
    q.eq = (column: string, value: unknown) => { filters[column] = value; return q }
    q.update = (values: unknown) => { update = values; return q }
    q.maybeSingle = () => Promise.resolve(answer(true))
    q.then = (resolve: (value: unknown) => void) => {
      if (update) updates.push({ table, values: update, filters: { ...filters } })
      resolve(update ? { error: null } : answer(false))
    }
    return q
  }
  const supabase = {
    from: (table: string) => chain(table),
    rpc: (name: string, args: Record<string, unknown>) => {
      rpcs.push({ name, args })
      return Promise.resolve(options.rpcFails ? { data: null, error: { message: "boom" } } : { data: { id: `message-${rpcs.length}` }, error: null })
    },
    storage: {
      from: () => ({
        copy: (from: string, to: string) => { copies.push({ from, to }); return Promise.resolve({ error: null }) },
        download: () => Promise.resolve({ data: new Blob([new Uint8Array([1])]), error: null }),
      }),
    },
  }
  return { supabase: supabase as never, updates, rpcs, copies }
}

describe("tutorial announcement in league chats", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.metadata.mockResolvedValue({ width: 1920, height: 1080 }) })

  it("posts a Novedad signed by the league in the newest open season and remembers it", async () => {
    const fake = fakeSupabase({ openSeasons: { L1: "S1" }, names: { L1: "Liga Azul" } })
    const result = await announceTutorialInLeagues({ supabase: fake.supabase, user, tutorial, leagueIds: ["L1"] })
    expect(result).toEqual({ posted: 1, skipped: [] })
    expect(fake.rpcs).toHaveLength(1)
    expect(fake.rpcs[0].name).toBe("send_league_system_announcement")
    expect(fake.rpcs[0].args).toMatchObject({ p_season_id: "S1", p_sender_display_name: "Liga Azul", p_body: "Bienvenida", p_duration_ms: 36000 })
    // The message takes the shape of the thumbnail (16:9), not of the vertical video.
    expect(fake.rpcs[0].args).toMatchObject({ p_width: 1920, p_height: 1080 })
    expect(String(fake.rpcs[0].args.p_media_path)).toMatch(/^S1\/.+\.mp4$/)
    expect(fake.updates).toEqual([expect.objectContaining({ table: "tutorial_video_leagues", filters: { tutorial_id: "t1", league_id: "L1" } })])
    expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ leagueId: "L1", seasonId: "S1", messageId: "message-1", body: "Bienvenida" }))
  })

  it("never repeats the notice for a league that was already announced", async () => {
    const fake = fakeSupabase({ announced: ["L1"], openSeasons: { L1: "S1", L2: "S2" }, names: { L1: "Liga Azul", L2: "Liga Roja" } })
    const result = await announceTutorialInLeagues({ supabase: fake.supabase, user, tutorial, leagueIds: ["L1", "L2"] })
    expect(result.posted).toBe(1)
    expect(fake.rpcs.map((call) => call.args.p_season_id)).toEqual(["S2"])
  })

  it("reports the leagues without an open season instead of failing silently", async () => {
    const fake = fakeSupabase({ openSeasons: { L1: null, L2: "S2" }, names: { L1: "Liga Azul", L2: "Liga Roja" } })
    const result = await announceTutorialInLeagues({ supabase: fake.supabase, user, tutorial, leagueIds: ["L1", "L2"] })
    expect(result).toEqual({ posted: 1, skipped: [{ leagueId: "L1", leagueName: "Liga Azul", reason: "no_season" }] })
    expect(fake.updates.map((update) => update.filters.league_id)).toEqual(["L2"])
  })

  it("does not mark the league as announced when the message could not be saved", async () => {
    const fake = fakeSupabase({ openSeasons: { L1: "S1" }, names: { L1: "Liga Azul" }, rpcFails: true })
    const result = await announceTutorialInLeagues({ supabase: fake.supabase, user, tutorial, leagueIds: ["L1"] })
    expect(result).toEqual({ posted: 0, skipped: [{ leagueId: "L1", leagueName: "Liga Azul", reason: "failed" }] })
    expect(fake.updates).toEqual([])
    expect(mocks.notify).not.toHaveBeenCalled()
  })

  it("falls back to the video size when the thumbnail cannot be measured", async () => {
    mocks.metadata.mockRejectedValue(new Error("bad image"))
    const fake = fakeSupabase({ openSeasons: { L1: "S1" }, names: { L1: "Liga Azul" } })
    await announceTutorialInLeagues({ supabase: fake.supabase, user, tutorial, leagueIds: ["L1"] })
    expect(fake.rpcs[0].args).toMatchObject({ p_width: 1080, p_height: 1920 })
  })
})
