import { supabase } from "@/lib/supabase";
import type { ActivityEventType } from "@/lib/activity";
import {
  alwaysEnabledNotificationEventTypes,
  isAlwaysEnabledNotificationEvent,
} from "@/lib/notificationSettings";

export type ActivityDeliveryMode = "activity_only" | "personal" | "notify";
export type ActivityEventCategory =
  "match" | "court" | "season" | "league" | "player";
export type ActivityPersonalScope =
  "match_participants" | "target_player" | "league_wide" | "admin_only";

export type ActivityEventDefinition = {
  category: ActivityEventCategory;
  defaultMode: ActivityDeliveryMode;
  personalScope: ActivityPersonalScope;
  pushReady: boolean;
};

export type LeagueActivitySettings = Partial<
  Record<ActivityEventType, ActivityDeliveryMode>
>;

export const activityEventDefinitions: Record<
  ActivityEventType,
  ActivityEventDefinition
> = {
  match_scheduled: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  match_schedule_updated: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  match_postponed: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  match_result_saved: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  match_result_updated: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  match_result_disputed: {
    category: "match",
    defaultMode: "notify",
    personalScope: "target_player",
    pushReady: true,
  },
  match_result_cleared: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  match_result_missing_reminder: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  match_result_confirmation_reminder: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  match_mvp_vote_reminder: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  match_mvp_awarded: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  match_upcoming_reminder: {
    category: "match",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  round_in_play: {
    category: "match",
    defaultMode: "notify",
    personalScope: "league_wide",
    pushReady: true,
  },
  round_mvp_awarded: {
    category: "season",
    defaultMode: "notify",
    personalScope: "league_wide",
    pushReady: true,
  },
  court_booking_updated: {
    category: "court",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  court_booking_cleared: {
    category: "court",
    defaultMode: "personal",
    personalScope: "match_participants",
    pushReady: true,
  },
  court_booking_payment_paid: {
    category: "court",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  court_booking_payment_reminder: {
    category: "court",
    defaultMode: "notify",
    personalScope: "match_participants",
    pushReady: true,
  },
  season_registration_payment_reminder: {
    category: "season",
    defaultMode: "notify",
    personalScope: "target_player",
    pushReady: true,
  },
  league_created: {
    category: "league",
    defaultMode: "activity_only",
    personalScope: "league_wide",
    pushReady: false,
  },
  league_updated: {
    category: "league",
    defaultMode: "activity_only",
    personalScope: "league_wide",
    pushReady: false,
  },
  league_logo_updated: {
    category: "league",
    defaultMode: "activity_only",
    personalScope: "league_wide",
    pushReady: false,
  },
  league_locations_updated: {
    category: "league",
    defaultMode: "activity_only",
    personalScope: "league_wide",
    pushReady: false,
  },
  league_invite_regenerated: {
    category: "league",
    defaultMode: "activity_only",
    personalScope: "admin_only",
    pushReady: false,
  },
  season_finished: {
    category: "season",
    defaultMode: "notify",
    personalScope: "league_wide",
    pushReady: true,
  },
  season_created: {
    category: "season",
    defaultMode: "notify",
    personalScope: "league_wide",
    pushReady: true,
  },
  season_started: {
    category: "season",
    defaultMode: "notify",
    personalScope: "league_wide",
    pushReady: true,
  },
  player_name_updated: {
    category: "player",
    defaultMode: "personal",
    personalScope: "target_player",
    pushReady: true,
  },
  player_avatar_updated: {
    category: "player",
    defaultMode: "personal",
    personalScope: "target_player",
    pushReady: true,
  },
  player_role_updated: {
    category: "player",
    defaultMode: "personal",
    personalScope: "target_player",
    pushReady: true,
  },
  player_unlinked: {
    category: "player",
    defaultMode: "notify",
    personalScope: "target_player",
    pushReady: true,
  },
  user_updated: {
    category: "player",
    defaultMode: "personal",
    personalScope: "target_player",
    pushReady: true,
  },
};

export const activityEventTypes = Object.keys(
  activityEventDefinitions,
) as ActivityEventType[];

export const configurableNotificationEventTypes = activityEventTypes.filter(
  (eventType) =>
    activityEventDefinitions[eventType].pushReady &&
    !alwaysEnabledNotificationEventTypes.includes(eventType),
);

export const activityEventCategories: ActivityEventCategory[] = [
  "match",
  "court",
  "season",
  "league",
  "player",
];

export const defaultLeagueActivitySettings: Record<
  ActivityEventType,
  ActivityDeliveryMode
> = activityEventTypes.reduce(
  (settings, eventType) => {
    settings[eventType] = activityEventDefinitions[eventType].defaultMode;
    return settings;
  },
  {} as Record<ActivityEventType, ActivityDeliveryMode>,
);

function isActivityDeliveryMode(value: unknown): value is ActivityDeliveryMode {
  return (
    value === "activity_only" || value === "personal" || value === "notify"
  );
}

export function normalizeLeagueActivitySettings(
  value: unknown,
): LeagueActivitySettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const rawSettings = value as Record<string, unknown>;
  const settings: LeagueActivitySettings = {};

  activityEventTypes.forEach((eventType) => {
    const mode = rawSettings[eventType];

    if (isActivityDeliveryMode(mode)) {
      settings[eventType] = mode;
    }
  });

  return settings;
}

export function getActivityEventDefinition(eventType: ActivityEventType) {
  return activityEventDefinitions[eventType];
}

export function getActivityDeliveryMode(
  settings: LeagueActivitySettings,
  eventType: ActivityEventType,
): ActivityDeliveryMode {
  if (isAlwaysEnabledNotificationEvent(eventType)) {
    return "notify";
  }

  return settings[eventType] ?? defaultLeagueActivitySettings[eventType];
}

export function mergeWithDefaultActivitySettings(
  settings: LeagueActivitySettings,
): Record<ActivityEventType, ActivityDeliveryMode> {
  return activityEventTypes.reduce(
    (nextSettings, eventType) => {
      nextSettings[eventType] = getActivityDeliveryMode(settings, eventType);
      return nextSettings;
    },
    {} as Record<ActivityEventType, ActivityDeliveryMode>,
  );
}

export async function fetchLeagueActivitySettings(leagueId: string) {
  const { data, error } = await supabase
    .from("leagues")
    .select("activity_settings")
    .eq("id", leagueId)
    .single();

  if (error) {
    throw error;
  }

  return normalizeLeagueActivitySettings(data?.activity_settings);
}

export async function updateLeagueActivitySettings({
  leagueId,
  settings,
}: {
  leagueId: string;
  settings: LeagueActivitySettings;
}) {
  const safeSettings = mergeWithDefaultActivitySettings(settings);

  const { data, error } = await supabase
    .from("leagues")
    .update({ activity_settings: safeSettings })
    .eq("id", leagueId)
    .select("activity_settings")
    .single();

  if (error) {
    throw error;
  }

  return normalizeLeagueActivitySettings(data?.activity_settings);
}
