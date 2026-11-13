import { expect, it, vi } from "vitest"
import { CHAT_LIST_ACCOUNT_HEADER, createChatListMemory, emptyChatList } from "@/lib/chatListMemory"

const { actor } = vi.hoisted(() => ({ actor: { user: { email: "qa-chat@example.test" }, supabase: { from: vi.fn() } } }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: async () => ({ ok: true, actor }) }))
vi.mock("@/lib/serverLeagueSeasonChatAccess", () => ({ getLeagueSeasonChatActor: async () => ({ ok: true, actor }) }))

import { GET as getFriendly } from "@/app/api/personal-matches/chats/route"
import { GET as getMatches } from "@/app/api/chats/route"
import { GET as getGeneral } from "@/app/api/league-season-chats/[seasonId]/route"

it("retains the current session snapshot on invalidation and discards it after access changes", () => {
  const memory = createChatListMemory()
  memory.save(emptyChatList, "scope-a", Date.now())
  expect(memory.isFresh("scope-a")).toBe(true)
  expect(memory.isFresh("scope-b")).toBe(false)
  expect(createChatListMemory().read()).toBeNull()
  memory.invalidate()
  expect(memory.isFresh("scope-a")).toBe(false)
  expect(memory.read()?.snapshot).toBe(emptyChatList)
  const version = memory.version()
  memory.discard()
  expect(memory.read()).toBeNull()
  expect(memory.version()).toBeGreaterThan(version)
})

it("rejects cached-list reads when the request account no longer matches the session", async () => {
  const request = new Request("http://localhost/api/chats", {
    headers: { [CHAT_LIST_ACCOUNT_HEADER]: "other-chat%40example.test" },
  })
  const responses = await Promise.all([
    getFriendly(request),
    getMatches(request),
    getGeneral(request, { params: Promise.resolve({ seasonId: "season-qa" }) }),
  ])
  expect(responses.map(response => response.status)).toEqual([403, 403, 403])
  expect(actor.supabase.from).not.toHaveBeenCalled()
})
