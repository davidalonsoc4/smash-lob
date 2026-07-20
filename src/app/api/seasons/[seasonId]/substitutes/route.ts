import { NextResponse } from "next/server"
import {
  buildSubstituteSlug,
  getSubstituteErrorStatus,
  getSubstituteInitials,
  getSubstituteMutationError,
  requireSeasonAdmin,
} from "@/lib/serverSubstitutes"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreateBody = { displayName?: unknown; playerId?: unknown }

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ seasonId: string }> },
) {
  const { seasonId } = await params
  if (!validateUuid(seasonId)) {
    return NextResponse.json({ error: "invalid_season_id" }, { status: 400 })
  }

  const access = await requireSeasonAdmin(seasonId)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { supabase, season } = access.actor
  const [poolResult, substitutionsResult, replacementsResult] = await Promise.all([
    supabase
      .from("season_substitutes")
      .select(
        "id,league_id,season_id,player_id,active,inactive_reason,players(id,display_name,avatar_initials,avatar_url)",
      )
      .eq("season_id", seasonId)
      .order("created_at"),
    supabase
      .from("match_substitutions")
      .select(
        "id,league_id,season_id,match_id,original_player_id,substitute_player_id,substitution_type",
      )
      .eq("season_id", seasonId),
    supabase
      .from("season_replacements")
      .select(
        "id,league_id,season_id,outgoing_player_id,incoming_player_id,from_round",
      )
      .eq("season_id", seasonId)
      .order("created_at"),
  ])

  if (poolResult.error || substitutionsResult.error || replacementsResult.error) {
    return NextResponse.json({ error: "substitutes_lookup_failed" }, { status: 500 })
  }

  return NextResponse.json({
    leagueId: season.league_id,
    substitutes: poolResult.data ?? [],
    matchSubstitutions: substitutionsResult.data ?? [],
    replacements: replacementsResult.data ?? [],
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> },
) {
  const { seasonId } = await params
  if (!validateUuid(seasonId)) {
    return NextResponse.json({ error: "invalid_season_id" }, { status: 400 })
  }

  const access = await requireSeasonAdmin(seasonId)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<CreateBody>(request)
  const playerId = typeof body?.playerId === "string" ? body.playerId : ""
  const displayName =
    typeof body?.displayName === "string" ? body.displayName.trim() : ""

  if (playerId && !validateUuid(playerId)) {
    return NextResponse.json({ error: "invalid_player_id" }, { status: 400 })
  }

  if (!playerId && (displayName.length < 2 || displayName.length > 80)) {
    return NextResponse.json({ error: "invalid_display_name" }, { status: 400 })
  }

  const { supabase } = access.actor
  const { data, error } = await supabase.rpc("server_add_season_substitute", {
    p_season_id: seasonId,
    p_player_id: playerId || null,
    p_display_name: playerId ? null : displayName,
    p_slug: playerId ? null : buildSubstituteSlug(displayName),
    p_avatar_initials: playerId ? null : getSubstituteInitials(displayName),
  })

  if (error) {
    const errorCode = getSubstituteMutationError(error, "substitute_create_failed")
    return NextResponse.json(
      { error: errorCode },
      { status: getSubstituteErrorStatus(errorCode) },
    )
  }

  const result = Array.isArray(data) ? data[0] : data

  return NextResponse.json(
    {
      substitute: {
        id: result?.substitute_id ?? null,
        league_id: access.actor.season.league_id,
        season_id: seasonId,
        player_id: result?.player_id ?? playerId,
        active: true,
      },
    },
    { status: 201 },
  )
}
