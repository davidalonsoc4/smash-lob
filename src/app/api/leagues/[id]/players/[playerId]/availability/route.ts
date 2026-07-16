import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { mapPlayerAvailabilityRow, parsePlayerAvailabilityUpsert } from "@/lib/serverPlayerAvailability"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AvailabilityBody = {
  seasonId?: unknown
  timezone?: unknown
  weeklySlots?: unknown
  dateOverrides?: unknown
}

type ServiceSupabase = Extract<
  Awaited<ReturnType<typeof getServerLeagueActor>>,
  { ok: true }
>["actor"]["supabase"]

async function seasonExistsForLeague({
  leagueId,
  seasonId,
  supabase,
}: {
  leagueId: string
  seasonId: string
  supabase: ServiceSupabase
}) {
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("league_id", leagueId)
    .eq("id", seasonId)
    .maybeSingle()

  if (error) {
    return { ok: false as const, status: 500, error: "season_lookup_failed" }
  }

  if (!data) {
    return { ok: false as const, status: 404, error: "season_not_found" }
  }

  return { ok: true as const }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: leagueId, playerId } = await params
  const seasonId = validateUuid(new URL(request.url).searchParams.get("seasonId"))

  if (!validateUuid(leagueId) || !validateUuid(playerId) || !seasonId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (access.actor.membership?.playerId !== playerId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const seasonCheck = await seasonExistsForLeague({
    leagueId,
    seasonId,
    supabase: access.actor.supabase,
  })

  if (!seasonCheck.ok) {
    return NextResponse.json(
      { error: seasonCheck.error },
      { status: seasonCheck.status }
    )
  }

  const { data, error } = await access.actor.supabase
    .from("player_availability")
    .select(
      "league_id,season_id,player_id,timezone,weekly_slots,date_overrides,updated_at"
    )
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .eq("player_id", playerId)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: "player_availability_lookup_failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    availability: data ? mapPlayerAvailabilityRow(data) : null,
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: leagueId, playerId } = await params

  if (!validateUuid(leagueId) || !validateUuid(playerId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (access.actor.membership?.playerId !== playerId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const parsed = parsePlayerAvailabilityUpsert(
    await parseJsonBody<AvailabilityBody>(request)
  )

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const seasonCheck = await seasonExistsForLeague({
    leagueId,
    seasonId: parsed.seasonId,
    supabase: access.actor.supabase,
  })

  if (!seasonCheck.ok) {
    return NextResponse.json(
      { error: seasonCheck.error },
      { status: seasonCheck.status }
    )
  }

  const { data, error } = await access.actor.supabase
    .from("player_availability")
    .upsert(
      {
        league_id: leagueId,
        season_id: parsed.seasonId,
        player_id: playerId,
        user_id: access.actor.user.id,
        timezone: parsed.timezone,
        weekly_slots: parsed.weeklySlots,
        date_overrides: parsed.dateOverrides,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "league_id,season_id,player_id" }
    )
    .select(
      "league_id,season_id,player_id,timezone,weekly_slots,date_overrides,updated_at"
    )
    .single()

  if (error) {
    return NextResponse.json(
      { error: "player_availability_upsert_failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    availability: mapPlayerAvailabilityRow(data),
  })
}
