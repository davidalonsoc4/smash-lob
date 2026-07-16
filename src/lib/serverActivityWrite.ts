import "server-only"

import { dispatchPushForActivityEvent } from "@/lib/serverPushDispatch"
import type { ActivityEventType } from "@/lib/activity"
import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"

type SupabaseClient = ServerLeagueActor["supabase"]

type ActivityMetadata = Record<string, unknown>

type ActivityUser = {
  id: string
  email: string
  displayName: string | null
  isSuperuser: boolean
}

type ActivityMembership = {
  playerId: string | null
} | null

type PlayerNameMap = Map<string, string>

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

function toMetadata(value: ActivityMetadata | undefined) {
  return value ?? {}
}

export async function fetchLeaguePlayerNameMap({
  supabase,
  leagueId,
  playerIds,
}: {
  supabase: SupabaseClient
  leagueId: string
  playerIds: string[]
}): Promise<PlayerNameMap> {
  const cleanPlayerIds = Array.from(new Set(playerIds.filter(Boolean)))

  if (cleanPlayerIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from("players")
    .select("id,display_name")
    .eq("league_id", leagueId)
    .in("id", cleanPlayerIds)

  if (error) {
    throw error
  }

  return new Map(
    (data ?? [])
      .filter(
        (player) =>
          typeof player.id === "string" &&
          typeof player.display_name === "string"
      )
      .map((player) => [player.id as string, player.display_name as string])
  )
}

export async function insertServerActivityEvent({
  supabase,
  leagueId,
  seasonId = null,
  matchId = null,
  actorUserId = null,
  actorEmail,
  actorDisplayName,
  type,
  title,
  description = null,
  metadata,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId?: string | null
  matchId?: string | null
  actorUserId?: string | null
  actorEmail: string
  actorDisplayName: string | null
  type: ActivityEventType
  title: string
  description?: string | null
  metadata?: ActivityMetadata
}) {
  const { data, error } = await supabase
    .from("activity_events")
    .insert({
      league_id: leagueId,
      season_id: seasonId,
      match_id: matchId,
      actor_user_id: actorUserId,
      actor_email: normalizeEmail(actorEmail),
      actor_display_name: actorDisplayName,
      type,
      title,
      description,
      metadata: toMetadata(metadata),
    })
    .select("id")
    .single()

  if (error) {
    throw error
  }

  const eventId = String(data.id)

  await dispatchPushForActivityEvent(eventId).catch(() => null)

  return eventId
}

export async function recordServerActorActivity({
  supabase,
  user,
  membership,
  leagueId,
  seasonId = null,
  matchId = null,
  type,
  title,
  description = null,
  metadata,
}: {
  supabase: SupabaseClient
  user: ActivityUser
  membership: ActivityMembership
  leagueId: string
  seasonId?: string | null
  matchId?: string | null
  type: ActivityEventType
  title: string
  description?: string | null
  metadata?: ActivityMetadata
}) {
  const normalizedEmail = normalizeEmail(user.email)
  const isAdminActor = user.isSuperuser || isSuperAdminEmail(normalizedEmail)
  let actorDisplayName =
    isAdminActor ? "Admin" : user.displayName ?? normalizedEmail

  if (!isAdminActor && membership?.playerId) {
    const playerNameMap = await fetchLeaguePlayerNameMap({
      supabase,
      leagueId,
      playerIds: [membership.playerId],
    })

    actorDisplayName =
      playerNameMap.get(membership.playerId) ?? actorDisplayName
  }

  return insertServerActivityEvent({
    supabase,
    leagueId,
    seasonId,
    matchId,
    actorUserId: user.id,
    actorEmail: normalizedEmail,
    actorDisplayName,
    type,
    title,
    description,
    metadata,
  })
}

export async function recordServerSystemActivity({
  supabase,
  leagueId,
  seasonId = null,
  matchId = null,
  type,
  title,
  description = null,
  metadata,
  actorEmail = "system@smash-lob.local",
  actorDisplayName = "Smash & Lob",
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId?: string | null
  matchId?: string | null
  type: ActivityEventType
  title: string
  description?: string | null
  metadata?: ActivityMetadata
  actorEmail?: string
  actorDisplayName?: string
}) {
  return insertServerActivityEvent({
    supabase,
    leagueId,
    seasonId,
    matchId,
    actorUserId: null,
    actorEmail,
    actorDisplayName,
    type,
    title,
    description,
    metadata,
  })
}
