import { supabase } from "@/lib/supabase"
import type { ActivityEventType } from "@/lib/activity"

export type ActivityDeliveryMode = "activity_only" | "personal" | "notify"

export type LeagueActivitySettings = Partial<Record<ActivityEventType, ActivityDeliveryMode>>

export const activityEventTypes: ActivityEventType[] = [
  "match_scheduled",
  "match_schedule_updated",
  "match_postponed",
  "match_result_saved",
  "match_result_updated",
  "match_result_cleared",
  "court_booking_updated",
  "court_booking_cleared",
  "court_booking_payment_paid",
  "league_created",
  "league_updated",
  "league_logo_updated",
  "league_locations_updated",
  "league_invite_regenerated",
  "season_finished",
  "season_created",
  "player_name_updated",
  "player_avatar_updated",
  "player_role_updated",
  "player_unlinked",
  "user_updated",
]

export const defaultLeagueActivitySettings: Record<ActivityEventType, ActivityDeliveryMode> = {
  match_scheduled: "personal",
  match_schedule_updated: "personal",
  match_postponed: "personal",
  match_result_saved: "personal",
  match_result_updated: "personal",
  match_result_cleared: "personal",
  court_booking_updated: "personal",
  court_booking_cleared: "personal",
  court_booking_payment_paid: "personal",
  league_created: "activity_only",
  league_updated: "activity_only",
  league_logo_updated: "activity_only",
  league_locations_updated: "activity_only",
  league_invite_regenerated: "activity_only",
  season_finished: "notify",
  season_created: "notify",
  player_name_updated: "personal",
  player_avatar_updated: "personal",
  player_role_updated: "personal",
  player_unlinked: "personal",
  user_updated: "personal",
}

function isActivityDeliveryMode(value: unknown): value is ActivityDeliveryMode {
  return value === "activity_only" || value === "personal" || value === "notify"
}

function normalizeSettings(value: unknown): LeagueActivitySettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  const rawSettings = value as Record<string, unknown>
  const settings: LeagueActivitySettings = {}

  activityEventTypes.forEach((eventType) => {
    const mode = rawSettings[eventType]

    if (isActivityDeliveryMode(mode)) {
      settings[eventType] = mode
    }
  })

  return settings
}

export function getActivityDeliveryMode(
  settings: LeagueActivitySettings,
  eventType: ActivityEventType
): ActivityDeliveryMode {
  return settings[eventType] ?? defaultLeagueActivitySettings[eventType]
}

export function mergeWithDefaultActivitySettings(
  settings: LeagueActivitySettings
): Record<ActivityEventType, ActivityDeliveryMode> {
  return activityEventTypes.reduce((nextSettings, eventType) => {
    nextSettings[eventType] = getActivityDeliveryMode(settings, eventType)
    return nextSettings
  }, {} as Record<ActivityEventType, ActivityDeliveryMode>)
}

export async function fetchLeagueActivitySettings(leagueId: string) {
  const { data, error } = await supabase
    .from("leagues")
    .select("activity_settings")
    .eq("id", leagueId)
    .single()

  if (error) {
    throw error
  }

  return normalizeSettings(data?.activity_settings)
}

export async function updateLeagueActivitySettings({
  leagueId,
  settings,
}: {
  leagueId: string
  settings: LeagueActivitySettings
}) {
  const safeSettings = mergeWithDefaultActivitySettings(settings)

  const { data, error } = await supabase
    .from("leagues")
    .update({ activity_settings: safeSettings })
    .eq("id", leagueId)
    .select("activity_settings")
    .single()

  if (error) {
    throw error
  }

  return normalizeSettings(data?.activity_settings)
}
