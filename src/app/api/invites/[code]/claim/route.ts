import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { joinSelfRegistrationSeason } from "@/lib/serverSelfRegistration"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ClaimBody = {
  leagueId?: unknown
  playerId?: unknown
}

function normalizeInviteCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : ""
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23505"
  )
}

function toRole(role: unknown) {
  return role === "creator" || role === "admin" || role === "player"
    ? role
    : "player"
}

function getProfileInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const normalizedCode = normalizeInviteCode(decodeURIComponent(code ?? ""))
  const body = await parseJsonBody<ClaimBody>(request)
  const leagueId = validateUuid(body?.leagueId)
  const playerId = validateUuid(body?.playerId)

  if (!normalizedCode || !leagueId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  const {
    supabase,
    user: {
      id: userId,
      email,
      firstName,
      lastName,
      profileCompletedAt,
      availabilityCompletedAt,
      avatarUrl,
    },
  } = authResult.actor

  if (
    !profileCompletedAt ||
    !availabilityCompletedAt ||
    !firstName?.trim() ||
    !lastName?.trim()
  ) {
    return NextResponse.json({ error: "profile-incomplete" }, { status: 409 })
  }

  const profileDisplayName = `${firstName.trim()} ${lastName.trim()}`

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id,invite_code,active_season_id")
    .eq("id", leagueId)
    .maybeSingle()

  if (leagueError) {
    return NextResponse.json({ error: "league_lookup_failed" }, { status: 500 })
  }

  if (!league) {
    return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
  }

  const activeCodeMatches = normalizeInviteCode(league.invite_code) === normalizedCode

  if (!activeCodeMatches) {
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("league_id")
      .eq("league_id", leagueId)
      .eq("code", normalizedCode)
      .is("revoked_at", null)
      .maybeSingle()

    if (inviteError) {
      return NextResponse.json(
        { error: "invite_lookup_failed" },
        { status: 500 }
      )
    }

    if (!invite) {
      return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
    }
  }

  let selfRegistrationSeasonId =
    typeof league.active_season_id === "string" ? league.active_season_id : ""

  if (!selfRegistrationSeasonId) {
    const { data: latestSeason, error: latestSeasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("league_id", leagueId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestSeasonError) {
      return NextResponse.json({ error: "season_lookup_failed" }, { status: 500 })
    }

    selfRegistrationSeasonId = latestSeason?.id ?? ""
  }

  if (selfRegistrationSeasonId) {
    const { data: rosterSettings, error: rosterSettingsError } = await supabase
      .from("season_settings")
      .select("roster_mode")
      .eq("season_id", selfRegistrationSeasonId)
      .eq("league_id", leagueId)
      .maybeSingle()

    if (rosterSettingsError) {
      return NextResponse.json({ error: "season_settings_lookup_failed" }, { status: 500 })
    }

    if (rosterSettings?.roster_mode === "self_registration") {
      try {
        const result = await joinSelfRegistrationSeason({
          actor: authResult.actor,
          leagueId,
          seasonId: selfRegistrationSeasonId,
        })
        const { data: adminMemberships } = await supabase
          .from("league_memberships")
          .select("player_id,role")
          .eq("league_id", leagueId)
          .in("role", ["creator", "admin"])
        const targetPlayerIds = (adminMemberships ?? [])
          .map((item) => item.player_id)
          .filter((item): item is string => typeof item === "string")

        await recordServerActorActivity({
          supabase,
          user: authResult.actor.user,
          membership: result.membership,
          leagueId,
          seasonId: selfRegistrationSeasonId,
          type: "season_player_joined",
          title: result.rosterComplete ? "Plantilla completa" : "Nuevo jugador inscrito",
          description: result.rosterComplete
            ? `${authResult.actor.user.displayName ?? email} ha ocupado la última plaza. Ya puedes comenzar la temporada.`
            : `${authResult.actor.user.displayName ?? email} se ha unido a la temporada.`,
          metadata: {
            playerId: result.playerId,
            registeredCount: result.registeredCount,
            playerCapacity: result.playerCapacity,
            rosterComplete: result.rosterComplete,
            targetPlayerIds,
          },
        }).catch(() => null)

        return NextResponse.json({
          ok: true,
          membership: result.membership,
          selfRegistration: {
            registeredCount: result.registeredCount,
            playerCapacity: result.playerCapacity,
            rosterComplete: result.rosterComplete,
          },
        })
      } catch (joinError) {
        const message = joinError instanceof Error ? joinError.message : "self_registration_join_failed"
        if (message.includes("profile_incomplete")) {
          return NextResponse.json({ error: "profile-incomplete" }, { status: 409 })
        }
        if (message.includes("roster_full")) {
          return NextResponse.json({ error: "roster-full" }, { status: 409 })
        }
        if (message.includes("registration_closed")) {
          return NextResponse.json({ error: "registration-closed" }, { status: 409 })
        }

        return NextResponse.json({ error: "self-registration-failed" }, { status: 500 })
      }
    }
  }

  if (!playerId) {
    return NextResponse.json({ error: "invalid_player" }, { status: 400 })
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id,league_id")
    .eq("id", playerId)
    .eq("league_id", leagueId)
    .maybeSingle()

  if (playerError) {
    return NextResponse.json({ error: "player_lookup_failed" }, { status: 500 })
  }

  if (!player) {
    return NextResponse.json({ error: "invalid_player" }, { status: 400 })
  }

  let joinableSeasonId =
    typeof league.active_season_id === "string" ? league.active_season_id : ""

  if (!joinableSeasonId) {
    const { data: latestSeason, error: latestSeasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("league_id", leagueId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestSeasonError) {
      return NextResponse.json(
        { error: "season_lookup_failed" },
        { status: 500 },
      )
    }

    joinableSeasonId = latestSeason?.id ?? ""
  }

  if (!joinableSeasonId) {
    return NextResponse.json({ error: "invalid_player" }, { status: 400 })
  }

  const [seasonPlayerResult, substituteResult] = await Promise.all([
    supabase
      .from("season_players")
      .select("id")
      .eq("season_id", joinableSeasonId)
      .eq("player_id", playerId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("season_substitutes")
      .select("id")
      .eq("season_id", joinableSeasonId)
      .eq("player_id", playerId)
      .eq("active", true)
      .maybeSingle(),
  ])

  if (seasonPlayerResult.error || substituteResult.error) {
    return NextResponse.json(
      { error: "claimable_player_lookup_failed" },
      { status: 500 },
    )
  }

  if (!seasonPlayerResult.data && !substituteResult.data) {
    return NextResponse.json({ error: "invalid_player" }, { status: 400 })
  }

  const { data: existingUserMembership, error: existingUserMembershipError } =
    await supabase
      .from("league_memberships")
      .select("id")
      .eq("user_id", userId)
      .eq("league_id", leagueId)
      .limit(1)
      .maybeSingle()

  if (existingUserMembershipError) {
    return NextResponse.json(
      { error: "user_membership_lookup_failed" },
      { status: 500 }
    )
  }

  if (existingUserMembership) {
    return NextResponse.json(
      { ok: false, error: "already-in-league" },
      { status: 409 }
    )
  }

  const { data: existingPlayerMembership, error: existingPlayerMembershipError } =
    await supabase
      .from("league_memberships")
      .select("id")
      .eq("league_id", leagueId)
      .eq("player_id", playerId)
      .limit(1)
      .maybeSingle()

  if (existingPlayerMembershipError) {
    return NextResponse.json(
      { error: "player_membership_lookup_failed" },
      { status: 500 }
    )
  }

  if (existingPlayerMembership) {
    return NextResponse.json(
      { ok: false, error: "player-already-claimed" },
      { status: 409 }
    )
  }

  const { data: membership, error: membershipError } = await supabase
    .from("league_memberships")
    .insert({
      user_id: userId,
      league_id: leagueId,
      player_id: playerId,
      role: "player",
    })
    .select("league_id,player_id,role")
    .single()

  if (membershipError) {
    if (isUniqueViolation(membershipError)) {
      const { data: conflictingUserMembership } = await supabase
        .from("league_memberships")
        .select("id")
        .eq("user_id", userId)
        .eq("league_id", leagueId)
        .limit(1)
        .maybeSingle()

      if (conflictingUserMembership) {
        return NextResponse.json(
          { ok: false, error: "already-in-league" },
          { status: 409 }
        )
      }

      const { data: conflictingPlayerMembership } = await supabase
        .from("league_memberships")
        .select("id")
        .eq("league_id", leagueId)
        .eq("player_id", playerId)
        .limit(1)
        .maybeSingle()

      if (conflictingPlayerMembership) {
        return NextResponse.json(
          { ok: false, error: "player-already-claimed" },
          { status: 409 }
        )
      }
    }

    return NextResponse.json({ error: "membership_create_failed" }, { status: 500 })
  }

  const { error: playerProfileError } = await supabase
    .from("players")
    .update({
      display_name: profileDisplayName,
      avatar_initials: getProfileInitials(firstName, lastName),
      avatar_url: avatarUrl,
    })
    .eq("id", playerId)
    .eq("league_id", leagueId)

  if (playerProfileError) {
    // The membership is authoritative. A later global profile save will retry the name propagation.
  }

  const { error: spectatorDeleteError } = await supabase
    .from("league_spectators")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", userId)

  if (spectatorDeleteError) {
    // Claim success is authoritative; spectator cleanup remains best-effort.
  }

  return NextResponse.json({
    ok: true,
    membership: {
      userId: email,
      leagueId: membership.league_id,
      playerId: membership.player_id ?? "",
      role: toRole(membership.role),
    },
  })
}
