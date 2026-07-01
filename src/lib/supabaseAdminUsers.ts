import { supabase } from "@/lib/supabase"
import type { LeagueMemberRole } from "@/data/fakeData"

export type LeagueUserManagementPlayer = {
  playerId: string
  displayName: string
  avatarInitials: string
  avatarUrl: string | null
  linkedUserId: string | null
  linkedUserEmail: string | null
  linkedUserDisplayName: string | null
  role: LeagueMemberRole | null
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "JG"
}

function toRole(role: unknown): LeagueMemberRole {
  return role === "creator" || role === "admin" || role === "player"
    ? role
    : "player"
}

export async function fetchSupabaseLeagueUsers(
  leagueId: string
): Promise<LeagueUserManagementPlayer[]> {
  const [{ data: players, error: playersError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase
        .from("players")
        .select("id,display_name,avatar_initials,avatar_url")
        .eq("league_id", leagueId)
        .order("display_name", { ascending: true }),
      supabase
        .from("league_memberships")
        .select("user_id,player_id,role")
        .eq("league_id", leagueId),
    ])

  if (playersError) throw playersError
  if (membershipsError) throw membershipsError

  const userIds = Array.from(
    new Set(
      (memberships ?? [])
        .map((membership) => membership.user_id)
        .filter((userId): userId is string => typeof userId === "string")
    )
  )

  const usersById = new Map<
    string,
    { email: string; display_name: string | null; avatar_url: string | null }
  >()

  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("app_users")
      .select("id,email,display_name,avatar_url")
      .in("id", userIds)

    if (usersError) throw usersError

    ;(users ?? []).forEach((user) => {
      usersById.set(user.id, {
        email: user.email,
        display_name: user.display_name,
        avatar_url: typeof user.avatar_url === "string" ? user.avatar_url : null,
      })
    })
  }

  const membershipsByPlayerId = new Map(
    (memberships ?? [])
      .filter((membership) => typeof membership.player_id === "string")
      .map((membership) => [membership.player_id as string, membership])
  )

  return (players ?? []).map((player) => {
    const membership = membershipsByPlayerId.get(player.id)
    const linkedUser = membership?.user_id
      ? usersById.get(membership.user_id)
      : null

    return {
      playerId: player.id,
      displayName: player.display_name,
      avatarInitials: player.avatar_initials,
      avatarUrl: linkedUser?.avatar_url ?? (typeof player.avatar_url === "string" ? player.avatar_url : null),
      linkedUserId: membership?.user_id ?? null,
      linkedUserEmail: linkedUser?.email ?? null,
      linkedUserDisplayName: linkedUser?.display_name ?? null,
      role: membership ? toRole(membership.role) : null,
    }
  })
}

export async function updateSupabaseLeagueMembershipRole({
  leagueId,
  playerId,
  role,
}: {
  leagueId: string
  playerId: string
  role: Extract<LeagueMemberRole, "admin" | "player">
}) {
  const { data, error } = await supabase
    .from("league_memberships")
    .update({ role })
    .eq("league_id", leagueId)
    .eq("player_id", playerId)
    .neq("role", "creator")
    .select("user_id,league_id,player_id,role")
    .maybeSingle()

  if (error) throw error

  if (!data) {
    throw new Error("No se ha podido actualizar el rol de este usuario")
  }

  return {
    userId: `__claimed__:${data.user_id}`,
    leagueId: data.league_id,
    playerId: data.player_id ?? "",
    role: toRole(data.role),
  }
}

export async function unlinkSupabaseLeagueMembership({
  leagueId,
  playerId,
}: {
  leagueId: string
  playerId: string
}) {
  const { data, error } = await supabase
    .from("league_memberships")
    .delete()
    .eq("league_id", leagueId)
    .eq("player_id", playerId)
    .neq("role", "creator")
    .select("league_id,player_id,role")
    .maybeSingle()

  if (error) throw error

  if (!data) {
    throw new Error("No se ha podido desvincular esta cuenta")
  }

  return {
    leagueId: data.league_id,
    playerId: data.player_id ?? "",
  }
}

export async function updateSupabasePlayerDisplayName({
  leagueId,
  playerId,
  displayName,
}: {
  leagueId: string
  playerId: string
  displayName: string
}) {
  const cleanName = displayName.trim()

  if (!cleanName) {
    throw new Error("El nombre del jugador no puede estar vacío")
  }

  const { data, error } = await supabase
    .from("players")
    .update({
      display_name: cleanName,
      avatar_initials: getInitials(cleanName),
    })
    .eq("league_id", leagueId)
    .eq("id", playerId)
    .select("id,display_name,avatar_initials,avatar_url")
    .single()

  if (error) throw error

  return {
    playerId: data.id,
    displayName: data.display_name,
    avatarInitials: data.avatar_initials,
    avatarUrl: typeof data.avatar_url === "string" ? data.avatar_url : null,
  }
}

export async function updateSupabasePlayerAvatar({
  leagueId,
  playerId,
  avatarUrl,
}: {
  leagueId: string
  playerId: string
  avatarUrl: string | null
}) {
  const { data: membership, error: membershipError } = await supabase
    .from("league_memberships")
    .select("user_id")
    .eq("league_id", leagueId)
    .eq("player_id", playerId)
    .maybeSingle()

  if (membershipError) throw membershipError

  if (membership?.user_id) {
    const { error: userError } = await supabase
      .from("app_users")
      .update({ avatar_url: avatarUrl })
      .eq("id", membership.user_id)

    if (userError) throw userError
  }

  const { data, error } = await supabase
    .from("players")
    .update({ avatar_url: membership?.user_id ? null : avatarUrl })
    .eq("league_id", leagueId)
    .eq("id", playerId)
    .select("id,display_name,avatar_initials,avatar_url")
    .single()

  if (error) throw error

  return {
    playerId: data.id,
    displayName: data.display_name,
    avatarInitials: data.avatar_initials,
    avatarUrl,
    userId: membership?.user_id ?? null,
  }
}
