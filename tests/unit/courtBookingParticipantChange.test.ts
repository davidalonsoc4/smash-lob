import { describe, expect, it } from "vitest"
import { buildCourtBooking, handOverPayments } from "@/lib/courtBooking"

describe("court booking when the players of a friendly change", () => {
  const ids = ["a", "b", "c", "d"]

  it("keeps the payer when he stays and moves the debt of the one who leaves to the one who arrives", () => {
    const { payments, notes } = handOverPayments([{ playerId: "a", amount: 40 }], [{ id: "d", displayName: "Dani" }], [{ id: "e", displayName: "Eva" }])
    expect(notes).toEqual([])
    const booking = buildCourtBooking({ participantIds: ["a", "b", "c", "e"], reservations: payments })
    expect(booking.reservations).toEqual([{ playerId: "a", amount: 40 }])
    expect(booking.transfers.map((transfer) => [transfer.fromPlayerId, transfer.toPlayerId, transfer.amount]).sort()).toEqual([["b", "a", 10], ["c", "a", 10], ["e", "a", 10]])
  })

  it("hands over what a payer who leaves had paid to his replacement and says so", () => {
    const { payments, notes } = handOverPayments([{ playerId: "d", amount: 40 }], [{ id: "d", displayName: "Dani" }], [{ id: "e", displayName: "Eva" }])
    expect(payments).toEqual([{ playerId: "e", amount: 40 }])
    expect(notes).toHaveLength(1)
    expect(notes[0]).toContain("Dani")
    expect(notes[0]).toContain("Eva")
    const booking = buildCourtBooking({ participantIds: ["a", "b", "c", "e"], reservations: payments })
    expect(booking.transfers.every((transfer) => transfer.toPlayerId === "e")).toBe(true)
  })

  it("leaves everything as it is when nobody changes", () => {
    const { payments, notes } = handOverPayments([{ playerId: "a", amount: 40 }, { playerId: "b", amount: 8 }], [], [])
    expect(payments).toEqual([{ playerId: "a", amount: 40 }, { playerId: "b", amount: 8 }])
    expect(notes).toEqual([])
    expect(buildCourtBooking({ participantIds: ids, reservations: payments }).transfers.length).toBeGreaterThan(0)
  })
})
