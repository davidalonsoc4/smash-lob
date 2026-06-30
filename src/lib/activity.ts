import { supabase } from "@/lib/supabase"
import { upsertAppUser } from "@/lib/supabaseUsers"

export type ActivityEventType =
  | "match_scheduled"
  | "match_schedule_updated"
  | "match_postponed"
  | "match_result_saved"
  | "match_result_updated"
  | "match_result_cleared"
  | "court_booking_updated"
  | "court_booking_cleared"
  | "court_booking_payment_paid"
  | "league_created"
  | "league_updated"
  | "season_created"
  | "user_updated"

export type ActivityEvent = {
  id: string
  leagueId: string
  seasonId: string | null
  matchId: string | null
  actorEmail: string
  actorDisplayName: string | null
  type: ActivityEventType
  title: string
  description: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

const activitySelect =
  "id,league_id,season_id,match_id,actor_email,actor_display_name,type,title,description,metadata,created_at"

function toActivityEventType(value: unknown): ActivityEventType {
  const type = String(value)

  if (
    type === "match_scheduled" ||
    type === "match_schedule_updated" ||
    type === "match_postponed" ||
    type === "match_result_saved" ||
    type === "match_result_updated" ||
    type === "match_result_cleared" ||
    type === "court_booking_updated" ||
    type === "court_booking_cleared" ||
    type === "court_booking_payment_paid" ||
    type === "league_created" ||
    type === "league_updated" ||
    type === "season_created" ||
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
    actorEmail: String(row.actor_email ?? ""),
    actorDisplayName:
      typeof row.actor_display_name === "string" ? row.actor_display_name : null,
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

export async function fetchSupabaseActivityEvents({
  leagueId,
  limit = 50,
}: {
  leagueId: string
  limit?: number
}) {
  const { data, error } = await supabase
    .from("activity_events")
    .select(activitySelect)
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return (data ?? []).map((item) =>
    mapActivityEvent(item as Record<string, unknown>)
  )
}

export async function recordActivityEvent({
  leagueId,
  seasonId,
  matchId,
  actorEmail,
  actorDisplayName,
  type,
  title,
  description,
  metadata = {},
}: {
  leagueId: string
  seasonId?: string | null
  matchId?: string | null
  actorEmail: string
  actorDisplayName?: string | null
  type: ActivityEventType
  title: string
  description?: string | null
  metadata?: Record<string, unknown>
}) {
  const normalizedActorEmail = actorEmail.trim().toLowerCase()

  if (!normalizedActorEmail) {
    return null
  }

  let actorUserId: string | null = null
  let safeActorDisplayName = actorDisplayName ?? normalizedActorEmail

  try {
    const actor = await upsertAppUser({
      email: normalizedActorEmail,
      displayName: actorDisplayName,
    })

    actorUserId = actor.id
    safeActorDisplayName = actor.display_name ?? safeActorDisplayName
  } catch {
    actorUserId = null
  }

  const { data, error } = await supabase
    .from("activity_events")
    .insert({
      league_id: leagueId,
      season_id: seasonId ?? null,
      match_id: matchId ?? null,
      actor_user_id: actorUserId,
      actor_email: normalizedActorEmail,
      actor_display_name: safeActorDisplayName,
      type,
      title,
      description: description ?? null,
      metadata,
    })
    .select(activitySelect)
    .single()

  if (error) {
    throw error
  }

  return mapActivityEvent(data as Record<string, unknown>)
}
