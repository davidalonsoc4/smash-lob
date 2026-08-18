import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { buildMatchChatCoordination } from "@/lib/matchChatCoordination"
import { formatMatchScheduleLongLabel } from "@/lib/matchScheduleTime"

describe("v1.8.21 pending booking flow", () => {
  it("formats scheduled matches with middle-dot separators and long Spanish date", () => {
    expect(formatMatchScheduleLongLabel("2026-02-19T18:00:00.000Z")).toBe("Jueves · 19 de Febrero de 2026 · 19:00")
  })

  it("moves to awaiting booking from a unanimous date and tracks unanimously rejected locations", () => {
    const participants = ["u1", "u2", "u3", "u4"].map((userId) => ({ userId }))
    const yes = ["u1", "u2", "u3", "u4"].map((userId) => ({ userId, optionKey: "date-1", response: "available" }))
    const no = ["u1", "u2", "u3", "u4"].map((userId) => ({ userId, optionKey: "location", response: "unavailable" }))
    const coordination = buildMatchChatCoordination({
      matchStatus: "scheduling",
      participants,
      messages: [
        { id: "m1", kind: "date_proposal", payload: { options: [{ key: "date-1", startsAt: "2026-09-18T17:30:00.000Z" }] }, responses: yes },
        { id: "m2", kind: "location_proposal", payload: { key: "location", name: "Pando", locationId: "loc-1" }, responses: no },
      ],
    })
    expect(coordination.status).toBe("awaiting_booking")
    expect(coordination.approvedDates).toHaveLength(1)
    expect(coordination.approvedLocations).toHaveLength(0)
    expect(coordination.rejectedLocations).toEqual([expect.objectContaining({ name: "Pando", locationId: "loc-1" })])
  })

  it("ignores invalidated date agreements", () => {
    const participants = ["u1", "u2", "u3", "u4"].map((userId) => ({ userId }))
    const responses = ["u1", "u2", "u3", "u4"].map((userId) => ({ userId, optionKey: "date-1", response: "available" }))
    const coordination = buildMatchChatCoordination({
      matchStatus: "scheduling",
      participants,
      messages: [{ id: "m1", kind: "date_proposal", payload: { options: [{ key: "date-1", startsAt: "2026-09-18T17:30:00.000Z", invalidated: true }] }, responses }],
    })
    expect(coordination.status).toBe("coordinating")
    expect(coordination.approvedDates).toHaveLength(0)
  })

  it("toggles the same proposal vote off in both API and optimistic chat UI", async () => {
    const route = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(route).toContain("const removingVote = existingResponse?.response === response")
    expect(route).toContain('db.from("match_chat_proposal_responses").delete()')
    expect(route).toContain("response: removingVote ? null : response")
    expect(page).toContain("const removingVote = original?.response === responseValue")
    expect(page).toContain('aria-pressed={mine === "available"}')
    expect(page).toContain('mine === "available" ? "Quitar voto"')
  })

  it("pins reservation decisions and falls back to configured locations while blocking rejected ones", async () => {
    const component = await readFile("src/components/match/MatchReservationConfirmation.tsx", "utf8")
    const route = await readFile("src/app/api/matches/[matchId]/reservation-confirmation/route.ts", "utf8")
    const chat = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(component).toContain('data-tour="chat-reservation-pending"')
    expect(component).toContain("Sin acuerdo previo; se elegirá al confirmar")
    expect(component).toContain("Descartadas 4/4")
    expect(component).toContain("Fecha/hora no disponible")
    expect(route).toContain('action === "invalidate_dates"')
    expect(route).toContain("match_reservation_location_rejected")
    expect(route).toContain("approvedLocationIds.size && !approvedLocationIds.has(locationId)")
    expect(chat).toContain('payload.systemType === "reservation_agreement_invalidated"')
    expect(chat).not.toContain("Acuerdo alcanzado")
  })

  it("removes the pending-booking pin as soon as a reservation is confirmed", async () => {
    const chat = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(chat).toContain("const hasConfirmedReservation = Boolean(")
    expect(chat).toContain('record(message.payload).systemType === "reservation_confirmed"')
    expect(chat).toContain('!effectiveReadOnly && !hasConfirmedReservation && displayedCoordination?.status === "awaiting_booking"')
  })

  it("styles proposal shells by sender while keeping voting content on light surfaces", async () => {
    const chat = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(chat).toContain('mine ? "border border-transparent bg-clip-padding bg-neutral-950" : "border border-neutral-200 bg-white text-neutral-950"')
    expect(chat).toContain('mine ? "bg-neutral-950 text-white" : "text-neutral-950"')
    expect(chat).toContain('text-neutral-950 ${invalidated ? "bg-neutral-100 opacity-70" : "bg-neutral-50"}')
    expect(chat).toContain('className="mt-1.5 flex items-start gap-2 rounded-xl bg-neutral-50 px-2.5 py-1.5 text-neutral-950"')
    expect(chat).toContain("proposalVoteDetailRows(message, key)")
    expect(chat).toContain("proposalControls(message, locationKey)")
  })

  it("groups agreement and scheduled notifications into the same chat thread", async () => {
    const dispatch = await readFile("src/lib/serverPushDispatch.ts", "utf8")
    const chatRoute = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    const reservationRoute = await readFile("src/app/api/matches/[matchId]/reservation-confirmation/route.ts", "utf8")
    expect(chatRoute).toContain('title: "Pendiente de reserva"')
    expect(chatRoute).toContain("includeActor: true")
    expect(reservationRoute).toContain("reservationConfirmedFromChat: true")
    expect(reservationRoute).toContain("includeActor: true")
    expect(dispatch).toContain('const chatThreadEvent = event.type === "match_chat_message" || reservationConfirmedFromChat')
    expect(dispatch).toContain('`smash-lob-chat-${event.match_id}`')
    expect(dispatch).toContain("const chatStateTransition =")
    const sw = await readFile("public/sw.js", "utf8")
    expect(sw).toContain("payload.chatStateTransition !== true")
  })

  it("documents the v7 booking and reversible-vote flow", async () => {
    const tours = await readFile("src/features/onboarding/tours.ts", "utf8")
    expect(tours).toContain('{ key: "chat", version: 7')
    expect(tours).toContain("retirar tu voto pulsando de nuevo el mismo botón")
    expect(tours).toContain("En cuanto una fecha y hora llegan a 4/4")
    expect(tours).toContain("resumen queda fijado sobre el historial")
  })

  it("requires reservation payers and amounts when confirming from chat", async () => {
    const component = await readFile("src/components/match/MatchReservationConfirmation.tsx", "utf8")
    const route = await readFile("src/app/api/matches/[matchId]/reservation-confirmation/route.ts", "utf8")
    const chat = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(component).toContain("Pagos de la reserva")
    expect(component).toContain("Indica quién pagó la pista y cuánto abonó cada persona.")
    expect(component).toContain("requireReservationPayments?: boolean")
    expect(component).toContain("requireReservationPayments = false")
    expect(component).toContain("? { reservations: parsedReservations }")
    expect(component).toContain("paymentAmountsAreValid")
    expect(chat).toContain("participantIds={participants.map((item) => item.playerId)}")
    expect(chat).toContain("requireReservationPayments")
    expect(chat).toContain("currentPlayerId={participants.find((item) => item.userId === me)?.playerId ??")
    expect(route).toContain("const reservationsWereProvided = body.reservations !== undefined")
    expect(route).toContain("? parseReservations(body.reservations)")
    expect(route).toContain('error: "match_reservation_payments_invalid"')
    expect(route).toContain("const booking = reservationsWereProvided")
    expect(route).toContain("buildCourtBooking({")
    expect(route).toContain("booking_reservations:")
    expect(route).toContain("booking_transfers: booking.transfers")
    expect(route).toContain("booking_transfers: previous.courtBooking.transfers")
  })

})
