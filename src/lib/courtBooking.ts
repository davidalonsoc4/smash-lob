import type {
  CourtBooking,
  CourtBookingReservation,
  CourtBookingTransfer,
} from "@/context/MatchDataProvider"

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function normalizeAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  return roundMoney(value)
}

export function getEmptyCourtBooking(): CourtBooking {
  return {
    isReserved: false,
    reservations: [],
    ballPurchases: [],
    transfers: [],
    updatedAt: null,
  }
}

export function normalizeDeparted(value: unknown): CourtBookingTransfer["departed"] | null {
  if (!value || typeof value !== "object") return null
  const candidate = value as { id?: unknown; name?: unknown; userId?: unknown }
  if (typeof candidate.id !== "string" || !candidate.id) return null
  return { id: candidate.id, name: typeof candidate.name === "string" && candidate.name ? candidate.name : "Jugador", userId: typeof candidate.userId === "string" ? candidate.userId : null }
}

export function normalizeCourtBooking(value: Partial<CourtBooking> | null | undefined): CourtBooking {
  if (!value) {
    return getEmptyCourtBooking()
  }

  return {
    isReserved: Boolean(value.isReserved),
    reservations: Array.isArray(value.reservations)
      ? value.reservations
          .map((reservation) => ({
            playerId: String(reservation.playerId ?? ""),
            amount: normalizeAmount(Number(reservation.amount)),
          }))
          .filter((reservation) => reservation.playerId && reservation.amount > 0)
      : [],
    ballPurchases: Array.isArray(value.ballPurchases)
      ? value.ballPurchases
          .map((purchase) => ({
            playerId: String(purchase.playerId ?? ""),
            amount: normalizeAmount(Number(purchase.amount)),
          }))
          .filter((purchase) => purchase.playerId && purchase.amount > 0)
      : [],
    transfers: Array.isArray(value.transfers)
      ? value.transfers
          .map((transfer) => ({
            id: String(transfer.id ?? ""),
            fromPlayerId: String(transfer.fromPlayerId ?? ""),
            toPlayerId: String(transfer.toPlayerId ?? ""),
            amount: normalizeAmount(Number(transfer.amount)),
            isPaid: Boolean(transfer.isPaid),
            paidAt: typeof transfer.paidAt === "string" ? transfer.paidAt : null,
            ...(normalizeDeparted(transfer.departed) ? { departed: normalizeDeparted(transfer.departed)! } : {}),
          }))
          .filter(
            (transfer) =>
              transfer.id &&
              transfer.fromPlayerId &&
              transfer.toPlayerId &&
              transfer.amount > 0
          )
      : [],
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
  }
}

function getTransferId({
  fromPlayerId,
  toPlayerId,
  amount,
}: {
  fromPlayerId: string
  toPlayerId: string
  amount: number
}) {
  return `${fromPlayerId}--${toPlayerId}--${amount.toFixed(2)}`
}

export function buildCourtBooking({
  participantIds,
  reservations,
  ballPurchases = [],
  previousTransfers = [],
}: {
  participantIds: string[]
  reservations: CourtBookingReservation[]
  ballPurchases?: CourtBookingReservation[]
  previousTransfers?: CourtBookingTransfer[]
}): CourtBooking {
  const uniqueParticipantIds = Array.from(new Set(participantIds))
  const cleanPayments = (payments: CourtBookingReservation[]) =>
    payments
      .map((payment) => ({
        playerId: payment.playerId,
        amount: normalizeAmount(Number(payment.amount)),
      }))
      .filter(
        (payment) =>
          uniqueParticipantIds.includes(payment.playerId) && payment.amount > 0
      )
  const cleanReservations = cleanPayments(reservations)
  const cleanBallPurchases = cleanPayments(ballPurchases)
  const allPayments = [...cleanReservations, ...cleanBallPurchases]

  if (uniqueParticipantIds.length === 0 || allPayments.length === 0) {
    return getEmptyCourtBooking()
  }

  const totalAmount = roundMoney(
    allPayments.reduce((sum, payment) => sum + payment.amount, 0)
  )
  const share = roundMoney(totalAmount / uniqueParticipantIds.length)
  const paidByPlayer = new Map<string, number>()

  uniqueParticipantIds.forEach((playerId) => paidByPlayer.set(playerId, 0))
  allPayments.forEach((payment) => {
    paidByPlayer.set(
      payment.playerId,
      roundMoney((paidByPlayer.get(payment.playerId) ?? 0) + payment.amount)
    )
  })

  const creditors = uniqueParticipantIds
    .map((playerId) => ({
      playerId,
      amount: roundMoney((paidByPlayer.get(playerId) ?? 0) - share),
    }))
    .filter((item) => item.amount > 0.009)
  const debtors = uniqueParticipantIds
    .map((playerId) => ({
      playerId,
      amount: roundMoney(share - (paidByPlayer.get(playerId) ?? 0)),
    }))
    .filter((item) => item.amount > 0.009)
  const previousById = new Map(previousTransfers.map((transfer) => [transfer.id, transfer]))
  const transfers: CourtBookingTransfer[] = []

  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]
    const amount = roundMoney(Math.min(creditor.amount, debtor.amount))

    if (amount > 0) {
      const id = getTransferId({
        fromPlayerId: debtor.playerId,
        toPlayerId: creditor.playerId,
        amount,
      })
      const previousTransfer = previousById.get(id)

      transfers.push({
        id,
        fromPlayerId: debtor.playerId,
        toPlayerId: creditor.playerId,
        amount,
        isPaid: previousTransfer?.isPaid ?? false,
        paidAt: previousTransfer?.paidAt ?? null,
      })
    }

    creditor.amount = roundMoney(creditor.amount - amount)
    debtor.amount = roundMoney(debtor.amount - amount)

    if (creditor.amount <= 0.009) {
      creditorIndex += 1
    }

    if (debtor.amount <= 0.009) {
      debtorIndex += 1
    }
  }

  // Refunds owed to people who left the match are kept as they are (while the other side still plays).
  const refunds = previousTransfers.filter((transfer) => {
    const departed = transfer.departed
    if (!departed) return false
    const other = departed.id === transfer.toPlayerId ? transfer.fromPlayerId : transfer.toPlayerId
    return uniqueParticipantIds.includes(other)
  })

  return {
    isReserved: true,
    reservations: cleanReservations,
    ballPurchases: cleanBallPurchases,
    transfers: [...transfers, ...refunds],
    updatedAt: new Date().toISOString(),
  }
}

