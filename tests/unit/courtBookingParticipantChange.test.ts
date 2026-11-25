import { describe, expect, it } from "vitest"
import { buildCourtBooking, handOverPayments, refundsForDeparted } from "@/lib/courtBooking"

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

describe("refund to someone who leaves after paying", () => {
  const paid = { id: "t", fromPlayerId: "d", toPlayerId: "a", amount: 10, isPaid: true, paidAt: "2026-11-25T10:00:00Z" }
  const unpaid = { ...paid, isPaid: false, paidAt: null }
  const playing = new Set(["a", "b", "c", "e"])
  const dani = [{ id: "d", displayName: "Dani", userId: "u-d" }]

  it("owes him back what he paid, and the newcomer owes it again", () => {
    const { refunds, notes } = refundsForDeparted([paid], dani, playing)
    expect(refunds).toHaveLength(1)
    expect(refunds[0]).toMatchObject({ fromPlayerId: "a", toPlayerId: "d", amount: 10, isPaid: false, departed: { id: "d", name: "Dani", userId: "u-d" } })
    expect(notes[0]).toContain("Dani")
    const booking = buildCourtBooking({ participantIds: ["a", "b", "c", "e"], reservations: [{ playerId: "a", amount: 40 }], previousTransfers: [paid] })
    expect(booking.transfers.find((transfer) => transfer.fromPlayerId === "e")).toMatchObject({ toPlayerId: "a", amount: 10, isPaid: false })
  })

  it("needs no refund when he had not paid", () => {
    expect(refundsForDeparted([unpaid], dani, playing).refunds).toEqual([])
  })

  it("keeps the refund when the booking is rebuilt later", () => {
    const { refunds } = refundsForDeparted([paid], dani, playing)
    const booking = buildCourtBooking({ participantIds: ["a", "b", "c", "e"], reservations: [{ playerId: "a", amount: 40 }], previousTransfers: refunds })
    expect(booking.transfers.some((transfer) => transfer.departed?.id === "d")).toBe(true)
  })
})
