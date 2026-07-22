import type { ActivityEventType } from "@/lib/activity";

export type NotificationPreferenceKey =
  | "next_match"
  | "my_match_result"
  | "round_events"
  | "season_events"
  | "booking_i_owe"
  | "booking_paid_to_me"
  | "player_account";

export type NotificationPreferences = Record<
  NotificationPreferenceKey,
  boolean
>;

export type NotificationPreferenceDefinition = {
  key: NotificationPreferenceKey;
  eventTypes: ActivityEventType[];
};

export const alwaysEnabledNotificationEventTypes: ActivityEventType[] = [
  "court_booking_payment_reminder",
  "season_registration_payment_reminder",
];

export const notificationPreferenceDefinitions: NotificationPreferenceDefinition[] =
  [
    {
      key: "next_match",
      eventTypes: [
        "match_scheduled",
        "match_schedule_updated",
        "match_postponed",
        "match_incident_reported",
        "match_incident_resolved",
        "match_incident_cleared",
        "match_upcoming_reminder",
      ],
    },
    {
      key: "my_match_result",
      eventTypes: [
        "match_result_saved",
        "match_result_updated",
        "match_result_disputed",
        "match_result_cleared",
        "match_result_missing_reminder",
        "match_result_confirmation_reminder",
        "match_mvp_vote_reminder",
        "match_mvp_awarded",
      ],
    },
    {
      key: "round_events",
      eventTypes: ["round_in_play", "round_mvp_awarded"],
    },
    {
      key: "season_events",
      eventTypes: [
        "season_created",
        "season_duplicated",
        "season_started",
        "season_finished",
        "season_player_joined",
        "season_player_left",
        "league_announcement_published",
      ],
    },
    {
      key: "booking_i_owe",
      eventTypes: ["court_booking_updated", "court_booking_cleared"],
    },
    {
      key: "booking_paid_to_me",
      eventTypes: ["court_booking_payment_paid"],
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
  ];

export const notificationPreferenceKeys = notificationPreferenceDefinitions.map(
  (definition) => definition.key,
);

export const defaultNotificationPreferences = notificationPreferenceKeys.reduce(
  (preferences, key) => {
    preferences[key] = true;
    return preferences;
  },
  {} as NotificationPreferences,
);

export function normalizeNotificationPreferences(
  value: unknown,
): NotificationPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...defaultNotificationPreferences };
  }

  const rawPreferences = value as Record<string, unknown>;

  return notificationPreferenceKeys.reduce((preferences, key) => {
    preferences[key] =
      typeof rawPreferences[key] === "boolean"
        ? rawPreferences[key]
        : defaultNotificationPreferences[key];
    return preferences;
  }, {} as NotificationPreferences);
}

export function isAlwaysEnabledNotificationEvent(eventType: ActivityEventType) {
  return alwaysEnabledNotificationEventTypes.includes(eventType);
}

export function getNotificationPreferenceKeyForEvent(
  eventType: ActivityEventType,
): NotificationPreferenceKey | null {
  return (
    notificationPreferenceDefinitions.find((definition) =>
      definition.eventTypes.includes(eventType),
    )?.key ?? null
  );
}
