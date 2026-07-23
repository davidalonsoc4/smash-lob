import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  if (!authResult.actor.user.isSuperuser) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { supabase } = authResult.actor
  const [usersResult, membershipsResult, leaguesResult] = await Promise.all([
    supabase
      .from("app_users")
      .select("id,email,display_name,first_name,last_name,is_superuser,can_create_leagues,profile_completed_at,availability_completed_at,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("league_memberships")
      .select("user_id,league_id,role"),
    supabase
      .from("leagues")
      .select("id,name,created_by_user_id"),
  ])

  if (usersResult.error || membershipsResult.error || leaguesResult.error) {
    return NextResponse.json({ error: "application_users_lookup_failed" }, { status: 500 })
  }

  const memberships = membershipsResult.data ?? []
  const leagues = leaguesResult.data ?? []
  const leagueNameById = new Map(
    leagues.map((league) => [String(league.id), String(league.name ?? "Liga")]),
  )

  const items = (usersResult.data ?? []).map((user) => {
    const userMemberships = memberships.filter(
      (membership) => membership.user_id === user.id,
    )
    const ownedLeagueNames = leagues
      .filter((league) => league.created_by_user_id === user.id)
      .map((league) => String(league.name ?? "Liga"))

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name ?? "",
      firstName: user.first_name ?? "",
      lastName: user.last_name ?? "",
      isSuperuser: Boolean(user.is_superuser),
      canCreateLeagues: Boolean(user.can_create_leagues),
      profileCompleted: Boolean(user.profile_completed_at),
      availabilityCompleted: Boolean(user.availability_completed_at),
      createdAt: user.created_at,
      leagueCount: userMemberships.length,
      adminLeagueCount: userMemberships.filter(
        (membership) => membership.role === "creator" || membership.role === "admin",
      ).length,
      leagueNames: userMemberships
        .map((membership) => leagueNameById.get(String(membership.league_id)))
        .filter((name): name is string => Boolean(name)),
      ownedLeagueNames,
    }
  })

  return NextResponse.json({
    currentUserId: authResult.actor.user.id,
    items,
  })
}
