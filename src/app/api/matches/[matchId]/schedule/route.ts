import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { dateTimeLocalToUtcIso, parseMatchScheduleDate } from "@/lib/matchScheduleTime"
import { mapSupabaseMatch, matchSelect, formatScheduleDateLabel } from "@/lib/supabaseMatches"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ScheduleBody = {
  scheduledAt?: unknown
  location?: unknown
}

function canManageMatchSchedule(actor: {
  isAdmin: boolean
  participantPlayerId: string | null
}) {
  return actor.isAdmin || Boolean(actor.participantPlayerId)
}

function parseScheduleBody(body: ScheduleBody | null) {
  const rawScheduledAt =
    typeof body?.scheduledAt === "string" ? body.scheduledAt.trim() : ""
  const location =
    typeof body?.location === "string" ? body.location.trim() : ""

  if (!rawScheduledAt || !location || location.length > 500) {
    return null
  }

  const scheduledAt = dateTimeLocalToUtcIso(rawScheduledAt)

  if (!parseMatchScheduleDate(scheduledAt)) {
    return null
  }

  return {
    scheduledAt,
    location,
  }
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

  if (!canManageMatchSchedule(access.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  if (access.actor.match.status === "finished") {
    return NextResponse.json(
      { error: "match_schedule_not_allowed" },
      { status: 409 }
    )
  }

  const schedule = parseScheduleBody(await parseJsonBody<ScheduleBody>(request))

  if (!schedule) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update({
      status: "scheduled",
      scheduled_at: schedule.scheduledAt,
      date_label: formatScheduleDateLabel(schedule.scheduledAt),
      location: schedule.location,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json(
      { error: "match_schedule_update_failed" },
      { status: 500 }
    )
  }

  const updatedMatch = mapSupabaseMatch(data as Record<string, unknown>)
  const wasAlreadyScheduled = Boolean(
    access.actor.match.scheduledAt || access.actor.match.status === "scheduled"
  )

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId: updatedMatch.leagueId,
    seasonId: updatedMatch.seasonId,
    matchId: updatedMatch.id,
    type: wasAlreadyScheduled ? "match_schedule_updated" : "match_scheduled",
    title: wasAlreadyScheduled ? "Programacion modificada" : "Partido programado",
    description: `Jornada ${updatedMatch.round} · ${updatedMatch.dateLabel ?? formatScheduleDateLabel(schedule.scheduledAt)} · ${schedule.location}`,
    metadata: {
      participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
      round: updatedMatch.round,
      previousScheduledAt: access.actor.match.scheduledAt,
      previousLocation: access.actor.match.location,
      scheduledAt: updatedMatch.scheduledAt,
      location: updatedMatch.location,
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
    requireAdmin: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (
    access.actor.match.status === "finished" ||
    (access.actor.match.status !== "scheduled" && !access.actor.match.scheduledAt)
  ) {
    return NextResponse.json(
      { error: "match_schedule_clear_not_allowed" },
      { status: 409 }
    )
  }

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update({
      status: "scheduling",
      scheduled_at: null,
      date_label: null,
      location: null,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json(
      { error: "match_schedule_clear_failed" },
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
    type: "match_schedule_updated",
    title: "Programacion eliminada",
    description: `Jornada ${updatedMatch.round} · Sin fecha, hora ni lugar`,
    metadata: {
      participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
      round: updatedMatch.round,
      previousScheduledAt: access.actor.match.scheduledAt,
      previousLocation: access.actor.match.location,
      scheduledAt: null,
      location: null,
      scheduleCleared: true,
    },
  }).catch(() => null)

  return NextResponse.json({
    match: updatedMatch,
  })
}
