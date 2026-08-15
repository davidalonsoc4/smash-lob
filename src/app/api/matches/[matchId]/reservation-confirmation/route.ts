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

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ConfirmBody = {
  dateMessageId?: unknown
  dateOptionKey?: unknown
  locationMessageId?: unknown
  locationOptionKey?: unknown
  selectedCourt?: unknown
}

const clean = (value: unknown, max = 120) =>
  typeof value === "string" ? value.trim().slice(0, max) : ""

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
  const dateMessageId = clean(body.dateMessageId, 80)
  const dateOptionKey = clean(body.dateOptionKey, 80)
  const locationMessageId = clean(body.locationMessageId, 80)
  const locationOptionKey = clean(body.locationOptionKey, 80)
  const selectedCourt = clean(body.selectedCourt, 80)
  if (
    !validateUuid(dateMessageId) ||
    !dateOptionKey ||
    !validateUuid(locationMessageId) ||
    !locationOptionKey ||
    !selectedCourt
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

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

  if (coordination.status !== "awaiting_booking") {
    return NextResponse.json({ error: "match_reservation_not_ready" }, { status: 409 })
  }

  const approvedDate = coordination.approvedDates.find(
    (item) => item.messageId === dateMessageId && item.optionKey === dateOptionKey,
  )
  const approvedLocation = coordination.approvedLocations.find(
    (item) =>
      item.messageId === locationMessageId && item.optionKey === locationOptionKey,
  )
  if (!approvedDate || !approvedLocation) {
    return NextResponse.json({ error: "match_reservation_option_not_approved" }, { status: 409 })
  }
  if (!approvedLocation.locationId) {
    return NextResponse.json({ error: "match_reservation_location_not_configured" }, { status: 409 })
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
  const location = locations.find((item) => item.id === approvedLocation.locationId)
  if (!location) {
    return NextResponse.json({ error: "match_reservation_location_not_configured" }, { status: 409 })
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

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt,
      date_label: dateLabel,
      location: scheduleLocation,
      court_reserved: true,
      booking_updated_at: new Date().toISOString(),
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
      reservationConfirmedFromChat: true,
    },
  }).catch(() => null)

  await broadcastMatchChatRefresh({
    matchId,
    leagueId: updatedMatch.leagueId,
    seasonId: updatedMatch.seasonId,
  })

  return NextResponse.json({ match: updatedMatch, systemPayload })
}
