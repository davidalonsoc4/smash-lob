import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { mapPlayerAvailabilityRow } from "@/lib/serverPlayerAvailability"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id: leagueId, matchId } = await params

  if (!validateUuid(leagueId) || !validateUuid(matchId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerMatchActor(matchId, { requireLeagueAccess: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (access.actor.match.leagueId !== leagueId) {
    return NextResponse.json({ error: "match_not_found" }, { status: 404 })
  }

  const playerIds = access.actor.match.participantIds

  if (playerIds.length === 0) {
    return NextResponse.json({ items: [] })
  }

  const { data, error } = await access.actor.supabase
    .from("player_availability")
    .select(
      "league_id,season_id,player_id,timezone,weekly_slots,date_overrides,updated_at"
    )
    .eq("league_id", leagueId)
    .eq("season_id", access.actor.match.seasonId)
    .in("player_id", playerIds)

  if (error) {
    return NextResponse.json(
      { error: "player_availability_lookup_failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    items: (data ?? []).map((row) => mapPlayerAvailabilityRow(row)),
  })
}
