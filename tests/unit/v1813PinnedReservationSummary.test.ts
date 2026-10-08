import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.13 pinned reservation summary", () => {
  it("derives the pinned summary from the current schedule, including manual scheduling instead of chat history", async () => {
    const route = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    expect(route).toContain('match.status === "scheduled" && match.scheduledAt')
    expect(route).toContain("getScheduleLocationDisplayText(match.location)")
    expect(route).toContain("reservationSummary")
    const summary = route.match(/const reservationSummary = (.+)/)?.[1]
    expect(summary).toBeDefined()
    expect(summary).not.toContain("courtBooking.isReserved")
  })

  it("keeps the reservation summary fixed above the independently scrollable message history", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("app-match-reservation-banner")
    expect(page).toContain('className="block app-match-reservation-label type-caption font-black uppercase tracking-[0.12em]"')
    expect(page).toContain('className="block app-match-reservation-detail type-small font-semibold"')
    expect(page).toContain('tx("Guardar en calendario")')
    expect(page.indexOf("triggerClassName=\"app-match-reservation-banner")).toBeLessThan(page.indexOf("ref={messagesRef}"))
    expect(page).toContain('ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto')
  })

  it("documents the pinned booking summary in the match-chat guide", async () => {
    const tours = await readFile("src/features/onboarding/tours.ts", "utf8")
    expect(tours).toContain('key: "chat", version: 7')
    expect(tours).toContain("resumen queda fijado sobre el historial")
  })
})
