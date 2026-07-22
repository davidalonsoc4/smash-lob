import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import type {
  MatchIncidentType,
  MatchResolutionType,
} from "@/lib/matchIncidents"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ReportBody = {
  incidentType?: unknown
  reason?: unknown
}

type ResolveBody = {
  resolutionType?: unknown
  notes?: unknown
  rankingCounts?: unknown
  sets?: unknown
}

type MatchSet = { a: number; b: number }

const incidentTypes = new Set<MatchIncidentType>([
  "injury",
  "no_show",
  "cancelled",
  "disputed",
  "other",
])
const resolutionTypes = new Set<MatchResolutionType>([
  "played",
  "postponed",
  "cancelled",
  "no_show",
  "abandoned",
  "administrative",
])

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function parseIncidentType(value: unknown): MatchIncidentType | null {
  return typeof value === "string" && incidentTypes.has(value as MatchIncidentType)
    ? (value as MatchIncidentType)
    : null
}

function parseResolutionType(value: unknown): MatchResolutionType | null {
  return typeof value === "string" && resolutionTypes.has(value as MatchResolutionType)
    ? (value as MatchResolutionType)
    : null
}

function parseScore(value: unknown) {
  const score = Number(value)
  return Number.isInteger(score) && score >= 0 && score <= 7 ? score : null
}

function isValidSet(set: MatchSet) {
  if (set.a === set.b) return false
  const winner = Math.max(set.a, set.b)
  const loser = Math.min(set.a, set.b)
  return (
    (winner === 6 && loser <= 4) ||
    (winner === 7 && (loser === 5 || loser === 6))
  )
}

function parseSets(value: unknown): MatchSet[] | null {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.length > 3) return null

  const sets = value.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null
    }
    const row = item as Record<string, unknown>
    const a = parseScore(row.a)
    const b = parseScore(row.b)
    if (a === null || b === null) return null
    const set = { a, b }
    return isValidSet(set) ? set : null
  })

  return sets.every((set): set is MatchSet => Boolean(set)) ? sets : null
}

function calculatePoints(sets: MatchSet[]) {
  return {
    pointsA: sets.filter((set) => set.a > set.b).length,
    pointsB: sets.filter((set) => set.b > set.a).length,
  }
}

