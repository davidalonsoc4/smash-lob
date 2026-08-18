import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.7.0 match chat MVP", () => {
  it("keeps chat data private, bounded and retained for the agreed window", async () => {
    const sql = await readFile(
      "supabase/migrations/20260812103000_add_match_chat.sql",
      "utf8",
    )
    expect(sql).toContain("match_chat_messages_body_check")
    expect(sql).toContain("between 1 and 2000")
    expect(sql).toContain("enable row level security")
    expect(sql).toContain(
      "revoke all on table public.match_chat_messages from public, anon, authenticated",
    )
    expect(sql).toContain("cleanup_old_match_chat_after_season_finish")
    expect(sql).toContain("then 2 else 3")
  })

  it("uses the shared match policy and requires an actual participant", async () => {
    const api = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    expect(api).toContain('import { getServerMatchActor } from "@/lib/serverMatchAccess"')
    expect(api).toContain("getServerMatchActor(matchId, {")
    expect(api).toContain("requireLeagueAccess: true")
    expect(api).toContain("requireParticipant: true")
    expect(api).toContain("participantPlayerId: playerId")
    expect(api).toContain("sender_player_id: playerId")
    expect(api).not.toContain("isLeagueAdmin")
  })

  it("keeps message and abuse limits", async () => {
    const api = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    expect(api).toContain("body.length > 2000")
    expect(api).toContain("Date.now() - 10_000")
    expect(api).toContain(">= 8")
    expect(api).toContain(".limit(60)")
  })

  it("integrates chat as a participant-only floating action above match actions", async () => {
    const page = await readFile("src/app/match/[id]/page.tsx", "utf8")
    const menu = await readFile("src/components/match/MatchActionsMenu.tsx", "utf8")
    const chatAction = await readFile("src/components/match/MatchChatFloatingAction.tsx", "utf8")
    const chat = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    const shared = await readFile("src/components/match/chat/MatchChatShared.tsx", "utf8")
    expect(page).toContain('chatHref={isMatchParticipant ? `/match/${match.id}/chat` : null}')
    expect(page).not.toContain("Habla con los otros jugadores y organiza el encuentro.")
    expect(menu).toContain("<MatchChatActionLink")
    expect(chatAction).toContain('aria-label="Abrir chat del partido"')
    expect(chatAction).toContain("app-floating-primary-control")
    expect(chatAction).toContain("bg-neutral-950 text-white")
    expect(chatAction).toContain("flex flex-col items-end gap-2")
    expect(chatAction).toContain('bottom: "calc(84px + env(safe-area-inset-bottom, 0px))"')
    expect(chat).toContain("subscribeChatRealtime")
    expect(chat).not.toContain("window.setInterval")
    expect(chat).toContain("<MatchChatComposer")
    expect(shared).toContain("maxLength={2000}")
    expect(shared).toContain('event.key === "Enter"')
    expect(chat).toContain("Chat · Jornada")
    expect(chat).toContain("useCurrentLeagueData")
    expect(chat).not.toContain('bottom: "calc(72px + env(safe-area-inset-bottom, 0px))"')
  })
})
