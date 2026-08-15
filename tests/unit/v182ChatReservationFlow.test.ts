import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { buildMatchChatCoordination } from "@/lib/matchChatCoordination"

describe("v1.8.2 chat reservation flow", () => {
  it("keeps approved date and location agreements available for reservation", () => {
    const participants = ["u1", "u2", "u3", "u4"].map((userId) => ({ userId }))
    const responses = ["u1", "u2", "u3", "u4"].map((userId) => ({ userId, optionKey: "date-1", response: "available" }))
    const locationResponses = ["u1", "u2", "u3", "u4"].map((userId) => ({ userId, optionKey: "location", response: "available" }))
    const coordination = buildMatchChatCoordination({
      matchStatus: "scheduling",
      participants,
      messages: [
        { id: "m1", kind: "date_proposal", payload: { options: [{ key: "date-1", startsAt: "2026-09-18T17:30:00.000Z" }] }, responses },
        { id: "m2", kind: "location_proposal", payload: { key: "location", name: "Pando", locationId: "loc-1" }, responses: locationResponses },
      ],
    })
    expect(coordination.status).toBe("awaiting_booking")
    expect(coordination.approvedDates).toHaveLength(1)
    expect(coordination.approvedLocations).toHaveLength(1)
  })

  it("moves to awaiting booking as soon as a date and time are unanimous", () => {
    const participants = ["u1", "u2", "u3", "u4"].map((userId) => ({ userId }))
    const coordination = buildMatchChatCoordination({
      matchStatus: "scheduling",
      participants,
      messages: [{
        id: "m1",
        kind: "date_proposal",
        payload: { options: [{ key: "date-1", startsAt: "2026-09-18T17:30:00.000Z" }] },
        responses: ["u1", "u2", "u3", "u4"].map((userId) => ({ userId, optionKey: "date-1", response: "available" })),
      }],
    })
    expect(coordination.status).toBe("awaiting_booking")
    expect(coordination.approvedDates).toHaveLength(1)
    expect(coordination.approvedLocations).toHaveLength(0)
  })

  it("wires confirmation, court selection, calendar message and subtle detail status", async () => {
    const chat = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    const detail = await readFile("src/app/match/[id]/page.tsx", "utf8")
    const confirm = await readFile("src/app/api/matches/[matchId]/reservation-confirmation/route.ts", "utf8")
    const status = await readFile("src/components/matches/MatchStatusBadge.tsx", "utf8")
    expect(chat).toContain('payload.systemType === "reservation_confirmed"')
    expect(chat).toContain("<AddToCalendarButton")
    expect(chat).toContain("<MatchReservationConfirmation")
    expect(confirm).toContain('court_reserved: true')
    expect(confirm).toContain('status: "scheduled"')
    expect(confirm).toContain("getLeagueLocationCourts")
    expect(detail).toContain("coordinationStatus")
    expect(detail).toContain("coordinationAction")
    expect(status).toContain('awaiting_booking: "Pendiente de reserva"')
  })

  it("keeps API compatibility while direct proposal selection caps at four times", async () => {
    const api = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    const chat = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(api).toContain(".slice(0, 5)")
    expect(chat).toContain("dateOptions.length >= 4")
    expect(chat).toContain("current.length < 4")
    expect(chat).toContain("current.length >= 4")
  })
})
