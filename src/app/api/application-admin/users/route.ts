import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  if (!authResult.actor.user.isSuperuser) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { supabase } = authResult.actor
  const [
    usersResult,
    membershipsResult,
    spectatorsResult,
    leaguesResult,
    seasonsResult,
    pushSubscriptionsResult,
    notificationPreferencesResult,
    auditResult,
  ] = await Promise.all([
    supabase
      .from("app_users")
      .select(
        "id,email,display_name,first_name,last_name,is_superuser,can_create_leagues,profile_completed_at,availability_completed_at,created_at,suspended_at,suspension_reason",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("league_memberships")
      .select("user_id,league_id,player_id,role"),
    supabase
      .from("league_spectators")
      .select("user_id,league_id"),
    supabase
      .from("leagues")
      .select("id,name,created_by_user_id,active_season_id"),
    supabase
      .from("seasons")
      .select("id,status"),
    supabase
      .from("push_subscriptions")
      .select("user_email,enabled"),
    supabase
      .from("notification_preferences")
      .select("user_email"),
    supabase
      .from("application_admin_audit_log")
      .select("id,actor_email,target_email,league_id,action,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(80),
  ])

  if (
    usersResult.error ||
    membershipsResult.error ||
    spectatorsResult.error ||
    leaguesResult.error ||
    seasonsResult.error ||
    pushSubscriptionsResult.error ||
    notificationPreferencesResult.error ||
    auditResult.error
  ) {
    return NextResponse.json({ error: "application_users_lookup_failed" }, { status: 500 })
  }

  const users = usersResult.data ?? []
  const memberships = membershipsResult.data ?? []
  const spectators = spectatorsResult.data ?? []
  const leagues = leaguesResult.data ?? []
  const seasons = seasonsResult.data ?? []
  const pushSubscriptions = pushSubscriptionsResult.data ?? []
  const notificationPreferences = notificationPreferencesResult.data ?? []
  const leagueNameById = new Map(
    leagues.map((league) => [String(league.id), String(league.name ?? "Liga")]),
  )

  const pushCountsByEmail = new Map<string, { total: number; enabled: number }>()
  for (const subscription of pushSubscriptions) {
    const email = normalizeEmail(subscription.user_email)
    if (!email) continue
    const current = pushCountsByEmail.get(email) ?? { total: 0, enabled: 0 }
    current.total += 1
    if (subscription.enabled !== false) current.enabled += 1
    pushCountsByEmail.set(email, current)
  }

  const notificationCountsByEmail = new Map<string, number>()
  for (const preference of notificationPreferences) {
    const email = normalizeEmail(preference.user_email)
    if (!email) continue
    notificationCountsByEmail.set(
      email,
      (notificationCountsByEmail.get(email) ?? 0) + 1,
    )
  }

  const items = users.map((user) => {
    const userMemberships = memberships.filter(
      (membership) => membership.user_id === user.id,
    )
    const userSpectators = spectators.filter(
      (spectator) => spectator.user_id === user.id,
    )
    const ownedLeagues = leagues.filter(
      (league) => league.created_by_user_id === user.id,
    )
    const email = normalizeEmail(user.email)
    const pushCounts = pushCountsByEmail.get(email) ?? { total: 0, enabled: 0 }

    const leagueAccesses = [
      ...userMemberships.map((membership) => ({
        leagueId: String(membership.league_id),
        leagueName:
          leagueNameById.get(String(membership.league_id)) ?? "Liga",
        playerId:
          typeof membership.player_id === "string" ? membership.player_id : null,
        role:
          membership.role === "creator" ||
          membership.role === "admin" ||
          membership.role === "player"
            ? membership.role
            : "player",
        isOwner: ownedLeagues.some(
          (league) => String(league.id) === String(membership.league_id),
        ),
      })),
      ...userSpectators
        .filter(
          (spectator) =>
            !userMemberships.some(
              (membership) => membership.league_id === spectator.league_id,
            ),
        )
        .map((spectator) => ({
          leagueId: String(spectator.league_id),
          leagueName:
            leagueNameById.get(String(spectator.league_id)) ?? "Liga",
          playerId: null,
          role: "spectator" as const,
          isOwner: false,
        })),
    ].sort((left, right) => left.leagueName.localeCompare(right.leagueName, "es"))

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
      suspendedAt: user.suspended_at ?? null,
      suspensionReason: user.suspension_reason ?? null,
      leagueCount: userMemberships.length,
      spectatorLeagueCount: userSpectators.length,
      adminLeagueCount: userMemberships.filter(
        (membership) => membership.role === "creator" || membership.role === "admin",
      ).length,
      ownedLeagueCount: ownedLeagues.length,
      leagueNames: leagueAccesses.map((access) => access.leagueName),
      ownedLeagueNames: ownedLeagues.map((league) => String(league.name ?? "Liga")),
      leagueAccesses,
      pushSubscriptionCount: pushCounts.total,
      enabledPushSubscriptionCount: pushCounts.enabled,
      notificationPreferenceCount: notificationCountsByEmail.get(email) ?? 0,
    }
  })

  const summary = {
    userCount: users.length,
    activeUserCount: users.filter((user) => !user.suspended_at).length,
    suspendedUserCount: users.filter((user) => Boolean(user.suspended_at)).length,
    leagueCount: leagues.length,
    activeSeasonCount: seasons.filter((season) => season.status === "active").length,
    incompleteProfileCount: users.filter((user) => !user.profile_completed_at).length,
    incompleteAvailabilityCount: users.filter(
      (user) => !user.availability_completed_at,
    ).length,
    activePushSubscriptionCount: pushSubscriptions.filter(
      (subscription) => subscription.enabled !== false,
    ).length,
  }

  const auditItems = (auditResult.data ?? []).map((item) => ({
    id: item.id,
    actorEmail: item.actor_email,
    targetEmail: item.target_email ?? null,
    leagueId: item.league_id ?? null,
    leagueName:
      (item.metadata &&
      typeof item.metadata === "object" &&
      !Array.isArray(item.metadata) &&
      typeof (item.metadata as Record<string, unknown>).leagueName === "string"
        ? String((item.metadata as Record<string, unknown>).leagueName)
        : item.league_id
          ? leagueNameById.get(String(item.league_id)) ?? null
          : null),
    action: item.action,
    metadata:
      item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
        ? item.metadata
        : {},
    createdAt: item.created_at,
  }))

  return NextResponse.json({
    currentUserId: authResult.actor.user.id,
    summary,
    items,
    auditItems,
  })
}
