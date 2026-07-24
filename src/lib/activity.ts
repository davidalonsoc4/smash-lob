export type ActivityEventType =
  | "match_scheduled"
  | "match_schedule_updated"
  | "match_postponed"
  | "match_incident_reported"
  | "match_incident_resolved"
  | "match_incident_cleared"
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
  | "league_announcement_published"
  | "league_announcement_deleted"
  | "season_finished"
  | "season_created"
  | "season_duplicated"
  | "season_started"
  | "season_player_joined"
  | "season_player_left"
  | "player_name_updated"
  | "player_avatar_updated"
  | "player_role_updated"
  | "player_unlinked"
  | "user_updated";

export type ActivityEvent = {
  id: string;
  leagueId: string;
  seasonId: string | null;
  matchId: string | null;
  actorUserId: string | null;
  actorEmail: string;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  actorAvatarInitials: string | null;
  type: ActivityEventType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

const serverHandledActivityTypes = new Set<ActivityEventType>([
  "match_scheduled",
  "match_schedule_updated",
  "match_postponed",
  "match_incident_reported",
  "match_incident_resolved",
  "match_incident_cleared",
  "match_result_saved",
  "match_result_updated",
  "match_result_cleared",
  "match_result_disputed",
  "round_mvp_awarded",
  "court_booking_updated",
  "court_booking_cleared",
  "court_booking_payment_paid",
  "court_booking_payment_reminder",
  "league_invite_regenerated",
  "league_announcement_published",
  "league_announcement_deleted",
  "league_updated",
  "league_logo_updated",
  "league_locations_updated",
  "season_finished",
  "season_created",
  "season_duplicated",
  "season_started",
  "season_player_joined",
  "season_player_left",
  "player_name_updated",
  "player_avatar_updated",
  "player_role_updated",
  "player_unlinked",
  "match_mvp_awarded",
]);

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export async function fetchSupabaseActivityEvents({
  leagueId,
  limit = 50,
  createdAtFrom = null,
  clampToViewerJoinDate = false,
}: {
  leagueId: string;
  limit?: number;
  createdAtFrom?: string | null;
  clampToViewerJoinDate?: boolean;
}) {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (createdAtFrom) {
    params.set("createdAtFrom", createdAtFrom);
  }

  if (clampToViewerJoinDate) {
    params.set("clampToViewerJoinDate", "1");
  }

  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/activity?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`activity-api-${response.status}`);
  }

  const payload = (await response.json()) as {
    items?: ActivityEvent[];
  };

  return payload.items ?? [];
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
  leagueId: string;
  seasonId?: string | null;
  matchId?: string | null;
  actorEmail: string;
  actorDisplayName?: string | null;
  type: ActivityEventType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const normalizedActorEmail = normalizeEmail(actorEmail);

  if (!normalizedActorEmail) {
    return null;
  }

  if (
    type === "season_registration_payment_reminder" &&
    seasonId
  ) {
    const response = await fetch(
      `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/registration-reminder`,
      {
        method: "POST",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`season-registration-reminder-api-${response.status}`);
    }

    return null;
  }

  if (serverHandledActivityTypes.has(type)) {
    return null;
  }

  void matchId;
  void actorDisplayName;
  void title;
  void description;
  void metadata;

  return null;
}
