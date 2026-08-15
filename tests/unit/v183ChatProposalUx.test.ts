import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.3 chat proposal UX", () => {
  it("starts at the latest messages without smooth scrolling", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("useLayoutEffect")
    expect(page).toContain("panel.scrollTop = panel.scrollHeight")
    expect(page).not.toContain('behavior: "smooth"')
    expect(page).toContain("initialLoadComplete")
  })

  it("uses a two-week calendar with availability-aware defaults", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("buildProposalCalendarDays")
    expect(page).toContain("grid grid-cols-7")
    expect(page).toContain("Horarios compatibles")
    expect(page).toContain("getRecommendedDefaultDateTimeLocalValue")
    expect(page).toContain("nextFullHourValue")
    expect(page).toContain("fetchSupabaseMatchPlayerAvailabilities")
    expect(page).toContain("dateDraftTouchedRef")
  })

  it("lets focus behave naturally except after sending text", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("function focusComposerAfterSend")
    expect(page).toContain('post("text", replyTo ? { replyTo } : {}, text, true)')
    expect(page).toContain("composerRef.current?.blur()")
    expect(page).not.toContain("preserveComposerFocus")
    expect(page).not.toContain("handleComposerBlur")
    expect(page).not.toContain("autoFocus")
  })

  it("shows known locations as town and name", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("getLeagueLocationOptionLabel(location)")
    expect(page).toContain("getLeagueLocationOptionLabel(known)")
  })

  it("prefetches active chats without marking them read", async () => {
    const listPage = await readFile("src/app/chats/page.tsx", "utf8")
    const chatPage = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    const api = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    const cache = await readFile("src/lib/matchChatCache.ts", "utf8")
    expect(listPage).toContain("chat?markRead=0")
    expect(listPage).toContain("writeMatchChatCache")
    expect(chatPage).toContain("readMatchChatCache")
    expect(chatPage).toContain("writeMatchChatCache")
    expect(api).toContain('get("markRead") !== "0"')
    expect(api).toContain("if (markRead && latestIncoming")
    expect(api).toContain('from("match_chat_reads").upsert')
    expect(cache).toContain("window.sessionStorage")
  })
  it("shows weekday-aware proposal dates and large visual voting controls", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("proposalVoteDate")
    expect(page).toContain('weekday: "long"')
    expect(page).toContain('border-emerald-600 bg-emerald-600 text-white')
    expect(page).toContain('border-red-600 bg-red-600 text-white')
    expect(page).toContain('aria-label={`Me viene bien · ${yes} votos`}')
    expect(page).toContain('aria-label={`No puedo · ${no} votos`}')
  })

})
