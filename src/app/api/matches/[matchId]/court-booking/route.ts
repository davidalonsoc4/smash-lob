import { NextResponse } from "next/server"
import { buildCourtBooking, getEmptyCourtBooking } from "@/lib/courtBooking"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import type { CourtBookingReservation } from "@/context/MatchDataProvider"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CourtBookingBody = {
  reservations?: unknown
  ballPurchases?: unknown
}

function canManageMatch(actor: {
  isAdmin: boolean
  participantPlayerId: string | null
}) {
  return actor.isAdmin || Boolean(actor.participantPlayerId)
}

function parseAmount(value: unknown) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }

  return Math.round((amount + Number.EPSILON) * 100) / 100
}

function parseReservations(
  value: unknown,
  { allowMany = true }: { allowMany?: boolean } = {}
) {
  if (!Array.isArray(value)) {
    return null
  }

  const seenPlayerIds = new Set<string>()
  const reservations = value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null
      }

      const record = item as Record<string, unknown>
      const playerId = validateUuid(record.playerId)
      const amount = parseAmount(record.amount)

      if (!playerId || amount === null || seenPlayerIds.has(playerId)) {
        return null
      }

      seenPlayerIds.add(playerId)

      return {
        playerId,
        amount,
      }
    })
    .filter((reservation): reservation is CourtBookingReservation =>
      Boolean(reservation)
    )

  if (reservations.length !== value.length) {
    return null
  }

  if (!allowMany && reservations.length > 1) {
    return null
  }

  return reservations
}

function toBookingUpdate(booking: ReturnType<typeof getEmptyCourtBooking>) {
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

function getBookingTotal(match: ReturnType<typeof mapSupabaseMatch>) {
  return [
    ...match.courtBooking.reservations,
    ...match.courtBooking.ballPurchases,
  ].reduce((total, payment) => total + payment.amount, 0)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export async function PUT(
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

  if (!canManageMatch(access.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  if (
    access.actor.match.status !== "scheduled" &&
    !access.actor.match.courtBooking.isReserved
  ) {
    return NextResponse.json(
      { error: "match_court_booking_not_allowed" },
      { status: 409 }
    )
  }

  const body = await parseJsonBody<CourtBookingBody>(request)
  const reservations = parseReservations(body?.reservations)
  const ballPurchases = parseReservations(body?.ballPurchases, {
    allowMany: false,
  })

  if (!reservations || !ballPurchases) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (reservations.length === 0 && ballPurchases.length === 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const participantPlayerId = access.actor.participantPlayerId
  const currentBooking = access.actor.match.courtBooking
  const currentPayerIds = new Set(
    [...currentBooking.reservations, ...currentBooking.ballPurchases].map(
      (payment) => payment.playerId
    )
  )
  const canCreateBooking = !currentBooking.isReserved
  const canManageExistingBooking =
    currentBooking.isReserved &&
    (access.actor.isAdmin ||
      (participantPlayerId !== null && currentPayerIds.has(participantPlayerId)))

  if (
    (currentBooking.isReserved && !canManageExistingBooking) ||
    (!currentBooking.isReserved && !canCreateBooking)
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const booking = buildCourtBooking({
    participantIds: access.actor.match.participantIds,
    reservations,
    ballPurchases,
    previousTransfers: currentBooking.transfers,
  })

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update(toBookingUpdate(booking))
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json(
      { error: "match_court_booking_update_failed" },
      { status: 500 }
    )
  }

  const updatedMatch = mapSupabaseMatch(data as Record<string, unknown>)

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId: updatedMatch.leagueId,
    seasonId: updatedMatch.seasonId,
    matchId: updatedMatch.id,
    type: "court_booking_updated",
    title: "Tienes pagos pendientes",
    description: `Jornada ${updatedMatch.round} · Total pagos y reservas: ${formatMoney(
      getBookingTotal(updatedMatch)
    )}`,
    metadata: {
      participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
      round: updatedMatch.round,
      reservations: updatedMatch.courtBooking.reservations,
      ballPurchases: updatedMatch.courtBooking.ballPurchases,
      transfers: updatedMatch.courtBooking.transfers,
    },
  }).catch(() => null)

  return NextResponse.json({
    match: updatedMatch,
  })
}

export async function DELETE(
  _request: Request,
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

  if (!canManageMatch(access.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const participantPlayerId = access.actor.participantPlayerId
  const currentBooking = access.actor.match.courtBooking

  if (!currentBooking.isReserved) {
    return NextResponse.json(
      { error: "match_court_booking_clear_not_allowed" },
      { status: 409 }
    )
  }

  const currentPayerIds = new Set(
    [...currentBooking.reservations, ...currentBooking.ballPurchases].map(
      (payment) => payment.playerId
    )
  )
  const reservationPayerIds = new Set(
    currentBooking.reservations.map((payment) => payment.playerId)
  )
  const canManageExistingBooking =
    access.actor.isAdmin ||
    (participantPlayerId !== null && currentPayerIds.has(participantPlayerId))
  const canClearBooking =
    canManageExistingBooking &&
    (access.actor.isAdmin ||
      (participantPlayerId !== null && reservationPayerIds.has(participantPlayerId)))

  if (!canClearBooking) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update(toBookingUpdate(getEmptyCourtBooking()))
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json(
      { error: "match_court_booking_clear_failed" },
      { status: 500 }
    )
  }

  const updatedMatch = mapSupabaseMatch(data as Record<string, unknown>)

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId: updatedMatch.leagueId,
    seasonId: updatedMatch.seasonId,
    matchId: updatedMatch.id,
    type: "court_booking_cleared",
    title: "Reserva de pista eliminada",
    description: `Jornada ${updatedMatch.round}`,
    metadata: {
      participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
      round: updatedMatch.round,
    },
  }).catch(() => null)

  return NextResponse.json({
    match: updatedMatch,
  })
}
