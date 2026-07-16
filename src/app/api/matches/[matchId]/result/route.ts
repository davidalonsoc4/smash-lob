import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { normalizeResultConfirmationMode } from "@/lib/resultConfirmations"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import {
  applyServerResultCountState,
  fetchServerSeasonActivityMatches,
  fetchServerSeasonResultConfirmations,
  getServerAutomaticRoundMvp,
} from "@/lib/serverActivityDerivations"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ResultBody = {
  sets?: unknown
}

type MatchSet = {
  a: number
  b: number
}

function parseSetScore(value: unknown) {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 7) {
    return null
  }

  return numberValue
}

function isValidSet(set: MatchSet) {
  if (set.a === set.b) {
    return false
  }

  const winnerGames = Math.max(set.a, set.b)
  const loserGames = Math.min(set.a, set.b)

  return (
    (winnerGames === 6 && loserGames <= 4) ||
    (winnerGames === 7 && (loserGames === 5 || loserGames === 6))
  )
}

function parseResultSets(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 3) {
    return null
  }

  const sets = value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null
      }

      const record = item as Record<string, unknown>
      const a = parseSetScore(record.a)
      const b = parseSetScore(record.b)

      if (a === null || b === null) {
        return null
      }

      const set = { a, b }

      return isValidSet(set) ? set : null
    })
    .filter((set): set is MatchSet => Boolean(set))

  return sets.length === value.length ? sets : null
}

function calculateResultPoints(sets: MatchSet[]) {
  return {
    pointsA: sets.filter((set) => set.a > set.b).length,
    pointsB: sets.filter((set) => set.b > set.a).length,
  }
}

function canWriteMatchResult(actor: {
  isAdmin: boolean
  participantPlayerId: string | null
}) {
  return actor.isAdmin || Boolean(actor.participantPlayerId)
}

function getSetsSummary(sets: MatchSet[]) {
  if (sets.length === 0) {
    return "sin juegos registrados"
  }

  return sets.map((set) => `${set.a}-${set.b}`).join(", ")
}

