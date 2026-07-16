import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ReminderBody = {
  transferIds?: unknown
}

function parseTransferIds(value: unknown) {
  if (value === undefined) {
    return null
  }

  if (!Array.isArray(value)) {
    return false
  }

  const transferIds = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)

  if (transferIds.length !== value.length) {
    return false
  }

  return Array.from(new Set(transferIds))
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params

  if (!validateUuid(matchId)) {
    return NextResponse.json({ error: "invalid_match_id" }, { status: 400 })
  }

  const access = await getServerMatchActor(matchId, {
    requireLeagueAccess: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const currentBooking = access.actor.match.courtBooking

  if (!currentBooking.isReserved) {
    return NextResponse.json(
      { error: "match_court_booking_reminder_not_allowed" },
      { status: 409 }
    )
  }

  const transferIds = parseTransferIds(
    (await parseJsonBody<ReminderBody>(request))?.transferIds
  )

  if (transferIds === false) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const currentPayerIds = new Set(
    [...currentBooking.reservations, ...currentBooking.ballPurchases].map(
      (payment) => payment.playerId
    )
  )
  const canManageExistingBooking =
    access.actor.isAdmin ||
    (access.actor.participantPlayerId !== null &&
      currentPayerIds.has(access.actor.participantPlayerId))

  if (!canManageExistingBooking) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const transferIdSet = transferIds ? new Set(transferIds) : null
  const pendingTransfers = currentBooking.transfers.filter(
    (transfer) =>
      !transfer.isPaid &&
      (!transferIdSet || transferIdSet.has(transfer.id))
  )

  if (pendingTransfers.length === 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId: access.actor.match.leagueId,
    seasonId: access.actor.match.seasonId,
    matchId: access.actor.match.id,
    type: "court_booking_payment_reminder",
    title: "Tienes pagos pendientes",
    description: `Jornada ${access.actor.match.round} · Recordatorio de pago de reserva`,
    metadata: {
      participantIds: access.actor.match.participantIds,
      round: access.actor.match.round,
      reservations: currentBooking.reservations,
      ballPurchases: currentBooking.ballPurchases,
      transfers: pendingTransfers,
      reminder: true,
    },
  }).catch(() => null)

  return NextResponse.json({ ok: true })
}
