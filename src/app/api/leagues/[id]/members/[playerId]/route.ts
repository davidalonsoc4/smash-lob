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
    .select("user_id")
    .eq("league_id", leagueId)
    .eq("player_id", playerId)
    .neq("role", "creator")
    .maybeSingle()

  if (targetMembershipError || !targetMembership) {
    return NextResponse.json({ error: "membership_not_found" }, { status: 404 })
  }

  const playerNameMap = await fetchLeaguePlayerNameMap({
    supabase,
    leagueId,
    playerIds: [playerId],
  }).catch(() => new Map<string, string>())
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

  const { data, error } = await supabase
    .from("league_memberships")
    .delete()
    .eq("league_id", leagueId)
    .eq("player_id", playerId)
    .neq("role", "creator")
    .select("league_id,player_id")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "membership_delete_failed" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "membership_not_found" }, { status: 404 })
  }

  await recordServerActorActivity({
    supabase,
    user,
    membership,
    leagueId,
    type: "player_unlinked",
    title: "Cuenta desvinculada",
    description: `${playerNameMap.get(playerId) ?? "Jugador"} ya no tiene una cuenta vinculada en esta liga.`,
    metadata: {
      targetPlayerId: playerId,
      targetPlayerName: playerNameMap.get(playerId) ?? null,
      linkedUserEmail,
    },
  }).catch(() => null)

  return NextResponse.json({
    leagueId: data.league_id,
    playerId: data.player_id ?? "",
  })
}
