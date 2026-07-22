import type { ActivityEventType } from "@/lib/activity"

export type NotificationPreferenceKey =
  | "match_schedule"
  | "match_incidents"
  | "match_upcoming"
  | "match_results"
  | "result_confirmations"
  | "mvp_reminders"
  | "mvp_awards"
  | "round_events"
  | "season_lifecycle"
  | "season_roster"
  | "announcements"
  | "booking_updates"
  | "booking_payments"
  | "payment_reminders"
  | "player_account"

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>

export type NotificationPreferenceDefinition = {
  key: NotificationPreferenceKey
  eventTypes: ActivityEventType[]
}

export const alwaysEnabledNotificationEventTypes: ActivityEventType[] = []

export const notificationPreferenceDefinitions: NotificationPreferenceDefinition[] = [
  {
    key: "match_schedule",
    eventTypes: ["match_scheduled", "match_schedule_updated", "match_postponed"],
  },
  {
    key: "match_incidents",
    eventTypes: [
      "match_incident_reported",
      "match_incident_resolved",
      "match_incident_cleared",
    ],
  },
  { key: "match_upcoming", eventTypes: ["match_upcoming_reminder"] },
  {
    key: "match_results",
    eventTypes: [
      "match_result_saved",
      "match_result_updated",
      "match_result_disputed",
      "match_result_cleared",
      "match_result_missing_reminder",
    ],
  },
  {
    key: "result_confirmations",
    eventTypes: ["match_result_confirmation_reminder"],
  },
  { key: "mvp_reminders", eventTypes: ["match_mvp_vote_reminder"] },
  {
    key: "mvp_awards",
    eventTypes: ["match_mvp_awarded", "round_mvp_awarded"],
  },
  { key: "round_events", eventTypes: ["round_in_play"] },
  {
    key: "season_lifecycle",
    eventTypes: [
      "season_created",
      "season_duplicated",
      "season_started",
      "season_finished",
    ],
  },
  {
    key: "season_roster",
    eventTypes: ["season_player_joined", "season_player_left"],
  },
  { key: "announcements", eventTypes: ["league_announcement_published"] },
  {
    key: "booking_updates",
    eventTypes: ["court_booking_updated", "court_booking_cleared"],
  },
  {
    key: "booking_payments",
    eventTypes: ["court_booking_payment_paid"],
  },
  {
    key: "payment_reminders",
    eventTypes: [
      "court_booking_payment_reminder",
      "season_registration_payment_reminder",
    ],
  },
  {
    key: "player_account",
    eventTypes: [
      "player_name_updated",
      "player_avatar_updated",
      "player_role_updated",
      "player_unlinked",
      "user_updated",
    ],
  },
]

export const notificationPreferenceKeys = notificationPreferenceDefinitions.map(
  (definition) => definition.key,
)

export const defaultNotificationPreferences = notificationPreferenceKeys.reduce(
  (preferences, key) => {
    preferences[key] = true
    return preferences
  },
  {} as NotificationPreferences,
)

const legacyPreferenceFallbacks: Partial<
  Record<NotificationPreferenceKey, string[]>
> = {
  match_schedule: ["next_match"],
  match_incidents: ["next_match"],
  match_upcoming: ["next_match"],
  match_results: ["my_match_result"],
  result_confirmations: ["my_match_result"],
  mvp_reminders: ["my_match_result"],
  mvp_awards: ["my_match_result", "round_events"],
  round_events: ["round_events"],
  season_lifecycle: ["season_events"],
  season_roster: ["season_events"],
  announcements: ["season_events"],
  booking_updates: ["booking_i_owe"],
  booking_payments: ["booking_paid_to_me"],
  payment_reminders: ["booking_i_owe"],
  player_account: ["player_account"],
}

export function normalizeNotificationPreferences(
  value: unknown,
): NotificationPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...defaultNotificationPreferences }
  }

  const rawPreferences = value as Record<string, unknown>

  return notificationPreferenceKeys.reduce((preferences, key) => {
    if (typeof rawPreferences[key] === "boolean") {
      preferences[key] = rawPreferences[key]
      return preferences
    }

    const legacyValue = (legacyPreferenceFallbacks[key] ?? [])
      .map((legacyKey) => rawPreferences[legacyKey])
      .find((candidate): candidate is boolean => typeof candidate === "boolean")

    preferences[key] = legacyValue ?? defaultNotificationPreferences[key]
    return preferences
  }, {} as NotificationPreferences)
}

export function isAlwaysEnabledNotificationEvent(eventType: ActivityEventType) {
  return alwaysEnabledNotificationEventTypes.includes(eventType)
}

export function getNotificationPreferenceKeyForEvent(
  eventType: ActivityEventType,
): NotificationPreferenceKey | null {
  return (
    notificationPreferenceDefinitions.find((definition) =>
      definition.eventTypes.includes(eventType),
    )?.key ?? null
  )
}
