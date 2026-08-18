import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import {
  getMatchChatWriteUntil,
  getPersonalMatchChatDeleteAfter,
  isMatchChatReadOnly,
  isPersonalMatchChatExpired,
} from "@/lib/matchChatWindow"

const read = (file: string) => readFile(file, "utf8")

describe("v1.10.10 unified match detail and friendly chat", () => {
  it("uses the same visual match components for league and friendly matches", async () => {
    const [personalPage, schedule, booking, result, pairing, detailModel] =
      await Promise.all([
        read("src/app/personal-matches/[id]/page.tsx"),
        read("src/components/personal/PersonalMatchSchedulePanel.tsx"),
        read("src/components/personal/PersonalMatchCourtBookingPanel.tsx"),
        read("src/components/personal/PersonalMatchResultForm.tsx"),
        read("src/components/match/MatchDetailPairingPanel.tsx"),
        read("src/lib/personalMatchDetailModel.ts"),
      ])

    expect(personalPage).toContain("<MatchDetailView")
    expect(personalPage).toContain("buildPersonalMatchDetailModel")
    expect(schedule).toContain("<MatchScheduleForm")
    expect(booking).toContain("<CourtBookingPanel")
    expect(result).toContain("<MatchResultForm")
    expect(pairing).toContain("showPendingPlayerMetadata?: boolean")
    expect(pairing).toContain("showFinishedPlayerMetadata?: boolean")
    expect(personalPage).toContain("showPendingPlayerMetadata: true")
    expect(personalPage).toContain("showFinishedPlayerMetadata: false")
    expect(personalPage).not.toContain("rankingPositions:")
    expect(detailModel).toContain("preferredSide: participant.preferredSide")
    expect(detailModel).toContain("dominantHand: participant.dominantHand")
  })

  it("keeps both chats writable for 24h after the recorded result", () => {
    const resultRecordedAt = "2026-08-18T18:00:00.000Z"
    const writeUntil = getMatchChatWriteUntil({
      status: "finished",
      resultRecordedAt,
    })

    expect(writeUntil?.toISOString()).toBe("2026-08-19T18:00:00.000Z")
    expect(
      isMatchChatReadOnly({
        status: "finished",
        resultRecordedAt,
        now: new Date("2026-08-19T17:59:59.999Z"),
      }),
    ).toBe(false)
    expect(
      isMatchChatReadOnly({
        status: "finished",
        resultRecordedAt,
        now: new Date("2026-08-19T18:00:00.000Z"),
      }),
    ).toBe(true)
  })

  it("retains friendly chat for two calendar months and then expires it", () => {
    const resultRecordedAt = "2026-08-18T18:00:00.000Z"
    const deleteAfter = getPersonalMatchChatDeleteAfter({
      status: "finished",
      resultRecordedAt,
    })

    expect(deleteAfter?.toISOString()).toBe("2026-10-18T18:00:00.000Z")
    expect(
      isPersonalMatchChatExpired({
        status: "finished",
        resultRecordedAt,
        now: new Date("2026-10-18T17:59:59.999Z"),
      }),
    ).toBe(false)
    expect(
      isPersonalMatchChatExpired({
        status: "finished",
        resultRecordedAt,
        now: new Date("2026-10-18T18:00:00.000Z"),
      }),
    ).toBe(true)
  })

  it("adds a protected text chat to friendly matches with realtime and retention cleanup", async () => {
    const [page, shared, api, migration, shell, cron, realtime] = await Promise.all([
      read("src/app/personal-matches/[id]/chat/page.tsx"),
      read("src/components/match/chat/MatchChatShared.tsx"),
      read("src/app/api/personal-matches/[id]/chat/route.ts"),
      read("supabase/migrations/20260818213500_add_personal_match_chat.sql"),
      read("src/components/layout/AppShell.tsx"),
      read("src/app/api/notifications/scheduled-check/route.ts"),
      read("src/lib/serverChatRealtime.ts"),
    ])

    expect(page).toContain("Chat · Amistoso")
    expect(page).toContain("subscribeChatRealtime")
    expect(page).toContain("<MatchChatComposer")
    expect(page).toContain("<MatchChatReadOnlyBar>")
    expect(shared).toContain("<MatchChatSendIcon />")
    expect(shared).toContain('data-tour="chat-composer"')
    expect(api).toContain("requireAuthenticatedAppUser")
    expect(api).toContain('from("personal_match_participants")')
    expect(api).toContain("isMatchChatReadOnly")
    expect(api).toContain("text.length > 2000")
    expect(api).toContain("Date.now() - 10_000")
    expect(api).toContain("broadcastPersonalMatchChatRefresh")
    expect(migration).toContain("personal_match_chat_messages")
    expect(migration).toContain("personal_match_chat_reads")
    expect(migration).toContain("interval '2 months'")
    expect(migration).toContain("enable row level security")
    expect(migration).toContain("from public, anon, authenticated")
    expect(cron).toContain('rpc("cleanup_expired_personal_match_chat")')
    expect(realtime).toContain("getPersonalMatchChatRealtimeTopic")
    expect(shell).toContain('pathname.startsWith("/personal-matches/")')
    expect(shell).toContain('pathname.endsWith("/chat")')
  })

  it("gives league chat the same 24h grace period but closes coordination actions at result", async () => {
    const [api, page, shared, overview] = await Promise.all([
      read("src/app/api/matches/[matchId]/chat/route.ts"),
      read("src/app/match/[id]/chat/page.tsx"),
      read("src/components/match/chat/MatchChatShared.tsx"),
      read("src/app/api/chats/route.ts"),
    ])

    expect(api).toContain("isMatchChatReadOnly")
    expect(api).not.toContain("participant(matchId, true)")
    expect(api).toContain("match_chat_actions_closed")
    expect(page).toContain("matchFinished")
    expect(page).toContain("<MatchChatWriteWindowBanner")
    expect(page).toContain("<MatchChatReadOnlyBar>")
    expect(shared).toContain("24 h después del resultado")
    expect(overview).toContain("isMatchChatReadOnly")
  })
})
