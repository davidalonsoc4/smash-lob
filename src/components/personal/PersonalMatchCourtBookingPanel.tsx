"use client"

import { CourtBookingPanel } from "@/components/match/CourtBookingPanel"
import type { CourtBookingReservation } from "@/context/MatchDataProvider"
import { getEmptyCourtBooking } from "@/lib/courtBooking"
import { buildPersonalMatchDetailModel } from "@/lib/personalMatchDetailModel"
import type { PersonalMatchItem } from "@/lib/personalMatches"

type PersonalMatchCourtBookingPanelProps = {
  match: PersonalMatchItem
  onUpdated: (match: PersonalMatchItem) => void
}

export function PersonalMatchCourtBookingPanel({
  match,
  onUpdated,
}: PersonalMatchCourtBookingPanelProps) {
  const view = buildPersonalMatchDetailModel(match)

  async function requestBooking(
    method: "PUT" | "DELETE",
    body?: {
      participantIds: string[]
      reservations: CourtBookingReservation[]
      ballPurchases: CourtBookingReservation[]
    },
  ) {
    const response = await fetch(
      `/api/personal-matches/${encodeURIComponent(match.id)}/court-booking`,
      {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
    )
    const payload = (await response.json().catch(() => null)) as {
      item?: PersonalMatchItem
    } | null
    if (!response.ok || !payload?.item) return false
    onUpdated(payload.item)
    return true
  }

  async function updateTransfer(transferId: string, isPaid: boolean) {
    const response = await fetch(
      `/api/personal-matches/${encodeURIComponent(match.id)}/court-booking/transfers/${encodeURIComponent(transferId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid }),
      },
    )
    const payload = (await response.json().catch(() => null)) as {
      item?: PersonalMatchItem
    } | null
    if (!response.ok || !payload?.item) return false
    onUpdated(payload.item)
    return true
  }

  if (!view.currentUserId || view.teamA.length === 0 || view.teamB.length === 0) {
    return null
  }

  return (
    <CourtBookingPanel
      matchId={match.id}
      teamA={view.teamA}
      teamB={view.teamB}
      players={view.players}
      currentUserId={view.currentUserId}
      canManage
      canManageAllPayments={match.canManage}
      booking={match.courtBooking ?? getEmptyCourtBooking()}
      actions={{
        update: (input) => requestBooking("PUT", input),
        clear: () => requestBooking("DELETE"),
        updateTransfer,
      }}
    />
  )
}
