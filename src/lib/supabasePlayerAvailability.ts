import { supabase } from "@/lib/supabase";
import { upsertAppUser } from "@/lib/supabaseUsers";
import {
  normalizeDateAvailabilityOverrides,
  normalizeWeeklyAvailability,
  type PlayerAvailability,
} from "@/lib/playerAvailability";

type PlayerAvailabilityRow = {
  league_id: string;
  season_id: string;
  player_id: string;
  user_id: string | null;
  timezone: string | null;
  weekly_slots: unknown;
  date_overrides: unknown;
  updated_at: string | null;
};

function mapPlayerAvailability(row: PlayerAvailabilityRow): PlayerAvailability {
  return {
    leagueId: row.league_id,
    seasonId: row.season_id,
    playerId: row.player_id,
    userId: row.user_id,
    timezone: row.timezone ?? "Europe/Madrid",
    weeklySlots: normalizeWeeklyAvailability(row.weekly_slots),
    dateOverrides: normalizeDateAvailabilityOverrides(row.date_overrides),
    updatedAt: row.updated_at,
  };
}

export async function fetchSupabasePlayerAvailability({
  leagueId,
  seasonId,
  playerId,
}: {
  leagueId: string;
  seasonId: string;
  playerId: string;
}) {
  const { data, error } = await supabase
    .from("player_availability")
    .select(
      "league_id,season_id,player_id,user_id,timezone,weekly_slots,date_overrides,updated_at",
    )
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPlayerAvailability(data) : null;
}

export async function fetchSupabasePlayerAvailabilities({
  leagueId,
  seasonId,
  playerIds,
}: {
  leagueId: string;
  seasonId: string;
  playerIds: string[];
}) {
  if (playerIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("player_availability")
    .select(
      "league_id,season_id,player_id,user_id,timezone,weekly_slots,date_overrides,updated_at",
    )
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .in("player_id", playerIds);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPlayerAvailability);
}

export async function upsertSupabasePlayerAvailability({
  availability,
  userEmail,
  displayName,
}: {
  availability: PlayerAvailability;
  userEmail: string;
  displayName?: string | null;
}) {
  const appUser = await upsertAppUser({
    email: userEmail,
    displayName,
  });

  const { data, error } = await supabase
    .from("player_availability")
    .upsert(
      {
        league_id: availability.leagueId,
        season_id: availability.seasonId,
        player_id: availability.playerId,
        user_id: appUser.id,
        timezone: availability.timezone,
        weekly_slots: normalizeWeeklyAvailability(availability.weeklySlots),
        date_overrides: normalizeDateAvailabilityOverrides(
          availability.dateOverrides,
        ),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "league_id,season_id,player_id" },
    )
    .select(
      "league_id,season_id,player_id,user_id,timezone,weekly_slots,date_overrides,updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapPlayerAvailability(data);
}
