import "server-only"

import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { isAuthorized } from "@/lib/authorizationPolicy"

export type ServerLeagueActor = {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>
  user: {
    id: string
    email: string
    displayName: string | null
    firstName: string | null
    lastName: string | null
    profileCompletedAt: string | null
    availabilityCompletedAt: string | null
    avatarUrl: string | null
    isSuperuser: boolean
  }
  membership: {
    role: "creator" | "admin" | "player"
    playerId: string | null
    joinedAt: string | null
    experienceMode: "admin" | "player" | "player_experience"
  } | null
}

type GetServerLeagueActorOptions = {
  requireAdmin?: boolean
  requireMember?: boolean
}

export type ServerLeagueViewer = ServerLeagueActor & {
  isAdmin: boolean
  isCompetitionAdmin: boolean
  isSpectator: boolean
  spectatorJoinedAt: string | null
}

type GetServerLeagueViewerOptions = {
  requireAccess?: boolean
  requireAdmin?: boolean
  requireMember?: boolean
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function normalizeRole(value: unknown): "creator" | "admin" | "player" {
  return value === "creator" || value === "admin" || value === "player"
    ? value
    : "player"
}

export async function getServerLeagueViewer(
  leagueId: string,
  options: GetServerLeagueViewerOptions = {}
): Promise<
  | { ok: true; actor: ServerLeagueViewer }
  | { ok: false; status: number; error: string }
> {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return authResult
  }

  const {
    supabase,
    user: {
      id,
      email,
      displayName,
      firstName,
      lastName,
      profileCompletedAt,
      availabilityCompletedAt,
      avatarUrl,
      isSuperuser,
    },
  } = authResult.actor

  const [membershipResult, spectatorResult] = await Promise.all([
    supabase
      .from("league_memberships")
      .select("role,player_id,joined_at,experience_mode")
      .eq("league_id", leagueId)
      .eq("user_id", id)
      .maybeSingle(),
    supabase
      .from("league_spectators")
      .select("joined_at")
      .eq("league_id", leagueId)
      .eq("user_id", id)
      .maybeSingle(),
  ])

  if (membershipResult.error || spectatorResult.error) {
    console.error("[serverLeagueAccess] league viewer lookup failed", {
      membership: membershipResult.error
        ? {
            code: membershipResult.error.code ?? null,
            message: membershipResult.error.message ?? null,
            details: membershipResult.error.details ?? null,
            hint: membershipResult.error.hint ?? null,
          }
        : null,
      spectator: spectatorResult.error
        ? {
            code: spectatorResult.error.code ?? null,
            message: spectatorResult.error.message ?? null,
            details: spectatorResult.error.details ?? null,
            hint: spectatorResult.error.hint ?? null,
          }
        : null,
    })
    return { ok: false, status: 500, error: "league_membership_lookup_failed" }
  }

  const membership = membershipResult.data
    ? {
        role: normalizeRole(membershipResult.data.role),
        playerId:
          typeof membershipResult.data.player_id === "string"
            ? membershipResult.data.player_id
            : null,
        joinedAt:
          typeof membershipResult.data.joined_at === "string"
            ? membershipResult.data.joined_at
            : null,
        experienceMode:
          membershipResult.data.experience_mode === "player" ||
          membershipResult.data.experience_mode === "player_experience"
            ? membershipResult.data.experience_mode
            : "admin",
      }
    : null
  const spectatorJoinedAt =
    typeof spectatorResult.data?.joined_at === "string"
      ? spectatorResult.data.joined_at
      : null
  const isSpectator = Boolean(spectatorResult.data)
  const authorizationContext = {
    authenticated: true,
    isSuperuser,
    membershipRole: membership?.role ?? null,
    isSpectator,
  }
  const isAdmin = isAuthorized(authorizationContext, "league:admin")
  const isCompetitionAdmin =
    isAdmin && (!membership || membership.experienceMode === "admin")

  if (options.requireAdmin && !isAdmin) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  if (
    options.requireMember &&
    !isAuthorized(authorizationContext, "league:member")
  ) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  if (
    options.requireAccess &&
    !isAuthorized(authorizationContext, "league:access")
  ) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  return {
    ok: true,
    actor: {
      supabase,
      user: {
        id,
        email: normalizeEmail(email),
        displayName,
        firstName,
        lastName,
        profileCompletedAt,
        availabilityCompletedAt,
        avatarUrl,
        isSuperuser,
      },
      membership,
      isAdmin,
      isCompetitionAdmin,
      isSpectator,
      spectatorJoinedAt,
    },
  }
}

export async function getServerLeagueActor(
  leagueId: string,
  options: GetServerLeagueActorOptions = {},
): Promise<
  | { ok: true; actor: ServerLeagueActor }
  | { ok: false; status: number; error: string }
> {
  const access = await getServerLeagueViewer(leagueId, {
    requireAdmin: options.requireAdmin,
    requireMember: options.requireMember,
  })

  if (!access.ok) {
    return access
  }

  return {
    ok: true,
    actor: {
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: access.actor.membership,
    },
  }
}
