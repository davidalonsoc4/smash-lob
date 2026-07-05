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
    transfers: [],
    updatedAt: null,
  }
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
    transfers: Array.isArray(value.transfers)
      ? value.transfers
          .map((transfer) => ({
            id: String(transfer.id ?? ""),
            fromPlayerId: String(transfer.fromPlayerId ?? ""),
            toPlayerId: String(transfer.toPlayerId ?? ""),
            amount: normalizeAmount(Number(transfer.amount)),
            isPaid: Boolean(transfer.isPaid),
            paidAt: typeof transfer.paidAt === "string" ? transfer.paidAt : null,
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
  previousTransfers = [],
}: {
  participantIds: string[]
  reservations: CourtBookingReservation[]
  previousTransfers?: CourtBookingTransfer[]
}): CourtBooking {
  const uniqueParticipantIds = Array.from(new Set(participantIds))
  const cleanReservations = reservations
    .map((reservation) => ({
      playerId: reservation.playerId,
      amount: normalizeAmount(Number(reservation.amount)),
    }))
    .filter(
      (reservation) =>
        uniqueParticipantIds.includes(reservation.playerId) && reservation.amount > 0
    )

  if (uniqueParticipantIds.length === 0 || cleanReservations.length === 0) {
    return getEmptyCourtBooking()
  }

  const totalAmount = roundMoney(
    cleanReservations.reduce((sum, reservation) => sum + reservation.amount, 0)
  )
  const share = roundMoney(totalAmount / uniqueParticipantIds.length)
  const paidByPlayer = new Map<string, number>()

  uniqueParticipantIds.forEach((playerId) => paidByPlayer.set(playerId, 0))
  cleanReservations.forEach((reservation) => {
    paidByPlayer.set(
      reservation.playerId,
      roundMoney((paidByPlayer.get(reservation.playerId) ?? 0) + reservation.amount)
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

  return {
    isReserved: true,
    reservations: cleanReservations,
    transfers,
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
