import type { PlayerProfile } from "@/data/fakeData"
import type { ExportRows } from "@/lib/csvExport"
import {
  getSeasonRegistrationFinanceSummary,
  type SeasonRegistrationExpense,
  type SeasonRegistrationFee,
} from "@/lib/seasonRegistration"

export type SeasonFinanceTransparencyPaymentStatus = "paid" | "pending" | "recipient"

export type SeasonFinanceTransparencyPaymentRow = {
  playerId: string
  playerName: string
  status: SeasonFinanceTransparencyPaymentStatus
  expectedAmount: number
  paidAt: string | null
}

export type SeasonFinanceTransparencyExpenseRow = SeasonRegistrationExpense

export type SeasonFinanceTransparencyData = {
  leagueName: string
  leagueLogoUrl?: string | null
  seasonName: string
  generatedAt: string
  registrationAmount: number
  registrationPurpose: string
  totalPlayers: number
  paidCount: number
  pendingCount: number
  recipientCount: number
  collected: number
  pending: number
  spent: number
  available: number
  availablePerPlayer: number
  paymentRows: SeasonFinanceTransparencyPaymentRow[]
  expenseRows: SeasonFinanceTransparencyExpenseRow[]
}

function byDisplayName(a: PlayerProfile, b: PlayerProfile) {
  return a.displayName.localeCompare(b.displayName, "es-ES", {
    sensitivity: "base",
  })
}

export function buildSeasonFinanceTransparencyData({
  leagueName,
  seasonName,
  leagueLogoUrl,
  registrationFee,
  players,
  organizerPlayerId,
  generatedAt = new Date().toISOString(),
}: {
  leagueName: string
  leagueLogoUrl?: string | null
  seasonName: string
  registrationFee: SeasonRegistrationFee
  players: PlayerProfile[]
  organizerPlayerId?: string | null
  generatedAt?: string
}): SeasonFinanceTransparencyData {
  const uniquePlayers = [...players].sort(byDisplayName)
  const uniquePlayerIds = uniquePlayers.map((player) => player.id)
  const recipientIds = organizerPlayerId ? [organizerPlayerId] : []
  const paymentByPlayerId = new Map(
    registrationFee.payments.map((payment) => [payment.playerId, payment]),
  )
  const summary = getSeasonRegistrationFinanceSummary({
    registrationFee,
    playerIds: uniquePlayerIds,
    settledPlayerIds: recipientIds,
  })
  const paymentRows = uniquePlayers.map<SeasonFinanceTransparencyPaymentRow>(
    (player) => {
      const payment = paymentByPlayerId.get(player.id)
      const status: SeasonFinanceTransparencyPaymentStatus =
        organizerPlayerId && player.id === organizerPlayerId
          ? "recipient"
          : payment?.isPaid
            ? "paid"
            : "pending"

      return {
        playerId: player.id,
        playerName: player.displayName,
        status,
        expectedAmount: registrationFee.amount,
        paidAt: payment?.paidAt ?? null,
      }
    },
  )
  const expenseRows = [...registrationFee.expenses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return {
    leagueName,
    leagueLogoUrl,
    seasonName,
    generatedAt,
    registrationAmount: registrationFee.amount,
    registrationPurpose:
      registrationFee.purpose?.trim() ||
      "Premios, bolas, bote final, reservas comunes u otros gastos de organización.",
    totalPlayers: uniquePlayers.length,
    paidCount: summary.paidCount,
    pendingCount: summary.pendingCount,
    recipientCount: paymentRows.filter((row) => row.status === "recipient").length,
    collected: summary.collected,
    pending: summary.pending,
    spent: summary.spent,
    available: summary.available,
    availablePerPlayer: summary.availablePerPlayer,
    paymentRows,
    expenseRows,
  }
}

export function buildSeasonFinanceWorkbookRows(
  data: SeasonFinanceTransparencyData,
): {
  summaryRows: ExportRows
  paymentsRows: ExportRows
  expensesRows: ExportRows
} {
  return {
    summaryRows: [
      ["Campo", "Valor"],
      ["Liga", data.leagueName],
      ["Temporada", data.seasonName],
      ["Generado", data.generatedAt],
      ["Inscripción por jugador", data.registrationAmount],
      ["Destino de la inscripción", data.registrationPurpose],
      ["Jugadores", data.totalPlayers],
      ["Cuotas aportadas", data.paidCount],
      ["Pagos pendientes", data.pendingCount],
      ["Destinatarios", data.recipientCount],
      ["Ingresado", data.collected],
      ["Pendiente", data.pending],
      ["Gastado", data.spent],
      ["Disponible", data.available],
      ["Disponible por persona", data.availablePerPlayer],
    ],
    paymentsRows: [
      ["Jugador", "Estado", "Importe esperado", "Fecha de pago"],
      ...data.paymentRows.map((row) => [
        row.playerName,
        row.status === "paid"
          ? "Pagada"
          : row.status === "recipient"
            ? "Destinatario"
            : "Pendiente",
        row.expectedAmount,
        row.paidAt ?? "",
      ]),
    ],
    expensesRows: [
      ["Concepto", "Fecha", "Importe"],
      ...data.expenseRows.map((expense) => [
        expense.title,
        expense.createdAt,
        expense.amount,
      ]),
    ],
  }
}
