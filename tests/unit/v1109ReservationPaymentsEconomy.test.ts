import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { getSeasonRegistrationFinanceSummary, type SeasonRegistrationFee } from "@/lib/seasonRegistration"

describe("v1.10.9 reservation payments and season economy", () => {
  it("splits the available season balance across all players", () => {
    const registrationFee: SeasonRegistrationFee = {
      enabled: true,
      amount: 25,
      purpose: "Fianza",
      payments: [
        { playerId: "p1", isPaid: true, paidAt: "2026-08-18T10:00:00.000Z" },
        { playerId: "p2", isPaid: true, paidAt: "2026-08-18T10:00:00.000Z" },
        { playerId: "p3", isPaid: true, paidAt: "2026-08-18T10:00:00.000Z" },
        { playerId: "p4", isPaid: true, paidAt: "2026-08-18T10:00:00.000Z" },
      ],
      expenses: [
        {
          id: "expense-1",
          title: "Bolas",
          amount: 28,
          createdAt: "2026-08-18T11:00:00.000Z",
        },
      ],
    }

    const summary = getSeasonRegistrationFinanceSummary({
      registrationFee,
      playerIds: ["p1", "p2", "p3", "p4"],
    })

    expect(summary.available).toBe(72)
    expect(summary.availablePerPlayer).toBe(18)
  })

  it("does not divide twice when a player id is duplicated", () => {
    const registrationFee: SeasonRegistrationFee = {
      enabled: true,
      amount: 20,
      purpose: "Fianza",
      payments: [
        { playerId: "p1", isPaid: true, paidAt: "2026-08-18T10:00:00.000Z" },
        { playerId: "p2", isPaid: true, paidAt: "2026-08-18T10:00:00.000Z" },
      ],
      expenses: [],
    }

    const summary = getSeasonRegistrationFinanceSummary({
      registrationFee,
      playerIds: ["p1", "p2", "p2"],
    })

    expect(summary.available).toBe(40)
    expect(summary.availablePerPlayer).toBe(20)
  })

  it("shows the per-person amount under Disponible instead of the old helper", async () => {
    const screen = await readFile("src/components/season/SeasonFinanceScreen.tsx", "utf8")
    expect(screen).toContain('helper={`${formatMoney(summary.availablePerPlayer)} POR PERSONA`}')
    expect(screen).not.toContain('helper="Ingresado − gastado"')
  })

})
