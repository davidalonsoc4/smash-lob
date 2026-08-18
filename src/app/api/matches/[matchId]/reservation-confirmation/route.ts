import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { getServerMatchChatCoordination } from "@/lib/serverMatchChatCoordination"
import {
  createScheduledLeagueLocationValue,
  getLeagueLocationCompactText,
  getLeagueLocationCourts,
  normalizeLeagueLocations,
} from "@/lib/leagueLocations"
import { formatScheduleDateLabel, mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { broadcastMatchChatRefresh } from "@/lib/serverChatRealtime"
import { buildCourtBooking } from "@/lib/courtBooking"
import type { CourtBookingReservation } from "@/context/MatchDataProvider"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ConfirmBody = {
  action?: unknown
  dateMessageId?: unknown
  dateOptionKey?: unknown
  locationId?: unknown
  selectedCourt?: unknown
  reservations?: unknown
}

const clean = (value: unknown, max = 120) =>
  typeof value === "string" ? value.trim().slice(0, max) : ""

function parseAmount(value: unknown) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

function parseReservations(value: unknown) {
  if (!Array.isArray(value)) return null

  const seenPlayerIds = new Set<string>()
  const reservations = value
    .map((item) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        return null
      }

      const payment = item as Record<string, unknown>
      const playerId = validateUuid(payment.playerId)
      const amount = parseAmount(payment.amount)
      if (!playerId || amount === null || seenPlayerIds.has(playerId)) {
        return null
      }

      seenPlayerIds.add(playerId)
      return { playerId, amount }
    })
    .filter((item): item is CourtBookingReservation => Boolean(item))

  return reservations.length === value.length ? reservations : null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params
  if (!validateUuid(matchId)) {
    return NextResponse.json({ error: "invalid_match_id" }, { status: 400 })
  }

  const access = await getServerMatchActor(matchId, { requireLeagueAccess: true, requireMutableSeason: true })
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }
  if (!access.actor.isAdmin && !access.actor.participantPlayerId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  if (access.actor.match.status === "finished") {
    return NextResponse.json({ error: "match_finished" }, { status: 409 })
  }
  if (access.actor.match.incidentStatus === "open") {
    return NextResponse.json(
      { error: "match_incident_resolution_required" },
      { status: 409 },
    )
  }

  const body = (await parseJsonBody<ConfirmBody>(request)) ?? {}
  const action = clean(body.action, 40) || "confirm"

  let coordination
  try {
    coordination = await getServerMatchChatCoordination({
      db: access.actor.supabase,
      match: access.actor.match,
    })
  } catch {
    return NextResponse.json(
      { error: "match_chat_coordination_lookup_failed" },
      { status: 500 },
    )
  }

  if (coordination.status !== "awaiting_booking" || !coordination.approvedDates.length) {
    return NextResponse.json({ error: "match_reservation_not_ready" }, { status: 409 })
  }

  if (action === "invalidate_dates") {
    const senderDisplayName =
      access.actor.user.displayName || access.actor.user.email.split("@")[0]
    const invalidatedDates = coordination.approvedDates.map((item) => ({
      messageId: item.messageId,
      optionKey: item.optionKey,
      startsAt: item.startsAt,
    }))
    const affectedMessageIds = Array.from(new Set(invalidatedDates.map((item) => item.messageId)))
    const { data: proposalRows, error: proposalError } = await access.actor.supabase
      .from("match_chat_messages")
      .select("id,payload")
      .eq("match_id", matchId)
      .in("id", affectedMessageIds)
    if (proposalError) {
      return NextResponse.json({ error: "match_reservation_invalidation_failed" }, { status: 500 })
    }
    const invalidatedKeysByMessage = new Map<string, Set<string>>()
    for (const item of invalidatedDates) {
      const keys = invalidatedKeysByMessage.get(item.messageId) ?? new Set<string>()
      keys.add(item.optionKey)
      invalidatedKeysByMessage.set(item.messageId, keys)
    }
    for (const row of proposalRows ?? []) {
      const messageId = String(row.id)
      const payload = typeof row.payload === "object" && row.payload !== null && !Array.isArray(row.payload) ? row.payload as Record<string, unknown> : {}
      const invalidatedKeys = invalidatedKeysByMessage.get(messageId) ?? new Set<string>()
      const options = (Array.isArray(payload.options) ? payload.options : []).map((raw) => {
        const option = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
        return invalidatedKeys.has(String(option.key ?? "")) ? { ...option, invalidated: true } : option
      })
      const update = await access.actor.supabase.from("match_chat_messages").update({ payload: { ...payload, options } }).eq("id", messageId).eq("match_id", matchId)
      if (update.error) {
        return NextResponse.json({ error: "match_reservation_invalidation_failed" }, { status: 500 })
      }
    }
    for (const item of invalidatedDates) {
      const clearedVotes = await access.actor.supabase.from("match_chat_proposal_responses").delete().eq("message_id", item.messageId).eq("option_key", item.optionKey)
      if (clearedVotes.error) {
        return NextResponse.json({ error: "match_reservation_invalidation_failed" }, { status: 500 })
      }
    }
    const { error: invalidateError } = await access.actor.supabase
      .from("match_chat_messages")
      .insert({
        match_id: matchId,
        league_id: access.actor.match.leagueId,
        season_id: access.actor.match.seasonId,
        sender_user_id: access.actor.user.id,
        sender_player_id: access.actor.participantPlayerId,
        sender_display_name: senderDisplayName,
        body: "La fecha y hora acordadas ya no están disponibles. Hay que hacer una nueva propuesta.",
        kind: "text",
        payload: {
          systemType: "reservation_agreement_invalidated",
          invalidatedDates,
        },
      })
    if (invalidateError) {
      return NextResponse.json({ error: "match_reservation_invalidation_failed" }, { status: 500 })
    }
    await broadcastMatchChatRefresh({
      matchId,
      leagueId: access.actor.match.leagueId,
      seasonId: access.actor.match.seasonId,
    })
    return NextResponse.json({ ok: true, invalidatedDates })
  }

  if (action !== "confirm") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const dateMessageId = clean(body.dateMessageId, 80)
  const dateOptionKey = clean(body.dateOptionKey, 80)
  const locationId = clean(body.locationId, 120)
  const selectedCourt = clean(body.selectedCourt, 80)
  const reservationsWereProvided = body.reservations !== undefined
  const reservations = reservationsWereProvided
    ? parseReservations(body.reservations)
    : null
  const participantIds = new Set(access.actor.match.participantIds)
  if (
    !validateUuid(dateMessageId) ||
    !dateOptionKey ||
    !locationId ||
    !selectedCourt
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  if (
    reservationsWereProvided &&
    (!reservations ||
      reservations.length === 0 ||
      reservations.some((reservation) => !participantIds.has(reservation.playerId)))
  ) {
    return NextResponse.json(
      { error: "match_reservation_payments_invalid" },
      { status: 400 },
    )
  }

  const approvedDate = coordination.approvedDates.find(
    (item) => item.messageId === dateMessageId && item.optionKey === dateOptionKey,
  )
  if (!approvedDate) {
    return NextResponse.json({ error: "match_reservation_option_not_approved" }, { status: 409 })
  }

  const { data: leagueRow, error: leagueError } = await access.actor.supabase
    .from("leagues")
    .select("locations")
    .eq("id", access.actor.match.leagueId)
    .maybeSingle()
  if (leagueError) {
    return NextResponse.json({ error: "league_location_lookup_failed" }, { status: 500 })
  }
  const locations = normalizeLeagueLocations(leagueRow?.locations)
  const location = locations.find((item) => item.id === locationId)
  if (!location) {
    return NextResponse.json({ error: "match_reservation_location_not_configured" }, { status: 409 })
  }

  const rejectedLocationIds = new Set(
    coordination.rejectedLocations
      .map((item) => item.locationId)
      .filter((value): value is string => Boolean(value)),
  )
  if (rejectedLocationIds.has(locationId)) {
    return NextResponse.json({ error: "match_reservation_location_rejected" }, { status: 409 })
  }

  const approvedLocationIds = new Set(
    coordination.approvedLocations
      .map((item) => item.locationId)
      .filter((value): value is string => Boolean(value)),
  )
  if (approvedLocationIds.size && !approvedLocationIds.has(locationId)) {
    return NextResponse.json({ error: "match_reservation_location_not_approved" }, { status: 409 })
  }

  const courts = getLeagueLocationCourts(location)
  if (!courts.length) {
    return NextResponse.json({ error: "match_reservation_courts_missing" }, { status: 409 })
  }
  if (!courts.includes(selectedCourt)) {
    return NextResponse.json({ error: "match_reservation_invalid_court" }, { status: 409 })
  }

  const scheduledAt = new Date(approvedDate.startsAt).toISOString()
  const scheduleLocation = createScheduledLeagueLocationValue(location, selectedCourt)
  const dateLabel = formatScheduleDateLabel(scheduledAt)
  const previous = access.actor.match
  const booking = reservationsWereProvided
    ? buildCourtBooking({
        participantIds: previous.participantIds,
        reservations: reservations ?? [],
        ballPurchases: previous.courtBooking.ballPurchases,
        previousTransfers: previous.courtBooking.transfers,
      })
    : {
        ...previous.courtBooking,
        isReserved: true,
        updatedAt: new Date().toISOString(),
      }

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt,
      date_label: dateLabel,
      location: scheduleLocation,
      court_reserved: booking.isReserved,
      booking_reservations: {
        reservations: booking.reservations,
        ballPurchases: booking.ballPurchases,
      },
      booking_transfers: booking.transfers,
      booking_updated_at: booking.updatedAt,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single()
  if (error) {
    return NextResponse.json({ error: "match_reservation_schedule_failed" }, { status: 500 })
  }

  const updatedMatch = mapSupabaseMatch(data as Record<string, unknown>)
  const locationText = getLeagueLocationCompactText({ ...location, selectedCourt })
  const senderDisplayName =
    access.actor.user.displayName || access.actor.user.email.split("@")[0]
  const systemPayload = {
    systemType: "reservation_confirmed",
    scheduledAt,
    dateLabel,
    location: scheduleLocation,
    locationText,
    locationId: location.id,
    selectedCourt,
  }
  const { error: messageError } = await access.actor.supabase
    .from("match_chat_messages")
    .insert({
      match_id: matchId,
      league_id: updatedMatch.leagueId,
      season_id: updatedMatch.seasonId,
      sender_user_id: access.actor.user.id,
      sender_player_id: access.actor.participantPlayerId,
      sender_display_name: senderDisplayName,
      body: `Partido programado · ${dateLabel} · ${locationText}`,
      kind: "text",
      payload: systemPayload,
    })

  if (messageError) {
    await access.actor.supabase
      .from("matches")
      .update({
        status: previous.status,
        scheduled_at: previous.scheduledAt,
        date_label: previous.dateLabel,
        location: previous.location,
        court_reserved: previous.courtBooking.isReserved,
        booking_reservations: {
          reservations: previous.courtBooking.reservations,
          ballPurchases: previous.courtBooking.ballPurchases,
        },
        booking_transfers: previous.courtBooking.transfers,
        booking_updated_at: previous.courtBooking.updatedAt,
      })
      .eq("id", matchId)
    return NextResponse.json(
      { error: "match_reservation_chat_message_failed" },
      { status: 500 },
    )
  }

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId: updatedMatch.leagueId,
    seasonId: updatedMatch.seasonId,
    matchId: updatedMatch.id,
    type: "match_scheduled",
    title: "Pista reservada · Partido programado",
    description: `Jornada ${updatedMatch.round} · ${dateLabel} · ${locationText}`,
    metadata: {
      participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
      round: updatedMatch.round,
      scheduledAt,
      location: scheduleLocation,
      locationText,
      selectedCourt,
      reservations: updatedMatch.courtBooking.reservations,
      transfers: updatedMatch.courtBooking.transfers,
      reservationConfirmedFromChat: true,
      includeActor: true,
      dateLabel,
    },
  }).catch(() => null)

  await broadcastMatchChatRefresh({
    matchId,
    leagueId: updatedMatch.leagueId,
    seasonId: updatedMatch.seasonId,
  })

  return NextResponse.json({ match: updatedMatch, systemPayload })
}
