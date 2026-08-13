import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.1 realtime chat", () => {
  it("keeps private chat tables server-only and uses opaque broadcast topics", async () => {
    const migration = await readFile("supabase/migrations/20260812103000_add_match_chat.sql", "utf8")
    const serverRealtime = await readFile("src/lib/serverChatRealtime.ts", "utf8")
    expect(migration).toContain("revoke all on table public.match_chat_messages from public, anon, authenticated")
    expect(serverRealtime).toContain('createHmac("sha256", secret)')
    expect(serverRealtime).toContain('`sl_chat_match_${token}`')
    expect(serverRealtime).toContain('`sl_chat_overview_${token}`')
    expect(serverRealtime).toContain('JSON.stringify({ refresh: true })')
    expect(serverRealtime).not.toContain("messagePreview")
    expect(serverRealtime).not.toContain("sender_display_name")
  })

  it("broadcasts chat inserts and proposal responses without making delivery mandatory", async () => {
    const api = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    expect(api).toContain("getMatchChatRealtimeTopic(matchId)")
    expect(api).toContain("await broadcastMatchChatRefresh({ matchId, leagueId: match.leagueId, seasonId: match.seasonId })")
    expect(api).toContain("includeOverview: false")
    expect(api).toContain('return NextResponse.json({ message: { ...data, responses: [] } }, { status: 201 })')
  })

  it("replaces chat polling with a shared Supabase Broadcast subscription", async () => {
    const client = await readFile("src/lib/chatRealtimeClient.ts", "utf8")
    const chat = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(client).toContain('.on("broadcast", { event: CHAT_REALTIME_EVENT }')
    expect(client).toContain("subscriptions = new Map")
    expect(client).toContain("supabase.removeChannel")
    expect(chat).toContain("subscribeChatRealtime(realtimeTopic")
    expect(chat).not.toContain("window.setInterval")
    expect(chat).toContain('document.addEventListener("visibilitychange"')
  })

  it("updates the chats overview and navbar unread badge from realtime invalidations", async () => {
    const api = await readFile("src/app/api/chats/route.ts", "utf8")
    const chats = await readFile("src/app/chats/page.tsx", "utf8")
    const nav = await readFile("src/components/layout/BottomNav.tsx", "utf8")
    expect(api).toContain("getChatOverviewRealtimeTopic(leagueId, seasonId)")
    expect(chats).toContain("subscribeChatRealtime(realtimeTopic")
    expect(chats).not.toContain("window.setInterval")
    expect(nav).toContain("subscribeChatRealtime(realtimeTopic")
    expect(nav).toContain("CHAT_UNREAD_LOCAL_REFRESH_EVENT")
    expect(nav).not.toContain("window.setInterval")
  })

  it("refreshes chat state when scheduling, result or incident resolution changes", async () => {
    for (const file of [
      "src/app/api/matches/[matchId]/schedule/route.ts",
      "src/app/api/matches/[matchId]/result/route.ts",
      "src/app/api/matches/[matchId]/incident/route.ts",
    ]) {
      const source = await readFile(file, "utf8")
      expect(source).toContain('import { broadcastMatchChatRefresh } from "@/lib/serverChatRealtime"')
      expect(source).toContain("await broadcastMatchChatRefresh({ matchId: updatedMatch.id")
    }
  })
})
