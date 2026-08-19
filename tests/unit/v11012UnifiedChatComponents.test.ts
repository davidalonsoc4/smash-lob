import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.12 shared league and friendly match chat", () => {
  it("routes both chat screens through the same visual and interaction primitives", async () => {
    const [league, personal, shared] = await Promise.all([
      read("src/app/match/[id]/chat/page.tsx"),
      read("src/app/personal-matches/[id]/chat/page.tsx"),
      read("src/components/match/chat/MatchChatShared.tsx"),
    ])

    for (const token of [
      "MatchChatComposer",
      "MatchChatReadOnlyBar",
      "MatchChatTextMessage",
      "MatchChatWriteWindowBanner",
      "useMatchChatAutoScroll",
      "useMatchChatViewport",
    ]) {
      expect(league, `Liga debe reutilizar ${token}`).toContain(token)
      expect(personal, `Amistoso debe reutilizar ${token}`).toContain(token)
    }

    expect(league).toContain("<MatchChatFrame")
    expect(personal).toContain("<MatchChatScreen")
    expect(shared).toContain("<MatchChatFrame")
    expect(shared).toContain('data-tour="chat-messages"')
    expect(shared).toContain('data-tour="chat-composer"')
  })

  it("keeps message identity, receipts, composer and mobile viewport behavior in the shared implementation", async () => {
    const shared = await read("src/components/match/chat/MatchChatShared.tsx")

    for (const token of [
      "CHAT_PERSON_COLORS",
      "getMatchChatParticipantColorClass",
      "<PlayerAvatar",
      "MatchChatMessageReceipt",
      '"Leído por todos"',
      'allRead ? "✓✓" : "✓"',
      "<MatchChatSendIcon />",
      'aria-label={tx("Enviar mensaje")}',
      "maxLength={2000}",
      "window.visualViewport",
      'html.dataset.matchChatActive = "true"',
      "--match-chat-bottom-inset",
      'className="fixed inset-x-0 top-0 z-[60] mx-auto flex w-full max-w-md',
      'max-w-[86%] rounded-2xl px-2.5 py-1.5 shadow-sm',
    ]) {
      expect(shared).toContain(token)
    }
  })

  it("keeps league-only coordination features as extensions around the shared chat core", async () => {
    const league = await read("src/app/match/[id]/chat/page.tsx")

    expect(league).toContain('data-tour="chat-proposals"')
    expect(league).toContain('"date_proposal"')
    expect(league).toContain('"location_proposal"')
    expect(league).toContain("<MatchReservationConfirmation")
    expect(league).toContain("MentionText")
    expect(league).toContain("replyingTo")
    expect(league).toContain("<MatchChatTextMessage")
    expect(league).toContain("<MatchChatComposer")
  })

  it("does not reimplement the shared visual chat primitives inside the friendly page", async () => {
    const personal = await read("src/app/personal-matches/[id]/chat/page.tsx")

    expect(personal).toContain("<MatchChatTextMessage")
    expect(personal).toContain("<MatchChatComposer")
    expect(personal).toContain("<MatchChatReadOnlyBar>")
    expect(personal).toContain("<MatchChatWriteWindowBanner")
    expect(personal).not.toContain("CHAT_PERSON_COLORS")
    expect(personal).not.toContain("<PlayerAvatar")
    expect(personal).not.toContain("<MatchChatSendIcon")
    expect(personal).not.toContain("function MatchChatMessageReceipt")
    expect(personal).not.toContain('className="fixed inset-x-0 top-0 z-[60]')
  })

  it("keeps the friendly retention rules and the league 24h grace period unchanged", async () => {
    const [personalApi, leagueApi, migration] = await Promise.all([
      read("src/app/api/personal-matches/[id]/chat/route.ts"),
      read("src/app/api/matches/[matchId]/chat/route.ts"),
      read("supabase/migrations/20260818213500_add_personal_match_chat.sql"),
    ])

    expect(personalApi).toContain("isMatchChatReadOnly")
    expect(personalApi).toContain("isPersonalMatchChatExpired")
    expect(leagueApi).toContain("isMatchChatReadOnly")
    expect(migration).toContain("interval '2 months'")
  })
})
