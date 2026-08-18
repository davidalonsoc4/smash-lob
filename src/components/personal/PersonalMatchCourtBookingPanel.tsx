"use client"

import { useMemo } from "react"
import { CourtBookingPanel } from "@/components/match/CourtBookingPanel"
import type { CourtBookingReservation } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import { getEmptyCourtBooking } from "@/lib/courtBooking"
import {
  sortPersonalMatchParticipants,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

type PersonalMatchCourtBookingPanelProps = {
  match: PersonalMatchItem
  onUpdated: (match: PersonalMatchItem) => void
}

export function PersonalMatchCourtBookingPanel({
  match,
  onUpdated,
}: PersonalMatchCourtBookingPanelProps) {
  const view = useMemo(() => {
    const participants = sortPersonalMatchParticipants(match.participants)
    const players: PlayerProfile[] = participants.flatMap((participant) => {
      if (!participant.bookingParticipantId) return []

      return [{
        id: participant.bookingParticipantId,
        leagueId: "personal",
        slug: `personal-${participant.bookingParticipantId}`,
        displayName: participant.displayName,
        avatarInitials: participant.displayName
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0] ?? "")
          .join("")
          .toUpperCase() || "JG",
        avatarUrl: participant.avatarUrl ?? null,
        userId: null,
        preferredSide: participant.preferredSide ?? null,
        dominantHand: participant.dominantHand ?? null,
      }]
    })
    const teamA = participants
      .filter((participant) => participant.team === 1)
      .flatMap((participant) => participant.bookingParticipantId ?? [])
    const teamB = participants
      .filter((participant) => participant.team === 2)
      .flatMap((participant) => participant.bookingParticipantId ?? [])
    const currentUserId = participants.find(
      (participant) => participant.isCurrentUser,
    )?.bookingParticipantId ?? ""

    return { players, teamA, teamB, currentUserId }
  }, [match.participants])

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
