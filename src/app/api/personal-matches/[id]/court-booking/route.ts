import { NextResponse } from "next/server"
import { buildCourtBooking, getEmptyCourtBooking } from "@/lib/courtBooking"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import {
  getPersonalMatchBookingAccess,
  parsePersonalBookingReservations,
  savePersonalMatchBooking,
} from "@/lib/serverPersonalMatchBooking"
import { loadPersonalMatch } from "@/lib/serverPersonalMatches"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type BookingBody = {
  reservations?: unknown
  ballPurchases?: unknown
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "personal_match_booking_update",
    limit: 40,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const matchId = validateUuid((await params).id)
  if (!matchId) {
    return NextResponse.json({ error: "invalid_personal_match_id" }, { status: 400 })
  }
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const access = await getPersonalMatchBookingAccess(authResult.actor, matchId)
    if (!access) {
      return NextResponse.json({ error: "personal_match_not_found" }, { status: 404 })
    }
    const body = await parseJsonBody<BookingBody>(request)
    const reservations = parsePersonalBookingReservations(
      body?.reservations,
      access.participantIds,
    )
    const ballPurchases = parsePersonalBookingReservations(
      body?.ballPurchases,
      access.participantIds,
      { allowMany: false },
    )
    if (!reservations || !ballPurchases || reservations.length + ballPurchases.length === 0) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }

    const payerIds = new Set(
      [...access.booking.reservations, ...access.booking.ballPurchases].map(
        (payment) => payment.playerId,
      ),
    )
    if (
      access.booking.isReserved &&
      !access.isCreator &&
      payerIds.size > 0 &&
      !payerIds.has(access.currentParticipantId)
    ) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const booking = buildCourtBooking({
      participantIds: access.participantIds,
      reservations,
      ballPurchases,
      previousTransfers: access.booking.transfers,
    })
    await savePersonalMatchBooking(authResult.actor, matchId, booking)
    const item = await loadPersonalMatch(authResult.actor, matchId)
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: "personal_match_booking_update_failed" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "personal_match_booking_delete",
    limit: 20,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const matchId = validateUuid((await params).id)
  if (!matchId) {
    return NextResponse.json({ error: "invalid_personal_match_id" }, { status: 400 })
  }
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const access = await getPersonalMatchBookingAccess(authResult.actor, matchId)
    if (!access) {
      return NextResponse.json({ error: "personal_match_not_found" }, { status: 404 })
    }
    const reservationPayerIds = new Set(
      access.booking.reservations.map((payment) => payment.playerId),
    )
    if (
      !access.isCreator &&
      reservationPayerIds.size > 0 &&
      !reservationPayerIds.has(access.currentParticipantId)
    ) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    await savePersonalMatchBooking(authResult.actor, matchId, getEmptyCourtBooking())
    const item = await loadPersonalMatch(authResult.actor, matchId)
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: "personal_match_booking_clear_failed" }, { status: 500 })
  }
}
