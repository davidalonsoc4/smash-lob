import { supabase } from "@/lib/supabase";
import {
  generateBalancedCalendar,
  generateManualCalendar,
  getSeasonScheduleRoundCount,
  getNewPlayerIndexFromToken,
  resolveManualCalendarDraft,
  type ManualCalendarMatchDraft,
  type SeasonScheduleMode,
} from "@/lib/calendar";
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches";
import { buildSeasonRegistrationFee } from "@/lib/seasonRegistration";
import { upsertAppUser } from "@/lib/supabaseUsers";
import type {
  RoundWindowMode,
  SeasonRoundSettings,
  SeasonSnapshot,
} from "@/context/SeasonSettingsProvider";
import type {
  PlayerProfile,
  Season,
  SeasonPlayer,
  UserLeagueMembership,
} from "@/data/fakeData";
import type { MatchData } from "@/context/MatchDataProvider";

const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSupabaseBackedId(id: string) {
  return supabaseUuidPattern.test(id);
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "JG"
  );
}

function slug(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "jugador"
  );
}

function toSeasonStatus(status: unknown): "upcoming" | "active" | "finished" {
  if (status === "finished") return "finished";
  if (status === "upcoming") return "upcoming";
  return "active";
}

function mapSeason(row: {
  id: string;
  league_id: string;
  name: string;
  status: unknown;
  total_rounds: number;
  completed_rounds: number;
}): Season {
  return {
    id: row.id,
    leagueId: row.league_id,
    name: row.name,
    status: toSeasonStatus(row.status),
    totalRounds: row.total_rounds,
    completedRounds: row.completed_rounds,
  };
}

function mapPlayer(row: {
  id: string;
  league_id: string;
  slug: string;
  display_name: string;
  avatar_initials: string;
  avatar_url?: string | null;
}): PlayerProfile {
  return {
    id: row.id,
    leagueId: row.league_id,
    slug: row.slug,
    displayName: row.display_name,
    avatarInitials: row.avatar_initials,
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
  };
}

export async function updateSupabaseSeasonRoundSettings(
  settings: SeasonRoundSettings,
) {
  const payload = {
    league_id: settings.leagueId,
    season_id: settings.seasonId,
    round_window_mode: settings.roundWindowMode,
    season_starts_at: settings.seasonStartsAt,
    round_window_days: settings.roundWindowDays,
    requires_three_sets: settings.requiresThreeSets,
    manual_active_round: settings.manualActiveRound,
    manual_completed_rounds: settings.manualCompletedRounds,
    registration_fee: settings.registrationFee,
    mvp_system: settings.mvpMode,
  };

  const { data, error } = await supabase
    .from("season_settings")
    .update(payload)
    .eq("season_id", settings.seasonId)
    .select("season_id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return;
  }

  const { error: insertError } = await supabase
    .from("season_settings")
    .insert(payload);

  if (insertError) {
    throw insertError;
  }
}

export async function finishSupabaseActiveSeason({
  leagueId,
  seasonId,
}: {
  leagueId: string;
  seasonId: string;
}): Promise<SeasonSnapshot> {
  const { data: currentSeason, error: currentSeasonError } = await supabase
    .from("seasons")
    .select("total_rounds")
    .eq("id", seasonId)
    .single();

  if (currentSeasonError) {
    throw currentSeasonError;
  }

  const { data: season, error } = await supabase
    .from("seasons")
    .update({
      status: "finished",
      completed_rounds: currentSeason.total_rounds,
    })
    .eq("id", seasonId)
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single();

  if (error) {
    throw error;
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: null })
    .eq("id", leagueId);

  if (leagueUpdateError) {
    throw leagueUpdateError;
  }

  return {
    seasons: [mapSeason(season)],
    playerProfiles: [],
    seasonPlayers: [],
    seasonSettings: [],
    activeSeasonIds: {
      [leagueId]: "",
    },
  };
}

