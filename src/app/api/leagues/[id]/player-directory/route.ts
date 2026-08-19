import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leagueId } = await params
  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const [usersResult, membershipsResult] = await Promise.all([
    access.actor.supabase
      .from("app_users")
      .select("id,display_name,first_name,last_name,avatar_url,profile_completed_at")
      .not("profile_completed_at", "is", null),
    access.actor.supabase
      .from("league_memberships")
      .select("user_id,player_id")
      .eq("league_id", leagueId),
  ])

  if (usersResult.error || membershipsResult.error) {
    return NextResponse.json({ error: "player_directory_lookup_failed" }, { status: 500 })
  }

  const linkedUserIds = new Set(
    (membershipsResult.data ?? [])
      .filter((membership) => typeof membership.player_id === "string")
      .map((membership) => membership.user_id)
      .filter((userId): userId is string => typeof userId === "string"),
  )

  const people = (usersResult.data ?? [])
    .filter(
      (user) =>
        typeof user.id === "string" &&
        user.id !== access.actor.user.id &&
        !linkedUserIds.has(user.id),
    )
    .map((user) => ({
      userId: user.id as string,
      displayName:
        (typeof user.display_name === "string" && user.display_name.trim()) ||
        [user.first_name, user.last_name]
          .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
          .join(" ") ||
        "Jugador",
      avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null,
    }))
    .sort((left, right) =>
      left.displayName.localeCompare(right.displayName, "es", { sensitivity: "base" }),
    )

  return NextResponse.json({ people })
}
