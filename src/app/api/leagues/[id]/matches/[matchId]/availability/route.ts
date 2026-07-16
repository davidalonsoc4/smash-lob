import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { mapPlayerAvailabilityRow } from "@/lib/serverPlayerAvailability"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function toPlayerIds(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((playerId): playerId is string => typeof playerId === "string")
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id: leagueId, matchId } = await params

  if (!validateUuid(leagueId) || !validateUuid(matchId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { data: match, error: matchError } = await access.actor.supabase
    .from("matches")
    .select("id,season_id,team_a,team_b")
    .eq("league_id", leagueId)
    .eq("id", matchId)
    .maybeSingle()

  if (matchError) {
    return NextResponse.json({ error: "match_lookup_failed" }, { status: 500 })
  }

  if (!match) {
    return NextResponse.json({ error: "match_not_found" }, { status: 404 })
  }

  const playerIds = Array.from(new Set([...toPlayerIds(match.team_a), ...toPlayerIds(match.team_b)]))

  if (playerIds.length === 0) {
    return NextResponse.json({ items: [] })
  }

  const { data, error } = await access.actor.supabase
    .from("player_availability")
    .select(
      "league_id,season_id,player_id,timezone,weekly_slots,date_overrides,updated_at"
    )
    .eq("league_id", leagueId)
    .eq("season_id", match.season_id)
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
