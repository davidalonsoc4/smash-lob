import { expect, it, vi } from "vitest"

const auth = vi.hoisted(() => vi.fn())
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: auth }))
vi.mock("@/lib/serverChatRealtime", () => ({
  getChatOverviewRealtimeTopic: () => null,
  getPersonalMatchChatRealtimeTopic: () => null,
}))

import { GET as getLeagueChats } from "@/app/api/chats/route"
import { GET as getFriendlyChats } from "@/app/api/personal-matches/chats/route"

const leagueId = "10000000-0000-4000-8000-000000000072"
const seasonId = "20000000-0000-4000-8000-000000000072"
const leagueUrl = `http://localhost/api/chats?leagueId=${leagueId}&seasonId=${seasonId}`
const friendlyUrl = "http://localhost/api/personal-matches/chats"
const matchIds = ["active", "finished", "future"]

function mockDatabase(rows: Record<string, Record<string, unknown>[]>) {
  const requestedIds = new Map<string, string[]>()
  const from = (table: string) => {
    let data = rows[table] ?? []
    const builder = {
      select: () => builder,
      eq: () => builder,
      in: (column: string, values: string[]) => {
        requestedIds.set(table, values)
        data = data.filter(row => values.includes(String(row[column])))
        return builder
      },
      order: () => builder,
      limit: () => builder,
      maybeSingle: async () => ({ data: data[0] ?? null, error: null }),
      then: (resolve: (value: unknown) => void) => resolve({ data, error: null }),
    }
    return builder
  }
  auth.mockResolvedValue({ ok: true, actor: { user: { id: "qa", isSuperuser: false }, supabase: { from, rpc: vi.fn() } } })
  return requestedIds
}

it("enriches only active participant chats for the compact league list", async () => {
  const reads = mockDatabase({
    league_memberships: [{ player_id: "me", user_id: "qa", role: "player" }],
    seasons: [{ status: "active", total_rounds: 12 }],
    matches: [...matchIds, "other-player"].map((id, index) => ({
      id, round: id === "future" ? 10 : index + 1,
      status: id === "finished" ? "finished" : "scheduling",
      team_a: id === "other-player" ? ["other"] : ["me"], team_b: ["rival"],
    })),
    match_chat_messages: [{ id: "unread", match_id: "finished", sender_user_id: "other", body: "Hola", kind: "text", created_at: "2026-10-16T10:00:00Z" }],
  })
  const active = await getLeagueChats(new Request(leagueUrl + "&activeRound=2"))
  expect((await active.json()).chats.map((chat: { id: string }) => chat.id)).toEqual(["active"])
  expect(reads.get("match_chat_messages")).toEqual(["active"])
  expect(reads.get("match_chat_reads")).toEqual(["active"])

  const all = await getLeagueChats(new Request(leagueUrl))
  expect((await all.json()).chats.map((chat: { id: string }) => chat.id).sort()).toEqual([...matchIds].sort())
  expect(reads.get("match_chat_messages")).toEqual(matchIds)
  const inbox = await getLeagueChats(new Request(leagueUrl + "&activeRound=2&includeUnread=1"))
  expect((await inbox.json()).chats.map((chat: { id: string }) => chat.id).sort()).toEqual(["active", "finished"])
  expect(reads.get("match_chat_messages")).not.toContain("other-player")
})

it("skips past and distant friendly messages until the full list is requested", async () => {
  const reads = mockDatabase({
    personal_match_participants: matchIds.map(match_id => ({ match_id, user_id: "qa", team: 1, slot: 1 })),
    personal_matches: matchIds.map(id => ({
      id, status: id === "finished" ? "finished" : "scheduled",
      played_at: id === "future" ? "2099-01-01T00:00:00Z" : null, result_recorded_at: null,
    })),
    personal_match_chat_messages: [{ match_id: "future", sender_user_id: "other", body: "Hola", created_at: "2026-10-16T10:00:00Z" }],
  })
  const active = await getFriendlyChats(new Request(friendlyUrl + "?active=1"))
  expect((await active.json()).chats.map((chat: { id: string }) => chat.id)).toEqual(["active"])
  expect(reads.get("personal_match_participants")).toEqual(["active"])
  expect(reads.get("personal_match_chat_messages")).toEqual(["active"])

  const all = await getFriendlyChats(new Request(friendlyUrl))
  expect((await all.json()).chats).toHaveLength(3)
  expect(reads.get("personal_match_chat_messages")).toEqual(matchIds)
  const inbox = await getFriendlyChats(new Request(friendlyUrl + "?active=1&includeUnread=1"))
  expect((await inbox.json()).chats.map((chat: { id: string }) => chat.id).sort()).toEqual(["active", "future"])
})
