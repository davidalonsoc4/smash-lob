export type PaymentLedgerSource = "league" | "friendly"
export type PaymentLedgerDirection = "owe" | "owed"

export type PaymentLedgerItem = {
  source: PaymentLedgerSource
  matchId: string
  transferId: string
  direction: PaymentLedgerDirection
  amount: number
  isPaid: boolean
  paidAt: string | null
  eventAt: string | null
  fromName: string
  toName: string
  leagueId: string | null
  leagueName: string | null
  seasonId: string | null
  seasonName: string | null
  round: number | null
  href: string
}

export type PaymentLedgerPayload = {
  items: PaymentLedgerItem[]
}

export function getPaymentLedgerPendingSummary(items: PaymentLedgerItem[]) {
  return items.reduce(
    (summary, item) => {
      if (item.isPaid) return summary

      if (item.direction === "owe") {
        summary.owedByMe += item.amount
        summary.owedByMeCount += 1
      } else {
        summary.owedToMe += item.amount
        summary.owedToMeCount += 1
      }

      return summary
    },
    {
      owedByMe: 0,
      owedToMe: 0,
      owedByMeCount: 0,
      owedToMeCount: 0,
    },
  )
}

export async function fetchPaymentLedger(): Promise<PaymentLedgerPayload> {
  const response = await fetch("/api/payments/ledger", { cache: "no-store" })
  const payload = (await response.json().catch(() => null)) as PaymentLedgerPayload | null

  if (!response.ok || !payload || !Array.isArray(payload.items)) {
    throw new Error("payment_ledger_lookup_failed")
  }

  return payload
}

export async function setPaymentLedgerTransferPaid(
  item: Pick<PaymentLedgerItem, "source" | "matchId" | "transferId">,
  isPaid: boolean,
) {
  const base =
    item.source === "friendly"
      ? `/api/personal-matches/${encodeURIComponent(item.matchId)}`
      : `/api/matches/${encodeURIComponent(item.matchId)}`
  const response = await fetch(
    `${base}/court-booking/transfers/${encodeURIComponent(item.transferId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid }),
    },
  )

  return response.ok
}
