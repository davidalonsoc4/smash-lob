import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { sendLeagueSystemText } from "@/lib/serverLeagueChatSystemMessage"

function fakeSupabase({ recent = 0, rpcError = null as null | { message: string } }) {
  const rpc = vi.fn(async () => ({ data: rpcError ? null : { id: "m1" }, error: rpcError }))
  const query = (table: string) => {
    const chain: Record<string, unknown> = {}
    const result = table === "leagues" ? { data: { name: "Liga Test" }, error: null } : { count: recent, error: null }
    for (const method of ["select", "eq", "gte"]) chain[method] = () => chain
    chain.maybeSingle = async () => result
    chain.then = (resolve: (value: unknown) => void) => resolve(result)
    return chain
  }
  return { client: { from: query, rpc } as never, rpc }
}

describe("sendLeagueSystemText", () => {
  it("signs the message with the league name", async () => {
    const { client, rpc } = fakeSupabase({})
    const result = await sendLeagueSystemText({ supabase: client, leagueId: "l", seasonId: "s", body: "Hola" })
    expect(result.ok).toBe(true)
    expect(rpc).toHaveBeenCalledWith("send_league_system_text", { p_season_id: "s", p_sender_display_name: "Liga Test", p_body: "Hola" })
  })
  it("limits to 5 per hour", async () => {
    const { client, rpc } = fakeSupabase({ recent: 5 })
    expect(await sendLeagueSystemText({ supabase: client, leagueId: "l", seasonId: "s", body: "Hola" })).toMatchObject({ ok: false, status: 429 })
    expect(rpc).not.toHaveBeenCalled()
  })
  it("reports a finished season as read only", async () => {
    const { client } = fakeSupabase({ rpcError: { message: "season_chat_read_only" } })
    expect(await sendLeagueSystemText({ supabase: client, leagueId: "l", seasonId: "s", body: "Hola" })).toMatchObject({ ok: false, status: 409 })
  })
})
