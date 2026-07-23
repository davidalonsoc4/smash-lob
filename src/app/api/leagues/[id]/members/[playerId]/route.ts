import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { fetchLeaguePlayerNameMap, recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import type { LeagueMemberRole } from "@/data/fakeData"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdateMemberBody = {
  role?: unknown
}

function toRole(role: unknown): LeagueMemberRole {
  return role === "creator" || role === "admin" || role === "player"
    ? role
    : "player"
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: leagueId, playerId } = await params
  const body = await parseJsonBody<UpdateMemberBody>(request)
  const role = body?.role

  if (!validateUuid(leagueId) || !validateUuid(playerId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (role !== "admin" && role !== "player") {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { supabase } = access.actor
  const { data: previousMembership, error: previousMembershipError } = await supabase
    .from("league_memberships")
    .select("role")
    .eq("league_id", leagueId)
    .eq("player_id", playerId)
    .neq("role", "creator")
    .maybeSingle()

  if (previousMembershipError || !previousMembership) {
    return NextResponse.json({ error: "membership_not_found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("league_memberships")
    .update({ role })
    .eq("league_id", leagueId)
    .eq("player_id", playerId)
    .neq("role", "creator")
    .select("user_id,league_id,player_id,role")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "membership_update_failed" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "membership_not_found" }, { status: 404 })
  }

  const playerNameMap = await fetchLeaguePlayerNameMap({
    supabase,
    leagueId,
    playerIds: [playerId],
  }).catch(() => new Map<string, string>())

  await recordServerActorActivity({
    supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId,
    type: "player_role_updated",
    title: role === "admin" ? "Admin anadido" : "Admin retirado",
    description:
      role === "admin"
        ? `${playerNameMap.get(playerId) ?? "Jugador"} ahora tiene permisos de admin.`
        : `${playerNameMap.get(playerId) ?? "Jugador"} deja de tener permisos de admin.`,
    metadata: {
      targetPlayerId: playerId,
      targetPlayerName: playerNameMap.get(playerId) ?? null,
      previousRole: toRole(previousMembership.role),
      nextRole: role,
    },
  }).catch(() => null)

  return NextResponse.json({
    userId: "__claimed__",
    leagueId: data.league_id,
    playerId: data.player_id ?? "",
    role: toRole(data.role),
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: leagueId, playerId } = await params

  if (!validateUuid(leagueId) || !validateUuid(playerId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { supabase, user, membership } = access.actor
  const isAdmin =
    user.isSuperuser ||
    membership?.role === "creator" ||
    membership?.role === "admin"
  const isSelf = membership?.playerId === playerId

  if (!isSelf && !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  if (isSelf && membership?.role === "creator") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { data: targetMembership, error: targetMembershipError } = await supabase
    .from("league_memberships")
    .select("user_id,role")
    .eq("league_id", leagueId)
    .eq("player_id", playerId)
    .maybeSingle()

  if (targetMembershipError || !targetMembership) {
    return NextResponse.json({ error: "membership_not_found" }, { status: 404 })
  }

  const [playerNameMap, adminMembershipResult] = await Promise.all([
    fetchLeaguePlayerNameMap({
      supabase,
      leagueId,
      playerIds: [playerId],
    }).catch(() => new Map<string, string>()),
    supabase
      .from("league_memberships")
      .select("player_id")
      .eq("league_id", leagueId)
      .in("role", ["creator", "admin"]),
  ])
  const adminTargetPlayerIds = (adminMembershipResult.data ?? [])
    .map((item) => item.player_id)
    .filter((item): item is string => typeof item === "string" && item !== playerId)
  let linkedUserEmail: string | null = null

  if (typeof targetMembership.user_id === "string") {
    const { data: linkedUser } = await supabase
      .from("app_users")
      .select("email")
      .eq("id", targetMembership.user_id)
      .maybeSingle()

    linkedUserEmail =
      typeof linkedUser?.email === "string" ? linkedUser.email : null
  }

  const { data: unlinkRows, error: unlinkError } = await supabase.rpc(
    "server_unlink_league_player",
    {
      p_actor_user_id: user.id,
      p_actor_is_superuser: user.isSuperuser,
      p_league_id: leagueId,
      p_player_id: playerId,
    },
  )

  if (unlinkError || !Array.isArray(unlinkRows) || !unlinkRows[0]) {
    const message = unlinkError?.message ?? "membership_delete_failed"
    const status = message.includes("forbidden") ? 403 : message.includes("not_found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }

  const result = unlinkRows[0] as {
    season_id: string | null
    season_status: string | null
    removed_from_upcoming_roster: boolean
    registered_count: number | null
    player_capacity: number | null
  }
  const playerName = playerNameMap.get(playerId) ?? "Jugador"
  const activeSeasonInProgress = result.season_status === "active"
  const removedFromUpcomingRoster = Boolean(result.removed_from_upcoming_roster)

  await recordServerActorActivity({
    supabase,
    user,
    membership,
    leagueId,
    seasonId: result.season_id,
    type: removedFromUpcomingRoster ? "season_player_left" : "player_unlinked",
    title: removedFromUpcomingRoster
      ? "Plaza liberada"
      : activeSeasonInProgress
        ? "Jugador desvinculado durante la temporada"
        : "Cuenta desvinculada",
    description: removedFromUpcomingRoster
      ? `${playerName} se ha desvinculado antes del inicio. La plaza vuelve a estar disponible.`
      : activeSeasonInProgress
        ? `${playerName} se ha desvinculado durante la temporada. La competición puede continuar, pero valora asignar un reemplazo permanente.`
        : `${playerName} ya no tiene una cuenta vinculada en esta liga.`,
    metadata: {
      targetPlayerId: playerId,
      targetPlayerName: playerName,
      linkedUserEmail,
      targetPlayerIds: adminTargetPlayerIds,
      registeredCount: Number(result.registered_count ?? 0),
      playerCapacity: Number(result.player_capacity ?? 0),
      removedFromUpcomingRoster,
      replacementSuggested: activeSeasonInProgress,
    },
  }).catch(() => null)

  return NextResponse.json({
    leagueId,
    playerId,
    seasonId: result.season_id,
    seasonStatus: result.season_status,
    removedFromUpcomingRoster,
  })
}
