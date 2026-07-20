import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { matchSelect, mapSupabaseMatch } from "@/lib/supabaseMatches"
import {
  buildSubstituteSlug,
  getSubstituteErrorStatus,
  getSubstituteInitials,
  getSubstituteMutationError,
} from "@/lib/serverSubstitutes"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = {
  originalPlayerId?: unknown
  substitutePlayerId?: unknown
  displayName?: unknown
}

async function readUpdatedMatch(
  supabase: Extract<
    Awaited<ReturnType<typeof getServerMatchActor>>,
    { ok: true }
  >["actor"]["supabase"],
  matchId: string,
) {
  const { data, error } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("id", matchId)
    .single()

  if (error || !data) {
    return null
  }

  return mapSupabaseMatch(data as Record<string, unknown>)
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

  const body = await parseJsonBody<Body>(request)
  const originalPlayerId =
    typeof body?.originalPlayerId === "string" ? body.originalPlayerId : ""
  const substitutePlayerId =
    typeof body?.substitutePlayerId === "string" ? body.substitutePlayerId : ""
  const displayName =
    typeof body?.displayName === "string" ? body.displayName.trim() : ""

  if (!validateUuid(originalPlayerId)) {
    return NextResponse.json({ error: "invalid_original_player" }, { status: 400 })
  }

  if (substitutePlayerId && !validateUuid(substitutePlayerId)) {
    return NextResponse.json({ error: "invalid_substitute_player" }, { status: 400 })
  }

  if (!substitutePlayerId && (displayName.length < 2 || displayName.length > 80)) {
    return NextResponse.json({ error: "invalid_display_name" }, { status: 400 })
  }

  const { supabase, user } = access.actor
  const { error } = await supabase.rpc("server_assign_match_substitute", {
    p_match_id: matchId,
    p_original_player_id: originalPlayerId,
    p_substitute_player_id: substitutePlayerId || null,
    p_display_name: substitutePlayerId ? null : displayName,
    p_slug: substitutePlayerId ? null : buildSubstituteSlug(displayName),
    p_avatar_initials: substitutePlayerId
      ? null
      : getSubstituteInitials(displayName),
    p_created_by_user_id: user.id,
  })

  if (error) {
    const errorCode = getSubstituteMutationError(
      error,
      "match_substitution_update_failed",
    )
    return NextResponse.json(
      { error: errorCode },
      { status: getSubstituteErrorStatus(errorCode) },
    )
  }

  const match = await readUpdatedMatch(supabase, matchId)
  if (!match) {
    return NextResponse.json(
      { error: "match_substitution_reload_failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({ match })
}

export async function DELETE(
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

  const body = await parseJsonBody<{ substitutePlayerId?: unknown }>(request)
  const substitutePlayerId =
    typeof body?.substitutePlayerId === "string" ? body.substitutePlayerId : ""

  if (!validateUuid(substitutePlayerId)) {
    return NextResponse.json(
      { error: "invalid_substitute_player" },
      { status: 400 },
    )
  }

  const { supabase } = access.actor
  const { error } = await supabase.rpc("server_remove_match_substitute", {
    p_match_id: matchId,
    p_substitute_player_id: substitutePlayerId,
  })

  if (error) {
    const errorCode = getSubstituteMutationError(
      error,
      "match_substitution_restore_failed",
    )
    return NextResponse.json(
      { error: errorCode },
      { status: getSubstituteErrorStatus(errorCode) },
    )
  }

  const match = await readUpdatedMatch(supabase, matchId)
  if (!match) {
    return NextResponse.json(
      { error: "match_substitution_reload_failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({ match })
}
