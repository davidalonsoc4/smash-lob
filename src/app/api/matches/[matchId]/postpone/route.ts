import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function canManageMatchSchedule(actor: {
  isAdmin: boolean
  participantPlayerId: string | null
}) {
  return actor.isAdmin || Boolean(actor.participantPlayerId)
}

export async function POST(
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

  if (!canManageMatchSchedule(access.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  if (access.actor.match.incidentStatus === "open") {
    return NextResponse.json(
      { error: "match_incident_resolution_required" },
      { status: 409 },
    )
  }

  if (
    access.actor.match.status === "finished" ||
    access.actor.match.status === "postponed" ||
    (access.actor.match.status !== "scheduled" && !access.actor.match.scheduledAt)
  ) {
    return NextResponse.json(
      { error: "match_postpone_not_allowed" },
      { status: 409 }
    )
  }

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update({
      status: "postponed",
      scheduled_at: null,
      date_label: null,
      location: null,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json(
      { error: "match_postpone_failed" },
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
    type: "match_postponed",
    title: "Partido aplazado",
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