export function setCourtBookingTransferPaidStatus({
  booking,
  transferId,
  isPaid,
}: {
  booking: CourtBooking
  transferId: string
  isPaid: boolean
}): CourtBooking {
  return {
    ...booking,
    transfers: booking.transfers.map((transfer) =>
      transfer.id === transferId
        ? {
            ...transfer,
            isPaid,
            paidAt: isPaid ? new Date().toISOString() : null,
          }
        : transfer
    ),
    updatedAt: new Date().toISOString(),
  }
}

export function markCourtBookingTransferPaid({
  booking,
  transferId,
}: {
  booking: CourtBooking
  transferId: string
}): CourtBooking {
  return setCourtBookingTransferPaidStatus({
    booking,
    transferId,
    isPaid: true,
  })
}
export function getBookingPaymentSummary(booking: CourtBooking, playerId: string, isParticipant = true) {
  const pending = booking.transfers.filter((transfer) => !transfer.isPaid)
  const cents = (amount: number) => Math.round(amount * 100)
  const toPay = pending.filter((transfer) => transfer.fromPlayerId === playerId).reduce((sum, transfer) => sum + cents(transfer.amount), 0) / 100
  const toReceive = pending.filter((transfer) => transfer.toPlayerId === playerId).reduce((sum, transfer) => sum + cents(transfer.amount), 0) / 100
  const state = !booking.isReserved ? "incomplete" : toPay > 0 && toReceive > 0 ? "both" : toPay > 0 ? "pay" : toReceive > 0 ? "receive" : pending.length === 0 ? "settled" : isParticipant ? "personal-settled" : "others-pending"
  return { state, toPay, toReceive }
}

/** Whoever leaves hands over what they paid to whoever takes their place (in the order they were swapped). */
export function handOverPayments(
  payments: CourtBookingReservation[],
  removed: ReadonlyArray<{ id: string; displayName: string }>,
  added: ReadonlyArray<{ id: string; displayName: string }>,
): { payments: CourtBookingReservation[]; notes: string[] } {
  const successor = new Map(removed.map((person, index) => [person.id, added[index] ?? null]))
  const merged = new Map<string, number>()
  const notes: string[] = []
  for (const payment of payments) {
    const leaving = removed.find((person) => person.id === payment.playerId)
    const amount = formatMoney(payment.amount)
    if (!leaving) {
      merged.set(payment.playerId, roundMoney((merged.get(payment.playerId) ?? 0) + payment.amount))
      continue
    }
    const takesOver = successor.get(leaving.id)
    if (!takesOver) {
      notes.push(`${leaving.displayName} había pagado ${amount} y ya no juega: ese pago se ha quitado.`)
      continue
    }
    merged.set(takesOver.id, roundMoney((merged.get(takesOver.id) ?? 0) + payment.amount))
    notes.push(`${leaving.displayName} había pagado ${amount}: ese pago pasa a ${takesOver.displayName}. Revísalo en Pagos y reservas.`)
  }
  return { payments: [...merged.entries()].map(([playerId, amount]) => ({ playerId, amount })), notes }
}

/**
 * Whoever leaves after having paid their share gets it back from whoever collected it: a new refund transfer (still
 * unpaid) for each of their paid transfers, as long as the collector is still playing. Unpaid shares just move to the
 * newcomer when the booking is rebuilt, so they need nothing here.
 */
export function refundsForDeparted(
  transfers: CourtBookingTransfer[],
  removed: ReadonlyArray<{ id: string; displayName: string; userId?: string | null }>,
  stillPlaying: ReadonlySet<string>,
): { refunds: CourtBookingTransfer[]; notes: string[] } {
  const refunds: CourtBookingTransfer[] = []
  const notes: string[] = []
  for (const person of removed) {
    for (const transfer of transfers) {
      if (transfer.departed || transfer.fromPlayerId !== person.id || !transfer.isPaid) continue
      if (!stillPlaying.has(transfer.toPlayerId)) continue
      refunds.push({
        id: `refund--${transfer.toPlayerId}--${person.id}--${transfer.amount.toFixed(2)}`,
        fromPlayerId: transfer.toPlayerId,
        toPlayerId: person.id,
        amount: transfer.amount,
        isPaid: false,
        paidAt: null,
        departed: { id: person.id, name: person.displayName, userId: person.userId ?? null },
      })
      notes.push(`${person.displayName} ya había pagado ${formatMoney(transfer.amount)}: hay que devolvérselo (aparece en Pagos y reservas).`)
    }
  }
  return { refunds, notes }
}
