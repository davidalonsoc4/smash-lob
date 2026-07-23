import { NextResponse } from "next/server"
import { normalizeProfileName } from "@/lib/accountProfile"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { fetchLeaguePlayerNameMap, recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdateUserBody = {
  firstName?: unknown
  lastName?: unknown
  canCreateLeagues?: unknown
}

async function requireSuperuser() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) return authResult
  if (!authResult.actor.user.isSuperuser) {
    return { ok: false as const, status: 403, error: "forbidden" }
  }

  return authResult
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const authResult = await requireSuperuser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  if (!validateUuid(userId)) {
    return NextResponse.json({ error: "invalid_user_id" }, { status: 400 })
  }

  const body = await parseJsonBody<UpdateUserBody>(request)
  const firstName = normalizeProfileName(body?.firstName, 40)
  const lastName = normalizeProfileName(body?.lastName, 60)
  const canCreateLeagues =
    typeof body?.canCreateLeagues === "boolean" ? body.canCreateLeagues : null

  if (firstName.length < 2 || lastName.length < 2 || canCreateLeagues === null) {
    return NextResponse.json({ error: "invalid_user_update" }, { status: 400 })
  }

  const displayName = `${firstName} ${lastName}`
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  const { supabase } = authResult.actor
  const { data: user, error } = await supabase
    .from("app_users")
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      profile_completed_at: new Date().toISOString(),
      can_create_leagues: canCreateLeagues,
    })
    .eq("id", userId)
    .select("id,email,is_superuser")
    .maybeSingle()

  if (error || !user) {
    return NextResponse.json({ error: "application_user_update_failed" }, { status: 500 })
  }

  const { data: memberships } = await supabase
    .from("league_memberships")
    .select("player_id")
    .eq("user_id", userId)
  const playerIds = (memberships ?? [])
    .map((membership) => membership.player_id)
    .filter((playerId): playerId is string => typeof playerId === "string")

  if (playerIds.length > 0) {
    await supabase
      .from("players")
      .update({ display_name: displayName, avatar_initials: initials })
      .in("id", playerIds)
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      displayName,
      firstName,
      lastName,
      isSuperuser: Boolean(user.is_superuser),
      canCreateLeagues,
    },
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const authResult = await requireSuperuser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  if (!validateUuid(userId)) {
    return NextResponse.json({ error: "invalid_user_id" }, { status: 400 })
  }

  if (userId === authResult.actor.user.id) {
    return NextResponse.json({ error: "cannot_delete_self" }, { status: 409 })
  }

  const { supabase } = authResult.actor
  const { data: targetUser, error: targetError } = await supabase
    .from("app_users")
    .select("id,email,is_superuser")
    .eq("id", userId)
    .maybeSingle()

  if (targetError || !targetUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 })
  }

  if (targetUser.is_superuser) {
    return NextResponse.json({ error: "protected_superuser" }, { status: 409 })
  }

  const { data: ownedLeagues, error: ownedLeaguesError } = await supabase
    .from("leagues")
    .select("id,name")
    .eq("created_by_user_id", userId)

  if (ownedLeaguesError) {
    return NextResponse.json({ error: "owned_leagues_lookup_failed" }, { status: 500 })
  }

  if ((ownedLeagues ?? []).length > 0) {
    return NextResponse.json(
      {
        error: "user_owns_leagues",
        leagues: (ownedLeagues ?? []).map((league) => league.name),
      },
      { status: 409 },
    )
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("league_memberships")
    .select("league_id,player_id")
    .eq("user_id", userId)

  if (membershipsError) {
    return NextResponse.json({ error: "user_memberships_lookup_failed" }, { status: 500 })
  }

  for (const membership of memberships ?? []) {
    if (
      typeof membership.league_id !== "string" ||
      typeof membership.player_id !== "string"
    ) {
      continue
    }

    const [playerNameMap, adminMembershipResult] = await Promise.all([
      fetchLeaguePlayerNameMap({
        supabase,
        leagueId: membership.league_id,
        playerIds: [membership.player_id],
      }).catch(() => new Map<string, string>()),
      supabase
        .from("league_memberships")
        .select("player_id")
        .eq("league_id", membership.league_id)
        .in("role", ["creator", "admin"]),
    ])
    const adminTargetPlayerIds = (adminMembershipResult.data ?? [])
      .map((item) => item.player_id)
      .filter(
        (playerId): playerId is string =>
          typeof playerId === "string" && playerId !== membership.player_id,
      )

    const { data: unlinkRows, error: unlinkError } = await supabase.rpc(
      "server_unlink_league_player",
      {
        p_actor_user_id: authResult.actor.user.id,
        p_actor_is_superuser: true,
        p_league_id: membership.league_id,
        p_player_id: membership.player_id,
      },
    )

    if (unlinkError || !Array.isArray(unlinkRows) || !unlinkRows[0]) {
      return NextResponse.json(
        { error: "application_user_membership_cleanup_failed" },
        { status: 500 },
      )
    }

    const unlinkResult = unlinkRows[0] as {
      season_id: string | null
      season_status: string | null
      removed_from_upcoming_roster: boolean
      registered_count: number | null
      player_capacity: number | null
    }
    const playerName =
      playerNameMap.get(membership.player_id) ?? targetUser.email ?? "Jugador"
    const removedFromUpcomingRoster = Boolean(
      unlinkResult.removed_from_upcoming_roster,
    )
    const activeSeasonInProgress = unlinkResult.season_status === "active"

    await recordServerActorActivity({
      supabase,
      user: authResult.actor.user,
      membership: null,
      leagueId: membership.league_id,
      seasonId: unlinkResult.season_id,
      type: removedFromUpcomingRoster ? "season_player_left" : "player_unlinked",
      title: removedFromUpcomingRoster
        ? "Plaza liberada"
        : activeSeasonInProgress
          ? "Jugador desvinculado durante la temporada"
          : "Cuenta eliminada de la liga",
      description: removedFromUpcomingRoster
        ? `${playerName} ha perdido su vinculación antes del inicio. La plaza vuelve a estar disponible.`
        : activeSeasonInProgress
          ? `${playerName} ha perdido su vinculación durante la temporada. La competición puede continuar, pero valora asignar un reemplazo permanente.`
          : `${playerName} ya no tiene una cuenta vinculada en esta liga.`,
      metadata: {
        targetPlayerId: membership.player_id,
        targetPlayerName: playerName,
        targetPlayerIds: adminTargetPlayerIds,
        registeredCount: Number(unlinkResult.registered_count ?? 0),
        playerCapacity: Number(unlinkResult.player_capacity ?? 0),
        removedFromUpcomingRoster,
        replacementSuggested: activeSeasonInProgress,
        accountDeletedBySuperuser: true,
      },
    }).catch(() => null)
  }

  await Promise.all([
    supabase.from("invites").update({ created_by_user_id: null }).eq("created_by_user_id", userId),
    supabase.from("notification_preferences").delete().eq("user_email", targetUser.email),
    supabase.from("push_subscriptions").delete().eq("user_email", targetUser.email),
  ])

  const { error: deleteError } = await supabase
    .from("app_users")
    .delete()
    .eq("id", userId)

  if (deleteError) {
    return NextResponse.json({ error: "application_user_delete_failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
