import { roundMoney } from "@/lib/courtBooking"

export type SeasonRegistrationPayment = {
  playerId: string
  isPaid: boolean
  paidAt: string | null
}

export type SeasonRegistrationFee = {
  enabled: boolean
  amount: number
  payments: SeasonRegistrationPayment[]
}

export const emptySeasonRegistrationFee: SeasonRegistrationFee = {
  enabled: false,
  amount: 0,
  payments: [],
}

function normalizeAmount(value: unknown) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }

  return roundMoney(amount)
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

export function normalizeSeasonRegistrationFee(
  value: unknown,
): SeasonRegistrationFee {
  const item = toRecord(value)
  const payments = Array.isArray(item.payments)
    ? item.payments
        .map((payment) => {
          const paymentRecord = toRecord(payment)
          const playerId = String(paymentRecord.playerId ?? "")

          if (!playerId) {
            return null
          }

          return {
            playerId,
            isPaid: Boolean(paymentRecord.isPaid),
            paidAt:
              typeof paymentRecord.paidAt === "string"
                ? paymentRecord.paidAt
                : null,
          }
        })
        .filter((payment): payment is SeasonRegistrationPayment =>
          Boolean(payment),
        )
    : []

  return {
    enabled: Boolean(item.enabled),
    amount: normalizeAmount(item.amount),
    payments,
  }
}

export function buildSeasonRegistrationFee({
  enabled,
  amount,
  playerIds,
}: {
  enabled: boolean
  amount: number
  playerIds: string[]
}): SeasonRegistrationFee {
  const normalizedAmount = enabled ? normalizeAmount(amount) : 0
  const uniquePlayerIds = Array.from(new Set(playerIds.filter(Boolean)))

  return {
    enabled: enabled && normalizedAmount > 0,
    amount: normalizedAmount,
    payments: uniquePlayerIds.map((playerId) => ({
      playerId,
      isPaid: false,
      paidAt: null,
    })),
  }
}

export function ensureSeasonRegistrationPlayers({
  registrationFee,
  playerIds,
}: {
  registrationFee: SeasonRegistrationFee
  playerIds: string[]
}): SeasonRegistrationFee {
  const uniquePlayerIds = Array.from(new Set(playerIds.filter(Boolean)))
  const paymentByPlayerId = new Map(
    registrationFee.payments.map((payment) => [payment.playerId, payment]),
  )

  return {
    ...registrationFee,
    payments: uniquePlayerIds.map(
      (playerId) =>
        paymentByPlayerId.get(playerId) ?? {
          playerId,
          isPaid: false,
          paidAt: null,
        },
    ),
  }
}

export function setSeasonRegistrationPaymentPaidStatus({
  registrationFee,
  playerId,
  isPaid,
}: {
  registrationFee: SeasonRegistrationFee
  playerId: string
  isPaid: boolean
}): SeasonRegistrationFee {
  const hasPayment = registrationFee.payments.some(
    (payment) => payment.playerId === playerId,
  )
  const nextPayment = {
    playerId,
    isPaid,
    paidAt: isPaid ? new Date().toISOString() : null,
  }

  return {
    ...registrationFee,
    payments: hasPayment
      ? registrationFee.payments.map((payment) =>
          payment.playerId === playerId ? nextPayment : payment,
        )
      : [...registrationFee.payments, nextPayment],
  }
}
