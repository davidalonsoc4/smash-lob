import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { getMatchResultConfirmationState, normalizeResultConfirmationMode } from "@/lib/resultConfirmations"
import {
  applyServerResultCountState,
  fetchServerSeasonActivityMatches,
  fetchServerSeasonResultConfirmations,
  getServerAutomaticRoundMvp,
} from "@/lib/serverActivityDerivations"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import type {
  MatchResultConfirmation,
  MatchResultConfirmationStatus,
} from "@/lib/supabaseMatchConfirmations"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ConfirmationBody = {
  status?: unknown
}

type ConfirmationRow = {
  match_id: string
  player_id: string
  status: MatchResultConfirmationStatus
  updated_at: string
}

function toConfirmation(row: ConfirmationRow): MatchResultConfirmation {
  return {
    matchId: row.match_id,
    playerId: row.player_id,
    status: row.status,
    updatedAt: row.updated_at,
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
    requireParticipant: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const status = (await parseJsonBody<ConfirmationBody>(request))?.status

  if (status !== "confirmed" && status !== "disputed") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 })
  }

  const { data: settingsRow, error: settingsError } = await access.actor.supabase
    .from("season_settings")
    .select("result_confirmation_mode,mvp_system")
    .eq("league_id", access.actor.match.leagueId)
    .eq("season_id", access.actor.match.seasonId)
    .maybeSingle()

  if (settingsError) {
    return NextResponse.json(
      { error: "result_confirmation_mode_lookup_failed" },
      { status: 500 }
    )
  }

  const mode = normalizeResultConfirmationMode(
    settingsRow?.result_confirmation_mode
  )

  if (
    mode === "none" ||
    access.actor.match.resultLocked ||
    access.actor.participantPlayerId === access.actor.match.reporterPlayerId
  ) {
    return NextResponse.json(
      { error: "result_confirmation_not_allowed" },
      { status: 409 }
    )
  }

  const { data: existingRows, error: existingRowsError } = await access.actor.supabase
    .from("match_result_confirmations")
    .select("match_id,player_id,status,updated_at")
    .eq("match_id", matchId)

  if (existingRowsError) {
    return NextResponse.json(
      { error: "result_confirmation_lookup_failed" },
      { status: 500 }
    )
  }

  const validation = getMatchResultConfirmationState({
    matchId,
    participantIds: access.actor.match.participantIds,
    reporterPlayerId: access.actor.match.reporterPlayerId,
    resultRecordedAt: access.actor.match.resultRecordedAt,
    resultLocked: access.actor.match.resultLocked,
    confirmations: (existingRows ?? []).map((row) =>
      toConfirmation(row as ConfirmationRow)
    ),
    mode,
  })

  if (validation.state !== "pending") {
    return NextResponse.json(
      { error: "result_confirmation_not_allowed" },
      { status: 409 }
    )
  }

  const { data, error } = await access.actor.supabase
    .from("match_result_confirmations")
    .upsert(
      {
        match_id: matchId,
        player_id: access.actor.participantPlayerId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,player_id" }
    )
    .select("match_id,player_id,status,updated_at")
    .single()

  if (error) {
    return NextResponse.json(
      { error: "result_confirmation_upsert_failed" },
      { status: 500 }
    )
  }

  const confirmation = toConfirmation(data as ConfirmationRow)
  const nextConfirmations = [
    ...(existingRows ?? [])
      .map((row) => toConfirmation(row as ConfirmationRow))
      .filter((item) => item.playerId !== confirmation.playerId),
    confirmation,
  ]

  if (status === "disputed") {
    const targetPlayerIds = access.actor.match.reporterPlayerId
      ? [access.actor.match.reporterPlayerId]
      : access.actor.match.participantIds.filter(
          (participantId) => participantId !== access.actor.participantPlayerId
        )

    await recordServerActorActivity({
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: access.actor.membership,
      leagueId: access.actor.match.leagueId,
      seasonId: access.actor.match.seasonId,
      matchId,
      type: "match_result_disputed",
      title: "Resultado marcado como incorrecto",
      description: `Jornada ${access.actor.match.round} · Un jugador ha indicado que el resultado necesita corregirse.`,
      metadata: {
        participantIds: access.actor.match.participantIds,
        round: access.actor.match.round,
        targetPlayerIds,
        disputedByPlayerId: access.actor.participantPlayerId,
        resultReportedByPlayerId: access.actor.match.reporterPlayerId,
      },
    }).catch(() => null)
  }

  if (settingsRow?.mvp_system === "automatic") {
    const seasonMatches = await fetchServerSeasonActivityMatches({
      supabase: access.actor.supabase,
      leagueId: access.actor.match.leagueId,
      seasonId: access.actor.match.seasonId,
    }).catch(() => null)

    if (seasonMatches) {
      const confirmations = await fetchServerSeasonResultConfirmations({
        supabase: access.actor.supabase,
        matchIds: seasonMatches
          .map((match) => match.id)
          .filter((matchId): matchId is string => Boolean(matchId)),
      }).catch(() => nextConfirmations)
      const calculatedMatches = applyServerResultCountState({
        matches: seasonMatches,
        confirmations:
          confirmations.length > 0 || nextConfirmations.length === 0
            ? confirmations
            : nextConfirmations,
        resultConfirmationMode: settingsRow?.result_confirmation_mode,
      })
      const roundMvp = getServerAutomaticRoundMvp({
        matches: calculatedMatches,
        leagueId: access.actor.match.leagueId,
        seasonId: access.actor.match.seasonId,
        round: access.actor.match.round,
      })

      if (roundMvp) {
        const { data: existingRoundEvent } = await access.actor.supabase
          .from("activity_events")
          .select("id")
          .eq("league_id", access.actor.match.leagueId)
          .eq("season_id", access.actor.match.seasonId)
          .eq("type", "round_mvp_awarded")
          .contains("metadata", { round: access.actor.match.round })
          .limit(1)

        if (!existingRoundEvent || existingRoundEvent.length === 0) {
          await recordServerActorActivity({
            supabase: access.actor.supabase,
            user: access.actor.user,
            membership: access.actor.membership,
            leagueId: access.actor.match.leagueId,
            seasonId: access.actor.match.seasonId,
            matchId,
            type: "round_mvp_awarded",
            title: `MVP de Jornada ${access.actor.match.round} decidido`,
            description: `Pareja MVP automatica · ${roundMvp.gamesFor}-${roundMvp.gamesAgainst} juegos · ${roundMvp.gamesDiff ?? 0} dif.`,
            metadata: {
              round: access.actor.match.round,
              playerIds: roundMvp.playerIds,
              gamesFor: roundMvp.gamesFor,
              gamesAgainst: roundMvp.gamesAgainst,
              gamesDiff: roundMvp.gamesDiff,
              setsFor: roundMvp.setsFor,
              setsAgainst: roundMvp.setsAgainst,
              system: "automatic",
            },
          }).catch(() => null)
        }
      }
    }
  }

  return NextResponse.json({
    confirmation,
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

  const { error } = await access.actor.supabase
    .from("match_result_confirmations")
    .delete()
    .eq("match_id", matchId)

  if (error) {
    return NextResponse.json(
      { error: "result_confirmation_delete_failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
