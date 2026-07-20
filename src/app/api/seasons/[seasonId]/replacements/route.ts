import { NextResponse } from "next/server"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import {
  buildSubstituteSlug,
  getSubstituteErrorStatus,
  getSubstituteInitials,
  getSubstituteMutationError,
  requireSeasonAdmin,
} from "@/lib/serverSubstitutes"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = {
  outgoingPlayerId?: unknown
  incomingPlayerId?: unknown
  displayName?: unknown
  fromRound?: unknown
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

  const body = await parseJsonBody<Body>(request)
  const outgoingPlayerId =
    typeof body?.outgoingPlayerId === "string" ? body.outgoingPlayerId : ""
  const incomingPlayerId =
    typeof body?.incomingPlayerId === "string" ? body.incomingPlayerId : ""
  const displayName =
    typeof body?.displayName === "string" ? body.displayName.trim() : ""
  const fromRound = Number(body?.fromRound)

  if (!validateUuid(outgoingPlayerId) || !Number.isInteger(fromRound)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (incomingPlayerId && !validateUuid(incomingPlayerId)) {
    return NextResponse.json({ error: "invalid_incoming_player" }, { status: 400 })
  }

  if (!incomingPlayerId && (displayName.length < 2 || displayName.length > 80)) {
    return NextResponse.json({ error: "invalid_display_name" }, { status: 400 })
  }

  const { supabase, user } = access.actor
  const { data, error } = await supabase.rpc("server_apply_season_replacement", {
    p_season_id: seasonId,
    p_outgoing_player_id: outgoingPlayerId,
    p_incoming_player_id: incomingPlayerId || null,
    p_display_name: incomingPlayerId ? null : displayName,
    p_slug: incomingPlayerId ? null : buildSubstituteSlug(displayName),
    p_avatar_initials: incomingPlayerId
      ? null
      : getSubstituteInitials(displayName),
    p_from_round: fromRound,
    p_created_by_user_id: user.id,
  })

  if (error) {
    const errorCode = getSubstituteMutationError(error, "replacement_create_failed")
    return NextResponse.json(
      { error: errorCode },
      { status: getSubstituteErrorStatus(errorCode) },
    )
  }

  const result = Array.isArray(data) ? data[0] : data

  return NextResponse.json(
    {
      replacementId: result?.replacement_id ?? null,
      incomingPlayerId: result?.incoming_player_id ?? incomingPlayerId,
      affectedMatches: Number(result?.affected_matches ?? 0),
    },
    { status: 201 },
  )
}