function canReport(actor: { isAdmin: boolean; participantPlayerId: string | null }) {
  return actor.isAdmin || Boolean(actor.participantPlayerId)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params

  if (!validateUuid(matchId)) {
    return NextResponse.json({ error: "invalid_match_id" }, { status: 400 })
  }

  const access = await getServerMatchActor(matchId, { requireLeagueAccess: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (!canReport(access.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  if (access.actor.match.incidentStatus === "open") {
    return NextResponse.json({ error: "incident_already_open" }, { status: 409 })
  }

  if (access.actor.match.incidentStatus === "resolved") {
    return NextResponse.json(
      { error: "resolved_incident_must_be_cleared" },
      { status: 409 },
    )
  }

  const body = await parseJsonBody<ReportBody>(request)
  const incidentType = parseIncidentType(body?.incidentType)
  const reason = cleanText(body?.reason, 500)

  if (!incidentType || reason.length < 3) {
    return NextResponse.json({ error: "invalid_incident" }, { status: 400 })
  }

  const createdAt = new Date().toISOString()
  const { data, error } = await access.actor.supabase
    .from("matches")
    .update({
      incident_type: incidentType,
      incident_status: "open",
      incident_reason: reason,
      incident_notes: null,
      incident_reported_by_user_id: access.actor.user.id,
      incident_resolved_by_user_id: null,
      incident_created_at: createdAt,
      incident_resolved_at: null,
      resolution_type: null,
      ranking_counts: false,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json({ error: "incident_report_failed" }, { status: 500 })
  }

  const updatedMatch = mapSupabaseMatch(data as Record<string, unknown>)

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId: updatedMatch.leagueId,
    seasonId: updatedMatch.seasonId,
    matchId: updatedMatch.id,
    type: "match_incident_reported",
    title: "Incidencia comunicada",
    description: `Jornada ${updatedMatch.round} · ${reason}`,
    metadata: {
      participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
      round: updatedMatch.round,
      incidentType,
      reason,
    },
  }).catch(() => null)

  return NextResponse.json({ match: updatedMatch })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> },
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

  if (access.actor.match.incidentStatus !== "open") {
    return NextResponse.json({ error: "incident_not_open" }, { status: 409 })
  }

  const body = await parseJsonBody<ResolveBody>(request)
  const resolutionType = parseResolutionType(body?.resolutionType)
  const notes = cleanText(body?.notes, 1000)
  const rankingCounts = body?.rankingCounts === true
  const sets = parseSets(body?.sets)

  if (!resolutionType || sets === null) {
    return NextResponse.json({ error: "invalid_incident_resolution" }, { status: 400 })
  }

  if (resolutionType === "played" && access.actor.match.status !== "finished") {
    return NextResponse.json(
      { error: "played_resolution_requires_result" },
      { status: 409 },
    )
  }

  const rankingAllowed =
    resolutionType === "played" ||
    resolutionType === "no_show" ||
    resolutionType === "administrative" ||
    (resolutionType === "abandoned" && sets.length > 0)

  if (rankingCounts && !rankingAllowed) {
    return NextResponse.json(
      { error: "ranking_not_allowed_for_resolution" },
      { status: 400 },
    )
  }

  if (
    rankingCounts &&
    (resolutionType === "no_show" ||
      resolutionType === "administrative" ||
      resolutionType === "abandoned") &&
    sets.length === 0
  ) {
    return NextResponse.json(
      { error: "administrative_result_requires_sets" },
      { status: 400 },
    )
  }

  const points = calculatePoints(sets)

  if (rankingCounts && points.pointsA === points.pointsB) {
    return NextResponse.json(
      { error: "ranking_result_requires_winner" },
      { status: 400 },
    )
  }

  const now = new Date().toISOString()
  const update: Record<string, unknown> = {
    incident_status: "resolved",
    incident_notes: notes || null,
    incident_resolved_by_user_id: access.actor.user.id,
    incident_resolved_at: now,
    resolution_type: resolutionType,
    ranking_counts: rankingCounts,
  }

  if (resolutionType === "postponed") {
    Object.assign(update, {
      status: "postponed",
      scheduled_at: null,
      date_label: null,
      location: null,
      sets: [],
      points_a: null,
      points_b: null,
      result_recorded_at: null,
      result_reported_by_player_id: null,
      result_locked: false,
      ranking_counts: false,
    })
  } else if (resolutionType === "played") {
    Object.assign(update, {
      ranking_counts: access.actor.match.status === "finished" ? rankingCounts : false,
    })
  } else {
    Object.assign(update, {
      status: "finished",
      sets,
      points_a: sets.length > 0 ? points.pointsA : null,
      points_b: sets.length > 0 ? points.pointsB : null,
      result_recorded_at: now,
      result_reported_by_player_id: null,
      result_locked: true,
      ranking_counts: rankingCounts,
    })
  }

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update(update)
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json({ error: "incident_resolve_failed" }, { status: 500 })
  }

  await Promise.all([
    access.actor.supabase
      .from("match_result_confirmations")
      .delete()
      .eq("match_id", matchId),
    access.actor.supabase.from("mvp_votes").delete().eq("match_id", matchId),
  ])

  const updatedMatch = mapSupabaseMatch(data as Record<string, unknown>)

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId: updatedMatch.leagueId,
    seasonId: updatedMatch.seasonId,
    matchId: updatedMatch.id,
    type: "match_incident_resolved",
    title: "Incidencia resuelta",
    description: `Jornada ${updatedMatch.round}${notes ? ` · ${notes}` : ""}`,
    metadata: {
      participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
      round: updatedMatch.round,
      incidentType: updatedMatch.incidentType,
      resolutionType,
      rankingCounts: updatedMatch.rankingCounts,
      pointsA: updatedMatch.pointsA,
      pointsB: updatedMatch.pointsB,
      sets: updatedMatch.sets,
    },
  }).catch(() => null)

  return NextResponse.json({ match: updatedMatch })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
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

  if (!access.actor.match.incidentStatus) {
    return NextResponse.json({ error: "incident_not_found" }, { status: 404 })
  }

  const exceptionalResolution =
    access.actor.match.resolutionType &&
    access.actor.match.resolutionType !== "played"
  const update: Record<string, unknown> = {
    incident_type: null,
    incident_status: null,
    incident_reason: null,
    incident_notes: null,
    incident_reported_by_user_id: null,
    incident_resolved_by_user_id: null,
    incident_created_at: null,
    incident_resolved_at: null,
    resolution_type: null,
    ranking_counts: true,
  }

  if (exceptionalResolution) {
    Object.assign(update, {
      status: access.actor.match.scheduledAt ? "scheduled" : "scheduling",
      sets: [],
      points_a: null,
      points_b: null,
      result_recorded_at: null,
      result_reported_by_player_id: null,
      result_locked: false,
    })
  }

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update(update)
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json({ error: "incident_clear_failed" }, { status: 500 })
  }

  const updatedMatch = mapSupabaseMatch(data as Record<string, unknown>)

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId: updatedMatch.leagueId,
    seasonId: updatedMatch.seasonId,
    matchId: updatedMatch.id,
    type: "match_incident_cleared",
    title: "Incidencia eliminada",
    description: `Jornada ${updatedMatch.round}`,
    metadata: {
      participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
      round: updatedMatch.round,
    },
  }).catch(() => null)

  return NextResponse.json({ match: updatedMatch })
}
