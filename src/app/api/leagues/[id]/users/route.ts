import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { validateUuid } from "@/lib/serverRequest"
import type { LeagueMemberRole } from "@/data/fakeData"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function toRole(role: unknown): LeagueMemberRole {
  return role === "creator" || role === "admin" || role === "player"
    ? role
    : "player"
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params

  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { supabase } = access.actor
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

  if (playersError || membershipsError) {
    return NextResponse.json({ error: "league_users_lookup_failed" }, { status: 500 })
  }

  const userIds = Array.from(
    new Set(
      (memberships ?? [])
        .map((membership) => membership.user_id)
        .filter((candidate): candidate is string => typeof candidate === "string")
    )
  )
  const { data: users, error: usersError } =
    userIds.length > 0
      ? await supabase
          .from("app_users")
          .select("id,email,display_name,avatar_url")
          .in("id", userIds)
      : { data: [], error: null }

  if (usersError) {
    return NextResponse.json({ error: "league_users_lookup_failed" }, { status: 500 })
  }

  const usersById = new Map(
    (users ?? []).map((user) => [
      user.id,
      {
        email: user.email,
        display_name: user.display_name,
        avatar_url:
          typeof user.avatar_url === "string" ? user.avatar_url : null,
      },
    ])
  )
  const membershipsByPlayerId = new Map(
    (memberships ?? [])
      .filter((membership) => typeof membership.player_id === "string")
      .map((membership) => [membership.player_id as string, membership])
  )

  return NextResponse.json({
    items: (players ?? []).map((player) => {
      const membership = membershipsByPlayerId.get(player.id)
      const linkedUser = membership?.user_id
        ? usersById.get(membership.user_id)
        : null

      return {
        playerId: player.id,
        displayName: player.display_name,
        avatarInitials: player.avatar_initials,
        avatarUrl:
          linkedUser?.avatar_url ??
          (typeof player.avatar_url === "string" ? player.avatar_url : null),
        linkedUserId: membership?.user_id ?? null,
        linkedUserEmail: linkedUser?.email ?? null,
        linkedUserDisplayName: linkedUser?.display_name ?? null,
        role: membership ? toRole(membership.role) : null,
      }
    }),
  })
}