export async function startSupabaseExistingSeason({
  leagueId,
  seasonId,
}: {
  leagueId: string;
  seasonId: string;
}): Promise<SeasonSnapshot> {
  const { error: finishOtherActiveError } = await supabase
    .from("seasons")
    .update({ status: "finished" })
    .eq("league_id", leagueId)
    .eq("status", "active")
    .neq("id", seasonId);

  if (finishOtherActiveError) {
    throw finishOtherActiveError;
  }

  const { data: season, error } = await supabase
    .from("seasons")
    .update({ status: "active" })
    .eq("id", seasonId)
    .eq("league_id", leagueId)
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single();

  if (error) {
    throw error;
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: seasonId })
    .eq("id", leagueId);

  if (leagueUpdateError) {
    throw leagueUpdateError;
  }

  return {
    seasons: [mapSeason(season)],
    playerProfiles: [],
    seasonPlayers: [],
    seasonSettings: [],
    activeSeasonIds: {
      [leagueId]: seasonId,
    },
  };
}

export async function deleteSupabaseSeason({
  leagueId,
  seasonId,
}: {
  leagueId: string;
  seasonId: string;
}): Promise<SeasonSnapshot> {
  const { error: matchesError } = await supabase
    .from("matches")
    .delete()
    .eq("season_id", seasonId);

  if (matchesError) {
    throw matchesError;
  }

  const { error: seasonPlayersError } = await supabase
    .from("season_players")
    .delete()
    .eq("season_id", seasonId);

  if (seasonPlayersError) {
    throw seasonPlayersError;
  }

  const { error: settingsError } = await supabase
    .from("season_settings")
    .delete()
    .eq("season_id", seasonId);

  if (settingsError) {
    throw settingsError;
  }

  const { error: seasonError } = await supabase
    .from("seasons")
    .delete()
    .eq("id", seasonId)
    .eq("league_id", leagueId);

  if (seasonError) {
    throw seasonError;
  }

  const { data: fallbackSeason, error: fallbackError } = await supabase
    .from("seasons")
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .eq("league_id", leagueId)
    .limit(1)
    .maybeSingle();

  if (fallbackError) {
    throw fallbackError;
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: fallbackSeason?.id ?? null })
    .eq("id", leagueId);

  if (leagueUpdateError) {
    throw leagueUpdateError;
  }

  return {
    seasons: fallbackSeason ? [mapSeason(fallbackSeason)] : [],
    playerProfiles: [],
    seasonPlayers: [],
    seasonSettings: [],
    activeSeasonIds: {
      [leagueId]: fallbackSeason?.id ?? "",
    },
  };
}

export async function deleteSupabaseRoundMatches({
  seasonId,
  round,
}: {
  seasonId: string;
  round: number;
}) {
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("season_id", seasonId)
    .eq("round", round);

  if (error) {
    throw error;
  }
}

export async function updateSupabaseSeasonRoundOrder({
  seasonId,
  roundOrder,
}: {
  seasonId: string;
  roundOrder: number[];
}) {
  const nextRoundByCurrentRound = new Map(
    roundOrder.map((round, index) => [round, index + 1]),
  );
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id,round")
    .eq("season_id", seasonId);

  if (error) {
    throw error;
  }

  const updates = (matches ?? [])
    .map((match) => ({
      id: match.id,
      round: nextRoundByCurrentRound.get(match.round),
    }))
    .filter(
      (match): match is { id: string; round: number } =>
        typeof match.id === "string" && typeof match.round === "number",
    );

  for (const match of updates) {
    const { error: updateError } = await supabase
      .from("matches")
      .update({ round: match.round })
      .eq("id", match.id);

    if (updateError) {
      throw updateError;
    }
  }
}