function getResultSummary(match: {
  pointsA: number | null
  pointsB: number | null
  sets: MatchSet[]
}) {
  if (match.pointsA === null || match.pointsB === null) {
    return "Resultado sin puntos registrados"
  }

  return `Sets ${match.pointsA}-${match.pointsB} · Juegos: ${getSetsSummary(match.sets)}`
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
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (!canWriteMatchResult(access.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const sets = parseResultSets((await parseJsonBody<ResultBody>(request))?.sets)

  if (!sets) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const { data: settingsRow, error: settingsError } = await access.actor.supabase
    .from("season_settings")
    .select("requires_three_sets,result_confirmation_mode,mvp_system")
    .eq("league_id", access.actor.match.leagueId)
    .eq("season_id", access.actor.match.seasonId)
    .maybeSingle()

  if (settingsError) {
    return NextResponse.json(
      { error: "match_result_settings_lookup_failed" },
      { status: 500 }
    )
  }

  const requiresThreeSets = Boolean(settingsRow?.requires_three_sets ?? true)
  const resultConfirmationMode = normalizeResultConfirmationMode(
    settingsRow?.result_confirmation_mode
  )
  const resultIsLocked =
    resultConfirmationMode !== "none" && access.actor.match.resultLocked

  if (
    (requiresThreeSets && sets.length !== 3) ||
    (!requiresThreeSets && (sets.length < 1 || sets.length > 3))
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  let participantDisputedResult = false

  if (access.actor.participantPlayerId) {
    const { data: participantConfirmation, error: participantConfirmationError } =
      await access.actor.supabase
        .from("match_result_confirmations")
        .select("status")
        .eq("match_id", matchId)
        .eq("player_id", access.actor.participantPlayerId)
        .maybeSingle()

    if (participantConfirmationError) {
      return NextResponse.json(
        { error: "match_result_confirmation_lookup_failed" },
        { status: 500 }
      )
    }

    participantDisputedResult = participantConfirmation?.status === "disputed"
  }

  const canEditFinishedAsParticipant = Boolean(
    access.actor.participantPlayerId &&
      !resultIsLocked &&
      (
        access.actor.match.reporterPlayerId === access.actor.participantPlayerId ||
        participantDisputedResult ||
        !access.actor.match.reporterPlayerId
      )
  )
  const canSaveResult =
    access.actor.match.status === "scheduled" ||
    (access.actor.isAdmin &&
      (
        access.actor.match.status === "scheduling" ||
        access.actor.match.status === "postponed"
      )) ||
    (access.actor.match.status === "finished" &&
      (access.actor.isAdmin ? !resultIsLocked : canEditFinishedAsParticipant))

  if (!canSaveResult) {
    return NextResponse.json(
      { error: "match_result_not_allowed" },
      { status: 409 }
    )
  }

  const points = calculateResultPoints(sets)
  const resultRecordedAt = new Date().toISOString()
  const { data, error } = await access.actor.supabase
    .from("matches")
    .update({
      status: "finished",
      sets,
      points_a: points.pointsA,
      points_b: points.pointsB,
      result_recorded_at: resultRecordedAt,
      result_reported_by_player_id: access.actor.participantPlayerId,
      result_locked: false,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json(
      { error: "match_result_update_failed" },
      { status: 500 }
    )
  }

  const { error: confirmationsError } = await access.actor.supabase
    .from("match_result_confirmations")
    .delete()
    .eq("match_id", matchId)

  if (confirmationsError) {
    return NextResponse.json(
      { error: "match_result_confirmation_delete_failed" },
      { status: 500 }
    )
  }

  const updatedMatch = mapSupabaseMatch(data as Record<string, unknown>)
  const wasAlreadyFinished = Boolean(
    access.actor.match.status === "finished" ||
      access.actor.match.resultRecordedAt ||
      access.actor.match.pointsA !== null ||
      access.actor.match.pointsB !== null ||
      access.actor.match.sets.length > 0
  )

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId: updatedMatch.leagueId,
    seasonId: updatedMatch.seasonId,
    matchId: updatedMatch.id,
    type: wasAlreadyFinished ? "match_result_updated" : "match_result_saved",
    title: wasAlreadyFinished ? "Resultado modificado" : "Resultado registrado",
    description: `Jornada ${updatedMatch.round} · ${
      wasAlreadyFinished
        ? `${getResultSummary(access.actor.match)} -> ${getResultSummary(updatedMatch)}`
        : getResultSummary(updatedMatch)
    }`,
    metadata: {
      participantIds: [...updatedMatch.teamA, ...updatedMatch.teamB],
      round: updatedMatch.round,
      previousPointsA: access.actor.match.pointsA,
      previousPointsB: access.actor.match.pointsB,
      previousSets: access.actor.match.sets,
      pointsA: updatedMatch.pointsA,
      pointsB: updatedMatch.pointsB,
      sets: updatedMatch.sets,
      resultConfirmationMode,
      resultReportedByPlayerId: updatedMatch.resultReportedByPlayerId,
    },
  }).catch(() => null)

  if (settingsRow?.mvp_system === "automatic") {
    const seasonMatches = await fetchServerSeasonActivityMatches({
      supabase: access.actor.supabase,
      leagueId: updatedMatch.leagueId,
      seasonId: updatedMatch.seasonId,
    }).catch(() => null)

    if (seasonMatches) {
      const confirmations = await fetchServerSeasonResultConfirmations({
        supabase: access.actor.supabase,
        matchIds: seasonMatches
          .map((match) => match.id)
          .filter((matchId): matchId is string => Boolean(matchId)),
      }).catch(() => [])
      const calculatedMatches = applyServerResultCountState({
        matches: seasonMatches,
        confirmations,
        resultConfirmationMode,
      })
      const roundMvp = getServerAutomaticRoundMvp({
        matches: calculatedMatches,
        leagueId: updatedMatch.leagueId,
        seasonId: updatedMatch.seasonId,
        round: updatedMatch.round,
      })

      if (roundMvp) {
        const { data: existingRoundEvent } = await access.actor.supabase
          .from("activity_events")
          .select("id")
          .eq("league_id", updatedMatch.leagueId)
          .eq("season_id", updatedMatch.seasonId)
          .eq("type", "round_mvp_awarded")
          .contains("metadata", { round: updatedMatch.round })
          .limit(1)

        if (!existingRoundEvent || existingRoundEvent.length === 0) {
          await recordServerActorActivity({
            supabase: access.actor.supabase,
            user: access.actor.user,
            membership: access.actor.membership,
            leagueId: updatedMatch.leagueId,
            seasonId: updatedMatch.seasonId,
            matchId: updatedMatch.id,
            type: "round_mvp_awarded",
            title: `MVP de Jornada ${updatedMatch.round} decidido`,
            description: `Pareja MVP automatica · ${roundMvp.gamesFor}-${roundMvp.gamesAgainst} juegos · ${roundMvp.gamesDiff ?? 0} dif.`,
            metadata: {
              round: updatedMatch.round,
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
    match: updatedMatch,
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

  if (access.actor.match.status !== "finished") {
    return NextResponse.json(
      { error: "match_result_clear_not_allowed" },
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
  const resultIsLocked =
    resultConfirmationMode !== "none" && access.actor.match.resultLocked

  if (resultIsLocked) {
    return NextResponse.json(
      { error: "match_result_clear_not_allowed" },
      { status: 409 }
    )
  }

  const { data, error } = await access.actor.supabase
    .from("matches")
    .update({
      status: access.actor.match.scheduledAt ? "scheduled" : "scheduling",
      sets: [],
      points_a: null,
      points_b: null,
      result_recorded_at: null,
      result_reported_by_player_id: null,
      result_locked: false,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single()

  if (error) {
    return NextResponse.json(
      { error: "match_result_clear_failed" },
      { status: 500 }
    )
  }

  const { error: confirmationsError } = await access.actor.supabase
    .from("match_result_confirmations")
    .delete()
    .eq("match_id", matchId)

  if (confirmationsError) {
    return NextResponse.json(
      { error: "match_result_confirmation_delete_failed" },
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
    type: "match_result_cleared",
    title: "Resultado limpiado",
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
