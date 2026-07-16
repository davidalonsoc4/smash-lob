import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { normalizeResultConfirmationMode } from "@/lib/resultConfirmations"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ResultLockBody = {
  locked?: unknown
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
    requireAdmin: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const locked = (await parseJsonBody<ResultLockBody>(request))?.locked

  if (typeof locked !== "boolean") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (access.actor.match.status !== "finished") {
    return NextResponse.json(
      { error: "match_result_lock_not_allowed" },
      { status: 409 }
    )
  }

  const { data: settingsRow, error: settingsError } = await access.actor.supabase
    .from("season_settings")
    .select("result_confirmation_mode")
    .eq("league_id", access.actor.match.leagueId)
    .eq("season_id", access.actor.match.seasonId)
    .maybeSingle()

  if (settingsError) {
    return NextResponse.json(
      { error: "match_result_settings_lookup_failed" },
      { status: 500 }
    )
  }

  const resultConfirmationMode = normalizeResultConfirmationMode(
    settingsRow?.result_confirmation_mode
  )

  if (resultConfirmationMode === "none") {
    return NextResponse.json(
      { error: "match_result_lock_not_allowed" },
      { status: 409 }
    )
  }

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update({ result_locked: locked })
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json(
      { error: "match_result_lock_update_failed" },
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
    type: "match_result_updated",
    title: locked
      ? "Resultado fijado por administracion"
      : "Resultado desbloqueado por administracion",
    description: `Jornada ${updatedMatch.round} · ${
      locked
        ? "El resultado queda marcado como definitivo."
        : "El resultado vuelve a admitir correcciones."
    }`,
    metadata: {
      participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
      round: updatedMatch.round,
      pointsA: updatedMatch.pointsA,
      pointsB: updatedMatch.pointsB,
      sets: updatedMatch.sets,
      resultConfirmationMode,
      resultLockOnly: true,
      resultLocked: locked,
    },
  }).catch(() => null)

  return NextResponse.json({
    match: updatedMatch,
  })
}
