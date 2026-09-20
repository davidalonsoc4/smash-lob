import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.13 pinned reservation summary", () => {
  it("derives the pinned summary from the current reserved schedule instead of chat history", async () => {
    const route = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    expect(route).toContain('match.status === "scheduled" && match.scheduledAt && match.courtBooking.isReserved')
    expect(route).toContain("getScheduleLocationDisplayText(match.location)")
    expect(route).toContain("reservationSummary")
  })

  it("keeps the reservation summary fixed above the independently scrollable message history", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("app-match-reservation-banner")
    expect(page).toContain('className="app-match-reservation-label type-caption font-black uppercase tracking-[0.12em]"')
    expect(page).toContain('className="truncate type-caption font-semibold"')
    expect(page).toContain('ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto')
  })

  it("documents the pinned booking summary in the match-chat guide", async () => {
    const tours = await readFile("src/features/onboarding/tours.ts", "utf8")
    expect(tours).toContain('key: "chat", version: 7')
    expect(tours).toContain("resumen queda fijado sobre el historial")
  })
})