export async function startSupabaseSeason({
  leagueId,
  activeSeasonId,
  name,
  playerIds,
  newPlayerNames,
  roundWindowMode,
  seasonStartsAt,
  roundWindowDays,
  requiresThreeSets,
  mvpMode = "automatic",
  manualMatches,
  scheduleMode = "single",
  registrationFeeEnabled = false,
  registrationFeeAmount = 0,
  registrationFeePurpose = "",
  selfPlayerValue,
  currentUserEmail,
  currentUserDisplayName,
  currentUserAvatarUrl,
}: {
  leagueId: string;
  activeSeasonId: string | null;
  name: string;
  playerIds: string[];
  newPlayerNames: string[];
  roundWindowMode: RoundWindowMode;
  seasonStartsAt: string | null;
  roundWindowDays: number | null;
  requiresThreeSets: boolean;
  mvpMode?: SeasonRoundSettings["mvpMode"];
  manualMatches?: ManualCalendarMatchDraft[];
  scheduleMode?: SeasonScheduleMode;
  registrationFeeEnabled?: boolean;
  registrationFeeAmount?: number;
  registrationFeePurpose?: string;
  selfPlayerValue?: string | null;
  currentUserEmail?: string | null;
  currentUserDisplayName?: string | null;
  currentUserAvatarUrl?: string | null;
}): Promise<{
  matches: MatchData[];
  seasonSnapshot: SeasonSnapshot;
  linkedMembership: UserLeagueMembership | null;
}> {
  const uniquePlayerIds = Array.from(new Set(playerIds));
  const cleanNewPlayerNames = newPlayerNames
    .map((playerName) => playerName.trim())
    .filter(Boolean);
  const totalPlayers = uniquePlayerIds.length + cleanNewPlayerNames.length;
  const normalizedCurrentUserEmail =
    currentUserEmail?.trim().toLowerCase() || null;
  const currentUser = normalizedCurrentUserEmail
    ? await upsertAppUser({
        email: normalizedCurrentUserEmail,
        displayName: currentUserDisplayName,
        avatarUrl: currentUserAvatarUrl,
      })
    : null;
  const selectedNewPlayerIndex = selfPlayerValue
    ? getNewPlayerIndexFromToken(selfPlayerValue)
    : null;

  const shouldFinishCurrentSeason = Boolean(
    activeSeasonId && isSupabaseBackedId(activeSeasonId),
  );
  const { data: finishedSeason, error: finishError } = shouldFinishCurrentSeason
    ? await supabase
        .from("seasons")
        .update({ status: "finished" })
        .eq("id", activeSeasonId)
        .select("id,league_id,name,status,total_rounds,completed_rounds")
        .maybeSingle()
    : { data: null, error: null };

  if (finishError) {
    throw finishError;
  }

  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .insert({
      league_id: leagueId,
      name,
      status: "upcoming",
      total_rounds: getSeasonScheduleRoundCount({
        playerCount: totalPlayers,
        mode: scheduleMode,
      }),
      completed_rounds: 0,
    })
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .single();

  if (seasonError) {
    throw seasonError;
  }

  const { data: newPlayers, error: playersError } =
    cleanNewPlayerNames.length > 0
      ? await supabase
          .from("players")
          .insert(
            cleanNewPlayerNames.map((playerName, index) => ({
              league_id: leagueId,
              slug: `${slug(playerName)}-${Date.now()}-${index + 1}`,
              display_name: playerName,
              avatar_initials: initials(playerName),
              avatar_url:
                selectedNewPlayerIndex === index
                  ? (currentUser?.avatar_url ?? null)
                  : null,
            })),
          )
          .select("id,league_id,slug,display_name,avatar_initials,avatar_url")
      : { data: [], error: null };

  if (playersError) {
    throw playersError;
  }

  const finalPlayerIds = [
    ...uniquePlayerIds,
    ...(newPlayers ?? []).map((player) => player.id),
  ];
  const selectedSelfPlayerId = selfPlayerValue
    ? selectedNewPlayerIndex === null
      ? selfPlayerValue
      : ((newPlayers ?? [])[selectedNewPlayerIndex]?.id ?? null)
    : null;
  let linkedMembershipRole: UserLeagueMembership["role"] = "creator";

  if (currentUser && selectedSelfPlayerId) {
    if (currentUser.avatar_url) {
      await supabase
        .from("players")
        .update({ avatar_url: currentUser.avatar_url })
        .eq("id", selectedSelfPlayerId)
        .is("avatar_url", null);
    }

    const { data: existingMembership, error: existingMembershipError } =
      await supabase
        .from("league_memberships")
        .select("role")
        .eq("user_id", currentUser.id)
        .eq("league_id", leagueId)
        .maybeSingle();

    if (existingMembershipError) {
      throw existingMembershipError;
    }

    linkedMembershipRole = existingMembership?.role ?? "creator";

    const { error: membershipError } = await supabase
      .from("league_memberships")
      .upsert(
        {
          user_id: currentUser.id,
          league_id: leagueId,
          player_id: selectedSelfPlayerId,
          role: linkedMembershipRole,
        },
        { onConflict: "user_id,league_id" },
      );

    if (membershipError) {
      throw membershipError;
    }
  }

  if (finalPlayerIds.length > 0) {
    const { error: seasonPlayersError } = await supabase
      .from("season_players")
      .insert(
        finalPlayerIds.map((playerId) => ({
          season_id: season.id,
          player_id: playerId,
        })),
      );

    if (seasonPlayersError) {
      throw seasonPlayersError;
    }
  }

  const resolvedManualMatches = manualMatches
    ? resolveManualCalendarDraft({
        matches: manualMatches,
        newPlayerIds: (newPlayers ?? []).map((player) => player.id),
      })
    : [];
  const seasonMatches =
    resolvedManualMatches.length > 0
      ? generateManualCalendar({
          leagueId,
          seasonId: season.id,
          matches: resolvedManualMatches,
          scheduleMode,
        })
      : generateBalancedCalendar({
          leagueId,
          seasonId: season.id,
          playerIds: finalPlayerIds,
          scheduleMode,
        });

  const { data: matchesData, error: matchesError } =
    seasonMatches.length > 0
      ? await supabase
          .from("matches")
          .insert(
            seasonMatches.map((match) => ({
              league_id: match.leagueId,
              season_id: match.seasonId,
              round: match.round,
              status: match.status,
              team_a: match.teamA,
              team_b: match.teamB,
              points_a: match.pointsA,
              points_b: match.pointsB,
              sets: match.sets,
              scheduled_at: match.scheduledAt,
              date_label: match.dateLabel,
              location: match.location,
              result_recorded_at: match.resultRecordedAt,
            })),
          )
          .select(matchSelect)
      : { data: [], error: null };

  if (matchesError) {
    throw matchesError;
  }

  const { error: settingsError } = await supabase
    .from("season_settings")
    .insert({
      season_id: season.id,
      league_id: leagueId,
      round_window_mode: roundWindowMode,
      season_starts_at: seasonStartsAt,
      round_window_days: roundWindowDays,
      requires_three_sets: requiresThreeSets,
      manual_active_round: null,
      manual_completed_rounds: [],
      registration_fee: buildSeasonRegistrationFee({
        enabled: registrationFeeEnabled,
        amount: registrationFeeAmount,
        purpose: registrationFeePurpose,
        playerIds: finalPlayerIds,
      }),
      mvp_system: mvpMode,
    });

  if (settingsError) {
    throw settingsError;
  }

  const { error: leagueUpdateError } = await supabase
    .from("leagues")
    .update({ active_season_id: season.id })
    .eq("id", leagueId);

  if (leagueUpdateError) {
    throw leagueUpdateError;
  }

  const seasons: Season[] = [
    ...(finishedSeason ? [mapSeason(finishedSeason)] : []),
    mapSeason(season),
  ];
  const playerProfiles = (newPlayers ?? []).map(mapPlayer);
  const seasonPlayers: SeasonPlayer[] = finalPlayerIds.map((playerId) => ({
    seasonId: season.id,
    playerId,
  }));
  const seasonSettings: SeasonRoundSettings[] = [
    {
      leagueId,
      seasonId: season.id,
      roundWindowMode,
      seasonStartsAt,
      roundWindowDays,
      requiresThreeSets,
      manualActiveRound: null,
      manualCompletedRounds: [],
      registrationFee: buildSeasonRegistrationFee({
        enabled: registrationFeeEnabled,
        amount: registrationFeeAmount,
        purpose: registrationFeePurpose,
        playerIds: finalPlayerIds,
      }),
      mvpMode,
    },
  ];

  const linkedMembership: UserLeagueMembership | null =
    normalizedCurrentUserEmail && selectedSelfPlayerId
      ? {
          userId: normalizedCurrentUserEmail,
          leagueId,
          playerId: selectedSelfPlayerId,
          role: linkedMembershipRole,
        }
      : null;

  return {
    matches: (matchesData ?? []).map((match) => mapSupabaseMatch(match)),
    linkedMembership,
    seasonSnapshot: {
      seasons,
      playerProfiles,
      seasonPlayers,
      seasonSettings,
      activeSeasonIds: {
        [leagueId]: season.id,
      },
    },
  };
}
