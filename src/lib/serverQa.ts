import "server-only";

import { dispatchPushForActivityEvent } from "@/lib/serverPushDispatch";
import type { QaActionInput } from "@/lib/qaTypes";
import {
  getMatchMvpSelection,
  getRoundMvpSelection,
  type MvpVote,
} from "@/lib/mvp";
import type { ServerLeagueActor } from "@/lib/serverLeagueAccess";

type ServiceClient = ServerLeagueActor["supabase"];

type QaMatchRow = {
  id: string;
  league_id: string;
  season_id: string;
  round: number;
  status: string;
  team_a: string[] | null;
  team_b: string[] | null;
  points_a: number | null;
  points_b: number | null;
  sets: { a: number; b: number }[] | null;
  scheduled_at: string | null;
  date_label: string | null;
  location: string | null;
  result_recorded_at: string | null;
  result_reported_by_player_id: string | null;
  result_locked: boolean | null;
};

type QaPlayerRow = {
  id: string;
  league_id: string;
  display_name: string;
  avatar_initials: string;
  avatar_url: string | null;
};

type QaVoteRow = {
  league_id: string;
  season_id: string;
  match_id: string | null;
  round: number;
  voter_player_id: string;
  selected_player_id: string;
  created_at: string;
};

type QaConfirmationRow = {
  match_id: string;
  player_id: string;
  status: "confirmed" | "disputed";
  updated_at: string;
};

const matchSelect =
  "id,league_id,season_id,round,status,team_a,team_b,points_a,points_b,sets,scheduled_at,date_label,location,result_recorded_at,result_reported_by_player_id,result_locked";

function toPlayerIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getParticipantIds(match: QaMatchRow) {
  return Array.from(
    new Set([...toPlayerIds(match.team_a), ...toPlayerIds(match.team_b)]),
  );
}

function toMvpMatch(match: QaMatchRow) {
  return {
    id: match.id,
    leagueId: match.league_id,
    seasonId: match.season_id,
    round: match.round,
    status:
      match.status === "finished" ||
      match.status === "scheduled" ||
      match.status === "postponed"
        ? match.status
        : "scheduling",
    teamA: toPlayerIds(match.team_a),
    teamB: toPlayerIds(match.team_b),
    pointsA: match.points_a,
    pointsB: match.points_b,
    sets: Array.isArray(match.sets) ? match.sets : [],
    resultCounts: true,
  } as const;
}

function toMvpVote(row: QaVoteRow): MvpVote {
  return {
    leagueId: row.league_id,
    seasonId: row.season_id,
    matchId: row.match_id,
    round: row.round,
    voterPlayerId: row.voter_player_id,
    selectedPlayerId: row.selected_player_id,
    createdAt: row.created_at,
  };
}

function formatQaDateLabel(value: Date) {
  const label = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

  return label.charAt(0).toLocaleUpperCase("es-ES") + label.slice(1);
}

async function getPlayerMap(supabase: ServiceClient, leagueId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("id,league_id,display_name,avatar_initials,avatar_url")
    .eq("league_id", leagueId);

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as QaPlayerRow[]).map((player) => [player.id, player]),
  );
}

async function getMatch(supabase: ServiceClient, leagueId: string, matchId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("id", matchId)
    .eq("league_id", leagueId)
    .single();

  if (error) {
    throw error;
  }

  return data as QaMatchRow;
}

async function getSeasonMatches(
  supabase: ServiceClient,
  leagueId: string,
  seasonId: string,
) {
  const { data, error } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .order("round", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as QaMatchRow[];
}

async function getSeasonQaSettings(
  supabase: ServiceClient,
  leagueId: string,
  seasonId: string,
) {
  const { data, error } = await supabase
    .from("season_settings")
    .select("mvp_system,result_confirmation_mode")
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    mvpSystem: data?.mvp_system ?? "automatic",
    resultConfirmationMode: data?.result_confirmation_mode ?? "optional",
  };
}

