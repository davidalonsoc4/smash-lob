import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import {
  buildSeasonFinanceTransparencyData,
  buildSeasonFinanceWorkbookRows,
} from "@/lib/seasonFinanceTransparency"
import type { PlayerProfile } from "@/data/fakeData"
import type { SeasonRegistrationFee } from "@/lib/seasonRegistration"

describe("v1.11.0 season finance transparency report", () => {
  it("builds a transparency dataset with recipient, paid and pending rows", () => {
    const registrationFee: SeasonRegistrationFee = {
      enabled: true,
      amount: 20,
      purpose: "Bolas y trofeos",
      payments: [
        { playerId: "p1", isPaid: true, paidAt: "2026-08-24T10:00:00.000Z" },
        { playerId: "p2", isPaid: false, paidAt: null },
        { playerId: "p3", isPaid: false, paidAt: null },
      ],
      expenses: [
        {
          id: "e1",
          title: "Bolas",
          amount: 18,
          createdAt: "2026-08-24T11:00:00.000Z",
        },
      ],
    }
    const players: PlayerProfile[] = [
      {
        id: "p1",
        leagueId: "l1",
        slug: "ana",
        displayName: "Ana",
        avatarInitials: "A",
      },
      {
        id: "p2",
        leagueId: "l1",
        slug: "bea",
        displayName: "Bea",
        avatarInitials: "B",
      },
      {
        id: "p3",
        leagueId: "l1",
        slug: "carlos",
        displayName: "Carlos",
        avatarInitials: "C",
      },
    ]

    const data = buildSeasonFinanceTransparencyData({
      leagueName: "Smash & Lob",
      leagueLogoUrl: "https://example.com/logo.png",
      seasonName: "Temporada 1",
      registrationFee,
      players,
      organizerPlayerId: "p3",
      generatedAt: "2026-08-24T12:00:00.000Z",
    })

    expect(data.leagueLogoUrl).toBe("https://example.com/logo.png")
    expect(data.paidCount).toBe(2)
    expect(data.pendingCount).toBe(1)
    expect(data.recipientCount).toBe(1)
    expect(data.collected).toBe(40)
    expect(data.pending).toBe(20)
    expect(data.spent).toBe(18)
    expect(data.available).toBe(22)
    expect(data.paymentRows.map((row) => [row.playerName, row.status])).toEqual([
      ["Ana", "paid"],
      ["Bea", "pending"],
      ["Carlos", "recipient"],
    ])
  })

  it("creates workbook rows for summary, payments and expenses", () => {
    const rows = buildSeasonFinanceWorkbookRows({
      leagueName: "Liga Demo",
      seasonName: "T1",
      generatedAt: "2026-08-24T12:00:00.000Z",
      registrationAmount: 25,
      registrationPurpose: "Premios",
      totalPlayers: 4,
      paidCount: 3,
      pendingCount: 1,
      recipientCount: 0,
      collected: 75,
      pending: 25,
      spent: 40,
      available: 35,
      availablePerPlayer: 8.75,
      paymentRows: [
        {
          playerId: "p1",
          playerName: "Ana",
          status: "paid",
          expectedAmount: 25,
          paidAt: "2026-08-24T12:00:00.000Z",
        },
      ],
      expenseRows: [
        {
          id: "e1",
          title: "Trofeos",
          amount: 40,
          createdAt: "2026-08-24T12:10:00.000Z",
        },
      ],
    })

    expect(rows.summaryRows[0]).toEqual(["Campo", "Valor"])
    expect(rows.summaryRows).toContainEqual(["Cuotas aportadas", 3])
    expect(rows.paymentsRows[0]).toEqual([
      "Jugador",
      "Estado",
      "Importe esperado",
      "Fecha de pago",
    ])
    expect(rows.expensesRows[0]).toEqual(["Concepto", "Fecha", "Importe"])
    expect(rows.paymentsRows[1][1]).toBe("Pagada")
    expect(rows.expensesRows[1][0]).toBe("Trofeos")
  })

  it("replaces the placeholder button with real report actions", async () => {
    const screen = await readFile(
      "src/components/season/SeasonFinanceScreen.tsx",
      "utf8",
    )

    expect(screen).toContain("data-season-finance-report-preview")
    expect(screen).toContain("data-season-finance-report-excel")
    expect(screen).toContain('tx("Ver imagen")')
    expect(screen).toContain("data-season-finance-preview-download")
    expect(screen).toContain("data-season-finance-preview-share")
    expect(screen).toContain('tx("Estado de inscripciones")')
    expect(screen).toContain('tx("Pendientes por aportar")')
    expect(screen).not.toContain('tx("Destino de la inscripción")')
    expect(screen).not.toContain('tx("Balance final")')
    expect(screen).toContain("backdrop-blur-sm")
    expect(screen).toContain('aria-label={tx("Cerrar")}')
    expect(screen).toContain('tx("Descargar")')
    expect(screen).toContain('tx("Compartir")')
    expect(screen).toContain('tx("Exportar Excel (.xlsx)")')
    expect(screen).not.toContain("Generar informe de transparencia · Próximamente")
  })
})
