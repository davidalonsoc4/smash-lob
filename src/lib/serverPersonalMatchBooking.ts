import "server-only"

import type { CourtBooking, CourtBookingReservation } from "@/context/MatchDataProvider"
import { buildCourtBooking, handOverPayments, getEmptyCourtBooking, normalizeCourtBooking } from "@/lib/courtBooking"
import type { AuthenticatedAppUser } from "@/lib/serverAuth"

type PersonalMatchBookingAccess = {
  participantIds: string[]
  currentParticipantId: string
  isCreator: boolean
  booking: CourtBooking
}

export async function getPersonalMatchBookingAccess(
  actor: AuthenticatedAppUser,
  matchId: string,
): Promise<PersonalMatchBookingAccess | null> {
  const [matchResult, participantsResult, bookingResult] = await Promise.all([
    actor.supabase
      .from("personal_matches")
      .select("id,created_by_user_id")
      .eq("id", matchId)
      .maybeSingle(),
    actor.supabase
      .from("personal_match_participants")
      .select("id,user_id")
      .eq("match_id", matchId),
    actor.supabase
      .from("personal_match_bookings")
      .select("is_reserved,booking_reservations,booking_transfers,booking_updated_at")
      .eq("match_id", matchId)
      .maybeSingle(),
  ])

  if (matchResult.error || participantsResult.error || bookingResult.error) {
    throw new Error("personal_match_booking_lookup_failed")
  }
  if (!matchResult.data) return null

  const participants = (participantsResult.data ?? []).filter(
    (participant): participant is { id: string; user_id: string | null } =>
      typeof participant.id === "string" &&
      (typeof participant.user_id === "string" || participant.user_id === null),
  )
  const currentParticipant = participants.find(
    (participant) => participant.user_id === actor.user.id,
  )
  if (!currentParticipant) return null

  const rawReservations = bookingResult.data?.booking_reservations
  const reservationPayload =
    rawReservations && typeof rawReservations === "object"
      ? (rawReservations as { reservations?: unknown; ballPurchases?: unknown })
      : {}

  return {
    participantIds: participants.map((participant) => participant.id),
    currentParticipantId: currentParticipant.id,
    isCreator: matchResult.data.created_by_user_id === actor.user.id,
    booking: bookingResult.data
      ? normalizeCourtBooking({
          isReserved: bookingResult.data.is_reserved,
          reservations: Array.isArray(reservationPayload.reservations)
            ? reservationPayload.reservations
            : [],
          ballPurchases: Array.isArray(reservationPayload.ballPurchases)
            ? reservationPayload.ballPurchases
            : [],
          transfers: Array.isArray(bookingResult.data.booking_transfers)
            ? bookingResult.data.booking_transfers
            : [],
          updatedAt: bookingResult.data.booking_updated_at,
        })
      : getEmptyCourtBooking(),
  }
}

export function parsePersonalBookingReservations(
  value: unknown,
  participantIds: string[],
  options: { allowMany?: boolean } = {},
): CourtBookingReservation[] | null {
  if (!Array.isArray(value)) return null

  const allowedIds = new Set(participantIds)
  const seen = new Set<string>()
  const parsed = value.map((item) => {
    if (!item || typeof item !== "object") return null
    const record = item as Record<string, unknown>
    const playerId = typeof record.playerId === "string" ? record.playerId.trim() : ""
    const amount = Number(record.amount)
    if (
      !allowedIds.has(playerId) ||
      seen.has(playerId) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 10_000
    ) {
      return null
    }
    seen.add(playerId)
    return {
      playerId,
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
    }
  })

  if (parsed.some((item) => item === null)) return null
  if (options.allowMany === false && parsed.length > 1) return null
  return parsed as CourtBookingReservation[]
}

export async function savePersonalMatchBooking(
  actor: AuthenticatedAppUser,
  matchId: string,
  booking: CourtBooking,
) {
  const { error } = await actor.supabase.from("personal_match_bookings").upsert({
    match_id: matchId,
    is_reserved: booking.isReserved,
    booking_reservations: {
      reservations: booking.reservations,
      ballPurchases: booking.ballPurchases,
    },
    booking_transfers: booking.transfers,
    booking_updated_at: booking.updatedAt,
  })

  if (error) throw new Error("personal_match_booking_update_failed")
}

// After the people of a friendly change, the money follows the people: the ones who stay keep what they paid and
// owe their share, and whoever replaces a person who had paid takes over that payment (the share is split again
// between the current players, so the debts move from one person to another). Returns what the editor should know.
export async function rebalancePersonalMatchBooking(
  actor: AuthenticatedAppUser,
  matchId: string,
  change: { removed: Array<{ id: string; displayName: string }>; added: Array<{ id: string; displayName: string }> },
): Promise<string[]> {
  if (!change.removed.length && !change.added.length) return []
  const [bookingResult, participantsResult] = await Promise.all([
    actor.supabase
      .from("personal_match_bookings")
      .select("is_reserved,booking_reservations,booking_transfers,booking_updated_at")
      .eq("match_id", matchId)
      .maybeSingle(),
    actor.supabase.from("personal_match_participants").select("id").eq("match_id", matchId),
  ])
  if (bookingResult.error || participantsResult.error) throw new Error("personal_match_booking_lookup_failed")
  if (!bookingResult.data) return []

  const raw = bookingResult.data.booking_reservations
  const payload = raw && typeof raw === "object" ? (raw as { reservations?: unknown; ballPurchases?: unknown }) : {}
  const current = normalizeCourtBooking({
    isReserved: bookingResult.data.is_reserved,
    reservations: Array.isArray(payload.reservations) ? payload.reservations : [],
    ballPurchases: Array.isArray(payload.ballPurchases) ? payload.ballPurchases : [],
    transfers: Array.isArray(bookingResult.data.booking_transfers) ? bookingResult.data.booking_transfers : [],
    updatedAt: bookingResult.data.booking_updated_at,
  })
  if (current.reservations.length + current.ballPurchases.length === 0) return []

  const reservations = handOverPayments(current.reservations, change.removed, change.added)
  const ballPurchases = handOverPayments(current.ballPurchases, change.removed, change.added)
  const notes = [...reservations.notes, ...ballPurchases.notes]

  const booking = buildCourtBooking({
    participantIds: (participantsResult.data ?? []).map((participant) => String(participant.id)),
    reservations: reservations.payments,
    ballPurchases: ballPurchases.payments,
    previousTransfers: current.transfers,
  })
  await savePersonalMatchBooking(actor, matchId, booking)
  return notes
}