async function getSeasonVotes(
  supabase: ServiceClient,
  leagueId: string,
  seasonId: string,
) {
  const { data, error } = await supabase
    .from("mvp_votes")
    .select(
      "league_id,season_id,match_id,round,voter_player_id,selected_player_id,created_at",
    )
    .eq("league_id", leagueId)
    .eq("season_id", seasonId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as QaVoteRow[]).map(toMvpVote);
}

async function insertActivityEvent({
  supabase,
  leagueId,
  seasonId,
  matchId,
  actorEmail,
  actorDisplayName,
  type,
  title,
  description,
  metadata,
}: {
  supabase: ServiceClient;
  leagueId: string;
  seasonId: string | null;
  matchId: string | null;
  actorEmail: string;
  actorDisplayName: string;
  type:
    | "match_scheduled"
    | "match_result_saved"
    | "match_result_updated"
    | "match_result_disputed"
    | "match_mvp_awarded"
    | "round_mvp_awarded";
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from("activity_events")
    .insert({
      league_id: leagueId,
      season_id: seasonId,
      match_id: matchId,
      actor_user_id: null,
      actor_email: actorEmail,
      actor_display_name: actorDisplayName,
      type,
      title,
      description,
      metadata: {
        ...metadata,
        qaMode: true,
      },
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const eventId = String(data.id);
  const pushResult = await dispatchPushForActivityEvent(eventId).catch(() => ({
    ok: false,
    sent: 0,
    reason: "dispatch_failed",
  }));

  return { eventId, pushResult };
}

async function hasMvpEvent({
  supabase,
  matchId,
  seasonId,
  round,
  type,
}: {
  supabase: ServiceClient;
  matchId?: string;
  seasonId: string;
  round: number;
  type: "match_mvp_awarded" | "round_mvp_awarded";
}) {
  let query = supabase
    .from("activity_events")
    .select("id")
    .eq("season_id", seasonId)
    .eq("type", type)
    .contains("metadata", { system: "voting" })
    .limit(1);

  query = matchId
    ? query.eq("match_id", matchId)
    : query.contains("metadata", { round });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return Boolean(data && data.length > 0);
}

async function evaluateAndNotifyMvp({
  supabase,
  leagueId,
  seasonId,
  matchId,
}: {
  supabase: ServiceClient;
  leagueId: string;
  seasonId: string;
  matchId: string;
}) {
  const [matches, votes, playerMap] = await Promise.all([
    getSeasonMatches(supabase, leagueId, seasonId),
    getSeasonVotes(supabase, leagueId, seasonId),
    getPlayerMap(supabase, leagueId),
  ]);
  const targetMatch = matches.find((match) => match.id === matchId);

  if (!targetMatch) {
    throw new Error("match_not_found");
  }

  const mvpMatches = matches.map(toMvpMatch);
  const mvpMatch = toMvpMatch(targetMatch);
  const matchMvp = getMatchMvpSelection({ votes, match: mvpMatch });
  const results: { eventId: string; kind: "match" | "round" }[] = [];

  if (
    matchMvp &&
    !(await hasMvpEvent({
      supabase,
      matchId,
      seasonId,
      round: targetMatch.round,
      type: "match_mvp_awarded",
    }))
  ) {
    const winnerNames = matchMvp.playerIds.map(
      (playerId) => playerMap.get(playerId)?.display_name ?? "Jugador",
    );
    const participantIds = getParticipantIds(targetMatch);
    const event = await insertActivityEvent({
      supabase,
      leagueId,
      seasonId,
      matchId,
      actorEmail: "system@smash-lob.local",
      actorDisplayName: "Smash & Lob",
      type: "match_mvp_awarded",
      title: "MVP del partido decidido",
      description: `${winnerNames.join(" / ")} ${winnerNames.length > 1 ? "son" : "es"} el MVP del partido de la Jornada ${targetMatch.round}.`,
      metadata: {
        round: targetMatch.round,
        playerIds: matchMvp.playerIds,
        playerNames: winnerNames,
        participantIds,
        targetPlayerIds: participantIds,
        votes: matchMvp.votes,
        tied: matchMvp.tied ?? false,
        resolvedWithThreeVotes: matchMvp.votes >= 3,
        system: "voting",
      },
    });
    results.push({ eventId: event.eventId, kind: "match" });
  }

  const roundMvp = getRoundMvpSelection({
    votes,
    leagueId,
    seasonId,
    round: targetMatch.round,
    matches: mvpMatches,
    mvpSystem: "voting",
  });

  if (
    roundMvp &&
    !(await hasMvpEvent({
      supabase,
      seasonId,
      round: targetMatch.round,
      type: "round_mvp_awarded",
    }))
  ) {
    const winnerNames = roundMvp.playerIds.map(
      (playerId) => playerMap.get(playerId)?.display_name ?? "Jugador",
    );
    const targetPlayerIds = Array.from(
      new Set(
        matches
          .filter((match) => match.round === targetMatch.round)
          .flatMap(getParticipantIds),
      ),
    );
    const event = await insertActivityEvent({
      supabase,
      leagueId,
      seasonId,
      matchId: roundMvp.matchId ?? matchId,
      actorEmail: "system@smash-lob.local",
      actorDisplayName: "Smash & Lob",
      type: "round_mvp_awarded",
      title: `MVP de Jornada ${targetMatch.round} decidido`,
      description: `${winnerNames.join(" / ")} ${winnerNames.length > 1 ? "son" : "es"} el MVP de la Jornada ${targetMatch.round}.`,
      metadata: {
        round: targetMatch.round,
        playerIds: roundMvp.playerIds,
        playerNames: winnerNames,
        targetPlayerIds,
        votes: roundMvp.votes,
        tied: roundMvp.tied ?? false,
        system: "voting",
      },
    });
    results.push({ eventId: event.eventId, kind: "round" });
  }

  return results;
}

async function clearQaMvpEvents({
  supabase,
  seasonId,
  matchIds,
  round,
}: {
  supabase: ServiceClient;
  seasonId: string;
  matchIds: string[];
  round: number;
}) {
  if (matchIds.length > 0) {
    const { error: matchEventError } = await supabase
      .from("activity_events")
      .delete()
      .eq("season_id", seasonId)
      .eq("type", "match_mvp_awarded")
      .in("match_id", matchIds)
      .contains("metadata", { qaMode: true });

    if (matchEventError) {
      throw matchEventError;
    }
  }

  const { error: roundEventError } = await supabase
    .from("activity_events")
    .delete()
    .eq("season_id", seasonId)
    .eq("type", "round_mvp_awarded")
    .contains("metadata", { qaMode: true, round });

  if (roundEventError) {
    throw roundEventError;
  }
}

async function clearMatchQaState({
  supabase,
  match,
  clearSchedule = false,
}: {
  supabase: ServiceClient;
  match: QaMatchRow;
  clearSchedule?: boolean;
}) {
  const { error: votesError } = await supabase
    .from("mvp_votes")
    .delete()
    .eq("match_id", match.id);

  if (votesError) {
    throw votesError;
  }

  const { error: confirmationsError } = await supabase
    .from("match_result_confirmations")
    .delete()
    .eq("match_id", match.id);

  if (confirmationsError) {
    throw confirmationsError;
  }

  const nextStatus = clearSchedule
    ? "scheduling"
    : match.scheduled_at
      ? "scheduled"
      : "scheduling";
  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
    points_a: null,
    points_b: null,
    sets: [],
    result_recorded_at: null,
    result_reported_by_player_id: null,
    result_locked: false,
  };

  if (clearSchedule) {
    updatePayload.scheduled_at = null;
    updatePayload.date_label = null;
    updatePayload.location = null;
  }

  const { error: matchError } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", match.id);

  if (matchError) {
    throw matchError;
  }
}

function getSyntheticActor(player: QaPlayerRow | undefined) {
  if (!player) {
    return {
      email: "qa@smash-lob.local",
      displayName: "Jugador QA",
    };
  }

  return {
    email: `qa-${player.id}@smash-lob.local`,
    displayName: player.display_name,
  };
}

async function insertVotes({
  supabase,
  match,
  votes,
}: {
  supabase: ServiceClient;
  match: QaMatchRow;
  votes: { voterPlayerId: string; selectedPlayerId: string }[];
}) {
  const participantIds = getParticipantIds(match);

  for (const vote of votes) {
    if (
      vote.voterPlayerId === vote.selectedPlayerId ||
      !participantIds.includes(vote.voterPlayerId) ||
      !participantIds.includes(vote.selectedPlayerId)
    ) {
      throw new Error("invalid_vote");
    }
  }

  const now = new Date().toISOString();

  for (const vote of votes) {
    const payload = {
      league_id: match.league_id,
      season_id: match.season_id,
      match_id: match.id,
      round: match.round,
      voter_player_id: vote.voterPlayerId,
      selected_player_id: vote.selectedPlayerId,
      created_at: now,
    };
    const { data: updatedRows, error: updateError } = await supabase
      .from("mvp_votes")
      .update(payload)
      .eq("league_id", match.league_id)
      .eq("season_id", match.season_id)
      .eq("match_id", match.id)
      .eq("voter_player_id", vote.voterPlayerId)
      .select("match_id");

    if (updateError) {
      throw updateError;
    }

    if ((updatedRows ?? []).length > 0) {
      continue;
    }

    const { error: insertError } = await supabase
      .from("mvp_votes")
      .insert(payload);

    if (insertError) {
      throw insertError;
    }
  }
}

function buildThreeVoteRows(match: QaMatchRow, selectedPlayerId: string) {
  return getParticipantIds(match)
    .filter((playerId) => playerId !== selectedPlayerId)
    .slice(0, 3)
    .map((voterPlayerId) => ({ voterPlayerId, selectedPlayerId }));
}

function buildTieRows(
  match: QaMatchRow,
  firstPlayerId: string,
  secondPlayerId: string,
) {
  const participants = getParticipantIds(match);
  const firstVoters = participants
    .filter((playerId) => playerId !== firstPlayerId)
    .slice(0, 2);
  const secondVoters = participants
    .filter(
      (playerId) =>
        playerId !== secondPlayerId && !firstVoters.includes(playerId),
    )
    .slice(0, 2);

  if (firstVoters.length !== 2 || secondVoters.length !== 2) {
    throw new Error("tie_not_possible");
  }

  return [
    ...firstVoters.map((voterPlayerId) => ({
      voterPlayerId,
      selectedPlayerId: firstPlayerId,
    })),
    ...secondVoters.map((voterPlayerId) => ({
      voterPlayerId,
      selectedPlayerId: secondPlayerId,
    })),
  ];
}

function buildTwoOneOneRows(match: QaMatchRow, selectedPlayerId: string) {
  const participants = getParticipantIds(match);
  const selectedVoters = participants
    .filter((playerId) => playerId !== selectedPlayerId)
    .slice(0, 2);
  const remainingVoters = participants.filter(
    (playerId) => !selectedVoters.includes(playerId),
  );
  const alternativeTargets = participants.filter(
    (playerId) => playerId !== selectedPlayerId,
  );

  if (
    selectedVoters.length !== 2 ||
    remainingVoters.length !== 2 ||
    alternativeTargets.length < 2
  ) {
    throw new Error("scenario_not_possible");
  }

  return [
    ...selectedVoters.map((voterPlayerId) => ({
      voterPlayerId,
      selectedPlayerId,
    })),
    {
      voterPlayerId: remainingVoters[0],
      selectedPlayerId:
        alternativeTargets.find(
          (playerId) => playerId !== remainingVoters[0],
        ) ?? alternativeTargets[0],
    },
    {
      voterPlayerId: remainingVoters[1],
      selectedPlayerId:
        alternativeTargets.find(
          (playerId) =>
            playerId !== remainingVoters[1] &&
            playerId !== alternativeTargets[0],
        ) ?? alternativeTargets[0],
    },
  ];
}

async function ensureFinishedResult({
  supabase,
  match,
  reporterPlayerId,
}: {
  supabase: ServiceClient;
  match: QaMatchRow;
  reporterPlayerId: string;
}) {
  const sets = [
    { a: 6, b: 3 },
    { a: 4, b: 6 },
    { a: 6, b: 4 },
  ];
  const { error } = await supabase
    .from("matches")
    .update({
      status: "finished",
      points_a: 2,
      points_b: 1,
      sets,
      result_recorded_at: new Date().toISOString(),
      result_reported_by_player_id: reporterPlayerId,
      result_locked: false,
    })
    .eq("id", match.id);

  if (error) {
    throw error;
  }
}

export async function fetchQaSnapshot({
  actor,
  leagueId,
}: {
  actor: ServerLeagueActor;
  leagueId: string;
}) {
  const supabase = actor.supabase;
  const [seasonsResult, playersResult, seasonPlayersResult, settingsResult] =
    await Promise.all([
      supabase
        .from("seasons")
        .select("id,league_id,name,status,total_rounds,completed_rounds")
        .eq("league_id", leagueId),
      supabase
        .from("players")
        .select("id,league_id,display_name,avatar_initials,avatar_url")
        .eq("league_id", leagueId)
        .order("display_name", { ascending: true }),
      supabase
        .from("season_players")
        .select("season_id,player_id,seasons!inner(league_id)")
        .eq("seasons.league_id", leagueId),
      supabase
        .from("season_settings")
        .select(
          "league_id,season_id,mvp_system,result_confirmation_mode,round_window_mode,season_starts_at,round_window_days",
        )
        .eq("league_id", leagueId),
    ]);

  if (seasonsResult.error) throw seasonsResult.error;
  if (playersResult.error) throw playersResult.error;
  if (seasonPlayersResult.error) throw seasonPlayersResult.error;
  if (settingsResult.error) throw settingsResult.error;

  const seasons = seasonsResult.data ?? [];
  const seasonIds = seasons.map((season) => season.id);
  const matchesResult =
    seasonIds.length > 0
      ? await supabase
          .from("matches")
          .select(matchSelect)
          .in("season_id", seasonIds)
          .order("round", { ascending: true })
      : { data: [], error: null };

  if (matchesResult.error) throw matchesResult.error;

  const matches = (matchesResult.data ?? []) as QaMatchRow[];
  const matchIds = matches.map((match) => match.id);
  const [votesResult, confirmationsResult] = await Promise.all([
    matchIds.length > 0
      ? supabase
          .from("mvp_votes")
          .select(
            "league_id,season_id,match_id,round,voter_player_id,selected_player_id,created_at",
          )
          .in("match_id", matchIds)
      : Promise.resolve({ data: [], error: null }),
    matchIds.length > 0
      ? supabase
          .from("match_result_confirmations")
          .select("match_id,player_id,status,updated_at")
          .in("match_id", matchIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (votesResult.error) throw votesResult.error;
  if (confirmationsResult.error) throw confirmationsResult.error;

  return {
    currentUser: {
      email: actor.user.email,
      displayName: actor.user.displayName,
    },
    seasons,
    players: playersResult.data ?? [],
    seasonPlayers: (seasonPlayersResult.data ?? []).map((row) => ({
      seasonId: row.season_id,
      playerId: row.player_id,
    })),
    settings: settingsResult.data ?? [],
    matches,
    votes: votesResult.data ?? [],
    confirmations: confirmationsResult.data ?? [],
  };
}

export async function runQaAction({
  actor,
  input,
}: {
  actor: ServerLeagueActor;
  input: QaActionInput;
}) {
  const { supabase } = actor;
  const { leagueId, action } = input;
  const playerMap = await getPlayerMap(supabase, leagueId);

  if (action === "complete_round_scenario" || action === "reset_round") {
    const referenceMatch = input.matchId
      ? await getMatch(supabase, leagueId, input.matchId)
      : null;
    const seasonId = input.seasonId ?? referenceMatch?.season_id;
    const round = referenceMatch?.round;

    if (!seasonId || !round) {
      throw new Error("missing_round_context");
    }

    const [seasonMatches, seasonQaSettings] = await Promise.all([
      getSeasonMatches(supabase, leagueId, seasonId),
      getSeasonQaSettings(supabase, leagueId, seasonId),
    ]);
    const roundMatches = seasonMatches.filter((match) => match.round === round);

    if (roundMatches.length === 0) {
      throw new Error("round_without_matches");
    }

    if (
      action === "complete_round_scenario" &&
      seasonQaSettings.mvpSystem !== "voting"
    ) {
      throw new Error("mvp_voting_not_enabled");
    }

    if (action === "reset_round") {
      for (const match of roundMatches) {
        await clearMatchQaState({ supabase, match });
      }
      await clearQaMvpEvents({
        supabase,
        seasonId,
        matchIds: roundMatches.map((match) => match.id),
        round,
      });
      return { ok: true, action, affectedMatches: roundMatches.length };
    }

    for (const match of roundMatches) {
      const participants = getParticipantIds(match);
      const reporterPlayerId = participants[0];

      if (!reporterPlayerId || participants.length !== 4) {
        throw new Error("match_requires_four_players");
      }

      await clearMatchQaState({ supabase, match });
      await ensureFinishedResult({ supabase, match, reporterPlayerId });
    }

    await clearQaMvpEvents({
      supabase,
      seasonId,
      matchIds: roundMatches.map((match) => match.id),
      round,
    });

    for (const [index, match] of roundMatches.entries()) {
      const participants = getParticipantIds(match);
      const selectedPlayerId = participants[0];

      if (!selectedPlayerId) {
        throw new Error("missing_selected_player");
      }

      const rows =
        index === 0
          ? buildThreeVoteRows(match, selectedPlayerId)
          : buildTwoOneOneRows(match, selectedPlayerId);
      await insertVotes({ supabase, match, votes: rows });
      await evaluateAndNotifyMvp({
        supabase,
        leagueId,
        seasonId,
        matchId: match.id,
      });
    }

    return {
      ok: true,
      action,
      affectedMatches: roundMatches.length,
      round,
    };
  }

  if (!input.matchId) {
    throw new Error("missing_match_id");
  }

  const match = await getMatch(supabase, leagueId, input.matchId);
  const participants = getParticipantIds(match);
  const seasonQaSettings = await getSeasonQaSettings(
    supabase,
    leagueId,
    match.season_id,
  );
  const actorPlayerId = input.actorPlayerId ?? participants[0];
  const actorPlayer = actorPlayerId ? playerMap.get(actorPlayerId) : undefined;
  const syntheticActor = getSyntheticActor(actorPlayer);

  if (actorPlayerId && !participants.includes(actorPlayerId)) {
    throw new Error("actor_not_in_match");
  }

  switch (action) {
    case "schedule_match": {
      if (match.status === "finished") {
        throw new Error("reset_finished_match_before_scheduling");
      }

      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 1);
      scheduledAt.setHours(19, 0, 0, 0);
      const { error } = await supabase
        .from("matches")
        .update({
          status: "scheduled",
          scheduled_at: scheduledAt.toISOString(),
          date_label: formatQaDateLabel(scheduledAt),
          location: "Pista QA",
        })
        .eq("id", match.id);

      if (error) throw error;

      await insertActivityEvent({
        supabase,
        leagueId,
        seasonId: match.season_id,
        matchId: match.id,
        actorEmail: syntheticActor.email,
        actorDisplayName: syntheticActor.displayName,
        type: "match_scheduled",
        title: "Partido programado",
        description: `Jornada ${match.round} · ${formatQaDateLabel(scheduledAt)} · Pista QA`,
        metadata: {
          round: match.round,
          participantIds: participants,
          scheduledAt: scheduledAt.toISOString(),
          location: "Pista QA",
        },
      });
      break;
    }

    case "record_result": {
      if (!actorPlayerId) throw new Error("missing_actor_player");
      await clearMatchQaState({ supabase, match });
      await ensureFinishedResult({
        supabase,
        match,
        reporterPlayerId: actorPlayerId,
      });
      await clearQaMvpEvents({
        supabase,
        seasonId: match.season_id,
        matchIds: [match.id],
        round: match.round,
      });
      await insertActivityEvent({
        supabase,
        leagueId,
        seasonId: match.season_id,
        matchId: match.id,
        actorEmail: syntheticActor.email,
        actorDisplayName: syntheticActor.displayName,
        type: "match_result_saved",
        title: "Resultado registrado",
        description: `Jornada ${match.round} · 6-3, 4-6, 6-4`,
        metadata: {
          round: match.round,
          participantIds: participants,
          sets: [
            { a: 6, b: 3 },
            { a: 4, b: 6 },
            { a: 6, b: 4 },
          ],
          pointsA: 2,
          pointsB: 1,
          resultReportedByPlayerId: actorPlayerId,
        },
      });
      break;
    }

    case "cast_vote": {
      if (seasonQaSettings.mvpSystem !== "voting") {
        throw new Error("mvp_voting_not_enabled");
      }
      if (match.status !== "finished") {
        throw new Error("result_not_recorded");
      }
      if (!actorPlayerId || !input.selectedPlayerId) {
        throw new Error("missing_vote_players");
      }
      await insertVotes({
        supabase,
        match,
        votes: [
          {
            voterPlayerId: actorPlayerId,
            selectedPlayerId: input.selectedPlayerId,
          },
        ],
      });
      await evaluateAndNotifyMvp({
        supabase,
        leagueId,
        seasonId: match.season_id,
        matchId: match.id,
      });
      break;
    }

    case "award_three_votes": {
      if (seasonQaSettings.mvpSystem !== "voting") {
        throw new Error("mvp_voting_not_enabled");
      }
      if (match.status !== "finished") {
        throw new Error("result_not_recorded");
      }
      if (!input.selectedPlayerId) {
        throw new Error("missing_selected_player");
      }
      const { error: clearError } = await supabase
        .from("mvp_votes")
        .delete()
        .eq("match_id", match.id);
      if (clearError) throw clearError;
      await clearQaMvpEvents({
        supabase,
        seasonId: match.season_id,
        matchIds: [match.id],
        round: match.round,
      });
      await insertVotes({
        supabase,
        match,
        votes: buildThreeVoteRows(match, input.selectedPlayerId),
      });
      await evaluateAndNotifyMvp({
        supabase,
        leagueId,
        seasonId: match.season_id,
        matchId: match.id,
      });
      break;
    }

    case "tie_votes": {
      if (seasonQaSettings.mvpSystem !== "voting") {
        throw new Error("mvp_voting_not_enabled");
      }
      if (match.status !== "finished") {
        throw new Error("result_not_recorded");
      }
      if (!input.selectedPlayerId || !input.secondaryPlayerId) {
        throw new Error("missing_tie_players");
      }
      const { error: clearError } = await supabase
        .from("mvp_votes")
        .delete()
        .eq("match_id", match.id);
      if (clearError) throw clearError;
      await clearQaMvpEvents({
        supabase,
        seasonId: match.season_id,
        matchIds: [match.id],
        round: match.round,
      });
      await insertVotes({
        supabase,
        match,
        votes: buildTieRows(
          match,
          input.selectedPlayerId,
          input.secondaryPlayerId,
        ),
      });
      await evaluateAndNotifyMvp({
        supabase,
        leagueId,
        seasonId: match.season_id,
        matchId: match.id,
      });
      break;
    }

    case "confirm_all": {
      if (match.status !== "finished") {
        throw new Error("result_not_recorded");
      }
      if (seasonQaSettings.resultConfirmationMode === "none") {
        throw new Error("result_confirmations_disabled");
      }
      const reporterPlayerId = match.result_reported_by_player_id;
      const rows = participants
        .filter((playerId) => playerId !== reporterPlayerId)
        .map((playerId) => ({
          match_id: match.id,
          player_id: playerId,
          status: "confirmed" as const,
          updated_at: new Date().toISOString(),
        }));
      const { error } = await supabase
        .from("match_result_confirmations")
        .upsert(rows, { onConflict: "match_id,player_id" });
      if (error) throw error;
      break;
    }

    case "dispute_result": {
      if (match.status !== "finished") {
        throw new Error("result_not_recorded");
      }
      if (seasonQaSettings.resultConfirmationMode === "none") {
        throw new Error("result_confirmations_disabled");
      }
      if (!actorPlayerId || actorPlayerId === match.result_reported_by_player_id) {
        throw new Error("invalid_dispute_actor");
      }
      const { error } = await supabase
        .from("match_result_confirmations")
        .upsert(
          {
            match_id: match.id,
            player_id: actorPlayerId,
            status: "disputed",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "match_id,player_id" },
        );
      if (error) throw error;
      await insertActivityEvent({
        supabase,
        leagueId,
        seasonId: match.season_id,
        matchId: match.id,
        actorEmail: syntheticActor.email,
        actorDisplayName: syntheticActor.displayName,
        type: "match_result_disputed",
        title: "Resultado marcado como incorrecto",
        description: `Jornada ${match.round} · El resultado necesita corregirse.`,
        metadata: {
          round: match.round,
          participantIds: participants,
          targetPlayerIds: match.result_reported_by_player_id
            ? [match.result_reported_by_player_id]
            : participants.filter((playerId) => playerId !== actorPlayerId),
          disputedByPlayerId: actorPlayerId,
          resultReportedByPlayerId: match.result_reported_by_player_id,
        },
      });
      break;
    }

    case "auto_validate_24h": {
      if (seasonQaSettings.resultConfirmationMode !== "required") {
        throw new Error("required_confirmations_not_enabled");
      }
      if (!match.result_recorded_at) {
        throw new Error("result_not_recorded");
      }
      const rowsResult = await supabase
        .from("match_result_confirmations")
        .select("match_id,player_id,status,updated_at")
        .eq("match_id", match.id);
      if (rowsResult.error) throw rowsResult.error;
      const existingRows = (rowsResult.data ?? []) as QaConfirmationRow[];
      if (existingRows.some((row) => row.status === "disputed")) {
        throw new Error("result_is_disputed");
      }
      const recordedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const { error: ageError } = await supabase
        .from("matches")
        .update({ result_recorded_at: recordedAt.toISOString() })
        .eq("id", match.id);
      if (ageError) throw ageError;
      const confirmedIds = new Set(
        existingRows
          .filter((row) => row.status === "confirmed")
          .map((row) => row.player_id),
      );
      const rows = participants
        .filter(
          (playerId) =>
            playerId !== match.result_reported_by_player_id &&
            !confirmedIds.has(playerId),
        )
        .map((playerId) => ({
          match_id: match.id,
          player_id: playerId,
          status: "confirmed" as const,
          updated_at: new Date().toISOString(),
        }));
      if (rows.length > 0) {
        const { error: confirmError } = await supabase
          .from("match_result_confirmations")
          .upsert(rows, { onConflict: "match_id,player_id" });
        if (confirmError) throw confirmError;
      }
      break;
    }

    case "lock_result":
    case "unlock_result": {
      const locked = action === "lock_result";
      const { error } = await supabase
        .from("matches")
        .update({ result_locked: locked })
        .eq("id", match.id)
        .eq("status", "finished");
      if (error) throw error;
      await insertActivityEvent({
        supabase,
        leagueId,
        seasonId: match.season_id,
        matchId: match.id,
        actorEmail: actor.user.email,
        actorDisplayName: actor.user.displayName ?? "Admin",
        type: "match_result_updated",
        title: locked
          ? "Resultado fijado por administración"
          : "Resultado desbloqueado por administración",
        description: locked
          ? "El resultado queda marcado como definitivo."
          : "El resultado vuelve a admitir correcciones.",
        metadata: {
          round: match.round,
          participantIds: participants,
          resultLockOnly: true,
          resultLocked: locked,
        },
      });
      break;
    }

    case "reset_match": {
      await clearMatchQaState({ supabase, match });
      await clearQaMvpEvents({
        supabase,
        seasonId: match.season_id,
        matchIds: [match.id],
        round: match.round,
      });
      break;
    }

    default:
      throw new Error("unsupported_qa_action");
  }

  return { ok: true, action };
}
