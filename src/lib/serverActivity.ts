import "server-only"

import type { ServerLeagueViewer } from "@/lib/serverLeagueAccess"

type SupabaseClient = ServerLeagueViewer["supabase"]

type ActivityEventType =
  | "match_scheduled"
  | "match_schedule_updated"
  | "match_postponed"
  | "match_result_saved"
  | "match_result_updated"
  | "match_result_disputed"
  | "match_result_cleared"
  | "match_result_missing_reminder"
  | "match_result_confirmation_reminder"
  | "match_mvp_vote_reminder"
  | "match_mvp_awarded"
  | "match_upcoming_reminder"
  | "round_in_play"
  | "round_mvp_awarded"
  | "court_booking_updated"
  | "court_booking_cleared"
  | "court_booking_payment_paid"
  | "court_booking_payment_reminder"
  | "season_registration_payment_reminder"
  | "league_created"
  | "league_updated"
  | "league_logo_updated"
  | "league_locations_updated"
  | "league_invite_regenerated"
  | "season_finished"
  | "season_created"
  | "season_started"
  | "season_player_joined"
  | "season_player_left"
  | "player_name_updated"
  | "player_avatar_updated"
  | "player_role_updated"
  | "player_unlinked"
  | "user_updated"

type ActivityEvent = {
  id: string
  leagueId: string
  seasonId: string | null
  matchId: string | null
  actorUserId: string | null
  actorEmail: string
  actorDisplayName: string | null
  actorAvatarUrl: string | null
  actorAvatarInitials: string | null
  type: ActivityEventType
  title: string
  description: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

type LeagueActorProfile = {
  displayName: string | null
  avatarInitials: string | null
  avatarUrl: string | null
}

type AppActorProfile = {
  displayName: string | null
  avatarInitials: string | null
  avatarUrl: string | null
}

const activitySelect =
  "id,league_id,season_id,match_id,actor_user_id,actor_email,actor_display_name,type,title,description,metadata,created_at"

const superAdminEmails = new Set([
  "smashlobadmi@gmail.com",
  "smashlobadmin@gmail.com",
])

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function isSuperAdminEmail(email: string | null | undefined) {
  return superAdminEmails.has(normalizeEmail(email))
}

function toActivityEventType(value: unknown): ActivityEventType {
  const type = String(value)

  if (
    type === "match_scheduled" ||
    type === "match_schedule_updated" ||
    type === "match_postponed" ||
    type === "match_result_saved" ||
    type === "match_result_updated" ||
    type === "match_result_disputed" ||
    type === "match_result_cleared" ||
    type === "match_result_missing_reminder" ||
    type === "match_result_confirmation_reminder" ||
    type === "match_mvp_vote_reminder" ||
    type === "match_mvp_awarded" ||
    type === "match_upcoming_reminder" ||
    type === "round_in_play" ||
    type === "round_mvp_awarded" ||
    type === "court_booking_updated" ||
    type === "court_booking_cleared" ||
    type === "court_booking_payment_paid" ||
    type === "court_booking_payment_reminder" ||
    type === "season_registration_payment_reminder" ||
    type === "league_created" ||
    type === "league_updated" ||
    type === "league_logo_updated" ||
    type === "league_locations_updated" ||
    type === "league_invite_regenerated" ||
    type === "season_finished" ||
    type === "season_created" ||
    type === "season_started" ||
    type === "season_player_joined" ||
    type === "season_player_left" ||
    type === "player_name_updated" ||
    type === "player_avatar_updated" ||
    type === "player_role_updated" ||
    type === "player_unlinked" ||
    type === "user_updated"
  ) {
    return type
  }

  return "league_updated"
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

function mapActivityEvent(row: Record<string, unknown>): ActivityEvent {
  return {
    id: String(row.id),
    leagueId: String(row.league_id),
    seasonId: typeof row.season_id === "string" ? row.season_id : null,
    matchId: typeof row.match_id === "string" ? row.match_id : null,
    actorUserId:
      typeof row.actor_user_id === "string" ? row.actor_user_id : null,
    actorEmail: String(row.actor_email ?? ""),
    actorDisplayName:
      typeof row.actor_display_name === "string"
        ? row.actor_display_name
        : null,
    actorAvatarUrl:
      typeof row.actor_avatar_url === "string" ? row.actor_avatar_url : null,
    actorAvatarInitials:
      typeof row.actor_avatar_initials === "string"
        ? row.actor_avatar_initials
        : null,
    type: toActivityEventType(row.type),
    title: String(row.title ?? "Actividad"),
    description: typeof row.description === "string" ? row.description : null,
    metadata: toRecord(row.metadata),
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date().toISOString(),
  }
}

function applyLeagueActorProfile(
  event: ActivityEvent,
  profile: LeagueActorProfile | null
) {
  if (!profile) {
    return event
  }

  return {
    ...event,
    actorDisplayName: profile.displayName ?? event.actorDisplayName,
    actorAvatarUrl: profile.avatarUrl,
    actorAvatarInitials: profile.avatarInitials,
  }
}

function applyAppActorProfile(
  event: ActivityEvent,
  profile: AppActorProfile | null
) {
  if (!profile) {
    return event
  }

  return {
    ...event,
    actorDisplayName: profile.displayName ?? event.actorDisplayName,
    actorAvatarUrl: profile.avatarUrl ?? event.actorAvatarUrl,
    actorAvatarInitials: profile.avatarInitials ?? event.actorAvatarInitials,
  }
}

function applySuperAdminActorProfile(event: ActivityEvent) {
  if (!isSuperAdminEmail(event.actorEmail)) {
    return event
  }

  return {
    ...event,
    actorDisplayName: "Admin",
    actorAvatarUrl: null,
    actorAvatarInitials: "AD",
  }
}

async function fetchUsersByEmail(supabase: SupabaseClient, emails: string[]) {
  const cleanEmails = Array.from(
    new Set(emails.map(normalizeEmail).filter(Boolean))
  )

  if (cleanEmails.length === 0) {
    return new Map<string, string>()
  }

  const { data, error } = await supabase
    .from("app_users")
    .select("id,email")
    .in("email", cleanEmails)

  if (error) {
    throw error
  }

  const rows = (data ?? []) as Record<string, unknown>[]

  return new Map(
    rows
      .filter(
        (user) => typeof user.id === "string" && typeof user.email === "string"
      )
      .map((user) => [normalizeEmail(user.email as string), user.id as string])
  )
}

async function fetchAppActorProfiles(
  supabase: SupabaseClient,
  userIds: string[]
) {
  const cleanUserIds = Array.from(new Set(userIds.filter(Boolean)))

  if (cleanUserIds.length === 0) {
    return new Map<string, AppActorProfile>()
  }

  const { data, error } = await supabase
    .from("app_users")
    .select("id,email,display_name,avatar_url")
    .in("id", cleanUserIds)

  if (error) {
    throw error
  }

  const rows = (data ?? []) as Record<string, unknown>[]

  return new Map<string, AppActorProfile>(
    rows
      .filter((user) => typeof user.id === "string")
      .map((user) => {
        const email = typeof user.email === "string" ? user.email : null
        const isAdmin = isSuperAdminEmail(email)

        return [
          user.id as string,
          {
            displayName: isAdmin
              ? "Admin"
              : typeof user.display_name === "string"
                ? user.display_name
                : null,
            avatarInitials: isAdmin ? "AD" : null,
            avatarUrl:
              !isAdmin && typeof user.avatar_url === "string"
                ? user.avatar_url
                : null,
          },
        ] as const
      })
  )
}

async function fetchLeagueActorProfiles({
  supabase,
  leagueId,
  userIds,
}: {
  supabase: SupabaseClient
  leagueId: string
  userIds: string[]
}) {
  const cleanUserIds = Array.from(new Set(userIds.filter(Boolean)))

  if (cleanUserIds.length === 0) {
    return new Map<string, LeagueActorProfile>()
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("league_memberships")
    .select("user_id,player_id")
    .eq("league_id", leagueId)
    .in("user_id", cleanUserIds)

  if (membershipsError) {
    throw membershipsError
  }

  const membershipRows = (memberships ?? []) as Record<string, unknown>[]
  const playerIds = Array.from(
    new Set(
      membershipRows
        .map((membership) => membership.player_id)
        .filter((playerId): playerId is string => typeof playerId === "string")
    )
  )

  if (playerIds.length === 0) {
    return new Map<string, LeagueActorProfile>()
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id,display_name,avatar_initials,avatar_url")
    .in("id", playerIds)

  if (playersError) {
    throw playersError
  }

  const playerRows = (players ?? []) as Record<string, unknown>[]
  const playerById = new Map<string, LeagueActorProfile>(
    playerRows
      .filter((player) => typeof player.id === "string")
      .map((player) => [
        player.id as string,
        {
          displayName:
            typeof player.display_name === "string"
              ? player.display_name
              : null,
          avatarInitials:
            typeof player.avatar_initials === "string"
              ? player.avatar_initials
              : null,
          avatarUrl:
            typeof player.avatar_url === "string" ? player.avatar_url : null,
        },
      ])
  )

  const profileByUserId = new Map<string, LeagueActorProfile>()

  membershipRows.forEach((membership) => {
    if (
      typeof membership.user_id !== "string" ||
      typeof membership.player_id !== "string"
    ) {
      return
    }

    const player = playerById.get(membership.player_id)

    if (player) {
      profileByUserId.set(membership.user_id, player)
    }
  })

  return profileByUserId
}

function resolveEffectiveCreatedAtFrom({
  viewer,
  createdAtFrom,
  clampToViewerJoinDate,
}: {
  viewer: ServerLeagueViewer
  createdAtFrom: string | null
  clampToViewerJoinDate: boolean
}) {
  let effectiveCreatedAtFrom = createdAtFrom?.trim() || null

  if (!clampToViewerJoinDate) {
    return effectiveCreatedAtFrom
  }

  const joinedAt = viewer.membership?.joinedAt ?? viewer.spectatorJoinedAt

  if (!joinedAt) {
    return effectiveCreatedAtFrom
  }

  if (!effectiveCreatedAtFrom || joinedAt > effectiveCreatedAtFrom) {
    effectiveCreatedAtFrom = joinedAt
  }

  return effectiveCreatedAtFrom
}

export async function fetchServerActivityEvents({
  viewer,
  leagueId,
  limit = 50,
  createdAtFrom = null,
  clampToViewerJoinDate = false,
}: {
  viewer: ServerLeagueViewer
  leagueId: string
  limit?: number
  createdAtFrom?: string | null
  clampToViewerJoinDate?: boolean
}) {
  const effectiveCreatedAtFrom = resolveEffectiveCreatedAtFrom({
    viewer,
    createdAtFrom,
    clampToViewerJoinDate,
  })
  let query = viewer.supabase
    .from("activity_events")
    .select(activitySelect)
    .eq("league_id", leagueId)

  if (effectiveCreatedAtFrom) {
    query = query.gte("created_at", effectiveCreatedAtFrom)
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  const events = (data ?? []).map((item) =>
    mapActivityEvent(item as Record<string, unknown>)
  )
  const usersByEmail = await fetchUsersByEmail(
    viewer.supabase,
    events
      .filter((event) => !event.actorUserId)
      .map((event) => event.actorEmail)
  )
  const actorUserIds = Array.from(
    new Set(
      events
        .map(
          (event) =>
            event.actorUserId ??
            usersByEmail.get(normalizeEmail(event.actorEmail))
        )
        .filter((actorUserId): actorUserId is string => Boolean(actorUserId))
    )
  )

  const [appProfilesByUserId, leagueProfilesByUserId] = await Promise.all([
    fetchAppActorProfiles(viewer.supabase, actorUserIds),
    fetchLeagueActorProfiles({
      supabase: viewer.supabase,
      leagueId,
      userIds: actorUserIds,
    }),
  ])

  return events.map((event) => {
    const actorUserId =
      event.actorUserId ??
      usersByEmail.get(normalizeEmail(event.actorEmail)) ??
      null

    if (isSuperAdminEmail(event.actorEmail)) {
      return applySuperAdminActorProfile(event)
    }

    const withAppProfile = applyAppActorProfile(
      event,
      actorUserId ? (appProfilesByUserId.get(actorUserId) ?? null) : null
    )

    return applyLeagueActorProfile(
      withAppProfile,
      actorUserId ? (leagueProfilesByUserId.get(actorUserId) ?? null) : null
    )
  })
}
