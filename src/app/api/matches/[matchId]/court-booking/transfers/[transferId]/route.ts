import { NextResponse } from "next/server"
import { setCourtBookingTransferPaidStatus } from "@/lib/courtBooking"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type TransferBody = {
  isPaid?: unknown
}

function toBookingUpdate(
  booking: ReturnType<typeof setCourtBookingTransferPaidStatus>
) {
  return {
    court_reserved: booking.isReserved,
    booking_reservations: {
      reservations: booking.reservations,
      ballPurchases: booking.ballPurchases,
    },
    booking_transfers: booking.transfers,
    booking_updated_at: booking.updatedAt,
  }
}

export async function PUT(
  request: Request,
  {
    params,
  }: { params: Promise<{ matchId: string; transferId: string }> }
) {
  const { matchId, transferId } = await params

  if (!validateUuid(matchId)) {
    return NextResponse.json({ error: "invalid_match_id" }, { status: 400 })
  }

  const cleanTransferId = transferId.trim()

  if (!cleanTransferId || cleanTransferId.length > 200) {
    return NextResponse.json({ error: "invalid_transfer_id" }, { status: 400 })
  }

  const access = await getServerMatchActor(matchId, {
    requireLeagueAccess: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const isPaid = (await parseJsonBody<TransferBody>(request))?.isPaid

  if (typeof isPaid !== "boolean") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const currentBooking = access.actor.match.courtBooking

  if (!currentBooking.isReserved) {
    return NextResponse.json(
      { error: "match_court_booking_transfer_not_allowed" },
      { status: 409 }
    )
  }

  const transfer = currentBooking.transfers.find(
    (item) => item.id === cleanTransferId
  )

  if (!transfer) {
    return NextResponse.json(
      { error: "match_court_booking_transfer_not_found" },
      { status: 404 }
    )
  }

  const participantPlayerId = access.actor.participantPlayerId
  const canManageAsRecipient = participantPlayerId === transfer.toPlayerId
  const canMarkOwnDebtPaid = Boolean(
    participantPlayerId === transfer.fromPlayerId && !transfer.isPaid && isPaid
  )
  const canManageTransfer =
    access.actor.isAdmin || canManageAsRecipient || canMarkOwnDebtPaid

  if (!canManageTransfer) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const booking = setCourtBookingTransferPaidStatus({
    booking: currentBooking,
    transferId: cleanTransferId,
    isPaid,
  })

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update(toBookingUpdate(booking))
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json(
      { error: "match_court_booking_transfer_update_failed" },
      { status: 500 }
    )
  }

  const updatedMatch = mapSupabaseMatch(data as Record<string, unknown>)

  if (isPaid) {
    const updatedTransfer = updatedMatch.courtBooking.transfers.find(
      (item) => item.id === cleanTransferId
    )

    await recordServerActorActivity({
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: access.actor.membership,
      leagueId: updatedMatch.leagueId,
      seasonId: updatedMatch.seasonId,
      matchId: updatedMatch.id,
      type: "court_booking_payment_paid",
      title: "Pago de pista recibido",
      description: `Jornada ${updatedMatch.round}${
        updatedTransfer ? ` · ${updatedTransfer.amount} pagado` : ""
      }`,
      metadata: {
        participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
        round: updatedMatch.round,
        transferId: cleanTransferId,
        paidTransfer: updatedTransfer ?? null,
      },
    }).catch(() => null)
  }

  return NextResponse.json({ match: updatedMatch })
}
