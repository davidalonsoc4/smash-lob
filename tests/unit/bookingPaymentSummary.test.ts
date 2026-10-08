import { describe, expect, it } from "vitest"
import type { CourtBooking, CourtBookingTransfer } from "@/context/MatchDataProvider"
import { getBookingPaymentSummary } from "@/lib/courtBooking"
const transfer = (fromPlayerId: string, toPlayerId: string, amount: number, isPaid = false): CourtBookingTransfer => ({ id: `${fromPlayerId}-${toPlayerId}`, fromPlayerId, toPlayerId, amount, isPaid, paidAt: null })
const booking = (transfers: CourtBookingTransfer[], isReserved = true): CourtBooking => ({ isReserved, transfers, reservations: [{ playerId: "other", amount: 20 }], ballPurchases: [], updatedAt: null })
describe("personal payment summary", () => {
  it("distinguishes unrecorded expenses from settled expenses", () => {
    expect(getBookingPaymentSummary(booking([], false), "me").state).toBe("incomplete")
    expect(getBookingPaymentSummary(booking([]), "me").state).toBe("settled")
  })
  it("counts only my outstanding outgoing amounts", () => {
    expect(getBookingPaymentSummary(booking([transfer("me", "a", 0.1), transfer("me", "b", 0.2), transfer("me", "a", 10, true), transfer("b", "a", 5)]), "me")).toEqual({ state: "pay", toPay: 0.3, toReceive: 0 })
  })
  it("counts incoming payments separately", () => {
    expect(getBookingPaymentSummary(booking([transfer("a", "me", 10)]), "me")).toEqual({ state: "receive", toPay: 0, toReceive: 10 })
  })
  it("does not net incoming and outgoing obligations", () => {
    expect(getBookingPaymentSummary(booking([transfer("me", "a", 10), transfer("b", "me", 10)]), "me")).toEqual({ state: "both", toPay: 10, toReceive: 10 })
  })
  it("distinguishes my settled share from everyone being settled", () => {
    expect(getBookingPaymentSummary(booking([transfer("a", "b", 10)]), "me").state).toBe("personal-settled")
    expect(getBookingPaymentSummary(booking([transfer("a", "b", 10, true)]), "me").state).toBe("settled")
  })
  it("does not tell a nonparticipant that they have a settled share", () => {
    expect(getBookingPaymentSummary(booking([transfer("a", "b", 10)]), "admin", false).state).toBe("others-pending")
  })
})
