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
    expect(page).toContain('reservationSummary ? <div className="flex shrink-0 items-center')
    expect(page).toContain('<span className="uppercase tracking-wide text-blue-700">{tx("Reserva")}</span>')
    expect(page).toContain('className="min-w-0 flex-1 truncate type-caption font-black"')
    expect(page).toContain('ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto')
  })

  it("documents the pinned booking summary in the match-chat guide", async () => {
    const tours = await readFile("src/features/onboarding/tours.ts", "utf8")
    expect(tours).toContain('key: "chat", version: 7')
    expect(tours).toContain("resumen queda fijado sobre el historial")
  })
})
