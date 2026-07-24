import "server-only"

import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import type { LeagueMemberRole } from "@/data/fakeData"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"

type MatchAccessOptions = {
  requireLeagueAccess?: boolean
  requireParticipant?: boolean
  requireAdmin?: boolean
}

function toPlayerIds(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((playerId): playerId is string => typeof playerId === "string")
}

function normalizeRole(value: unknown): LeagueMemberRole {
  return value === "creator" || value === "admin" || value === "player"
    ? value
    : "player"
}

export async function getServerMatchActor(
  matchId: string,
  options: MatchAccessOptions = {}
): Promise<
  | {
      ok: true
      actor: {
        supabase: Extract<
          Awaited<ReturnType<typeof requireAuthenticatedAppUser>>,
          { ok: true }
        >["actor"]["supabase"]
        user: Extract<
          Awaited<ReturnType<typeof requireAuthenticatedAppUser>>,
          { ok: true }
        >["actor"]["user"]
        membership: {
          role: LeagueMemberRole
          playerId: string | null
        } | null
        isAdmin: boolean
        isSpectator: boolean
        participantPlayerId: string | null
        match: {
          id: string
          leagueId: string
          seasonId: string
          round: number
          status: "finished" | "scheduled" | "postponed" | "scheduling"
          scheduledAt: string | null
          location: string | null
          teamA: string[]
          teamB: string[]
          participantIds: string[]
          pointsA: number | null
          pointsB: number | null
          sets: { a: number; b: number }[]
          reporterPlayerId: string | null
          resultRecordedAt: string | null
          resultLocked: boolean
          rankingCounts: boolean
          incidentType: ReturnType<typeof mapSupabaseMatch>["incidentType"]
          incidentStatus: ReturnType<typeof mapSupabaseMatch>["incidentStatus"]
          incidentReason: string | null
          incidentNotes: string | null
          incidentCreatedAt: string | null
          incidentResolvedAt: string | null
          resolutionType: ReturnType<typeof mapSupabaseMatch>["resolutionType"]
          courtBooking: ReturnType<typeof mapSupabaseMatch>["courtBooking"]
        }
      }
    }
  | {
      ok: false
      status: number
      error: string
    }
> {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return authResult
  }

  const { supabase, user } = authResult.actor
  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("id", matchId)
    .maybeSingle()

  if (matchError) {
    return { ok: false, status: 500, error: "match_lookup_failed" }
  }

  if (!matchRow) {
    return { ok: false, status: 404, error: "match_not_found" }
  }

  const mappedMatch = mapSupabaseMatch(matchRow as Record<string, unknown>)

  const [membershipResult, spectatorResult] = user.isSuperuser
    ? [{ data: null, error: null }, { data: null, error: null }]
    : await Promise.all([
        supabase
          .from("league_memberships")
          .select("role,player_id")
          .eq("league_id", matchRow.league_id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("league_spectators")
          .select("league_id")
          .eq("league_id", matchRow.league_id)
          .eq("user_id", user.id)
          .maybeSingle(),
      ])

  if (membershipResult.error || spectatorResult.error) {
    return { ok: false, status: 500, error: "match_access_lookup_failed" }
  }

  const membership = membershipResult.data
    ? {
        role: normalizeRole(membershipResult.data.role),
        playerId:
          typeof membershipResult.data.player_id === "string"
            ? membershipResult.data.player_id
            : null,
      }
    : null
  const isSpectator = Boolean(spectatorResult.data)
  const isAdmin =
    user.isSuperuser ||
    membership?.role === "creator" ||
    membership?.role === "admin"
  const participantIds = Array.from(
    new Set([...toPlayerIds(matchRow.team_a), ...toPlayerIds(matchRow.team_b)])
  )
  const participantPlayerId =
    membership?.playerId && participantIds.includes(membership.playerId)
      ? membership.playerId
      : null
  const hasLeagueAccess = user.isSuperuser || Boolean(membership) || isSpectator

  if (options.requireLeagueAccess && !hasLeagueAccess) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  if (options.requireAdmin && !isAdmin) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  if (options.requireParticipant && !participantPlayerId) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  return {
    ok: true,
    actor: {
      supabase,
      user,
      membership,
      isAdmin,
      isSpectator,
      participantPlayerId,
      match: {
        id: mappedMatch.id,
        leagueId: mappedMatch.leagueId,
        seasonId: mappedMatch.seasonId,
        round: mappedMatch.round,
        status: mappedMatch.status,
        scheduledAt: mappedMatch.scheduledAt,
        location: mappedMatch.location,
        teamA: mappedMatch.teamA,
        teamB: mappedMatch.teamB,
        participantIds,
        pointsA: mappedMatch.pointsA,
        pointsB: mappedMatch.pointsB,
        sets: mappedMatch.sets,
        reporterPlayerId: mappedMatch.resultReportedByPlayerId,
        resultRecordedAt: mappedMatch.resultRecordedAt,
        resultLocked: mappedMatch.resultLocked,
        rankingCounts: mappedMatch.rankingCounts,
        incidentType: mappedMatch.incidentType,
        incidentStatus: mappedMatch.incidentStatus,
        incidentReason: mappedMatch.incidentReason,
        incidentNotes: mappedMatch.incidentNotes,
        incidentCreatedAt: mappedMatch.incidentCreatedAt,
        incidentResolvedAt: mappedMatch.incidentResolvedAt,
        resolutionType: mappedMatch.resolutionType,
        courtBooking: mappedMatch.courtBooking,
      },
    },
  }
}
