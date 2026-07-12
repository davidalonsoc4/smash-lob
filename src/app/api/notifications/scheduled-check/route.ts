import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabaseServer";
import { dispatchPushForActivityEvent } from "@/lib/serverPushDispatch";
import {
  getDueMatchResultReminderHours,
  getDueMvpVoteReminderHours,
  getDueResultConfirmationReminderHours,
  isMatchInProgressWindow,
  isResultConfirmationAutoValidationDue,
  type MvpVoteReminderHour,
  type ResultConfirmationReminderHour,
  type ResultReminderHour,
} from "@/lib/matchLifecycle";
import { getScheduleLocationFallbackText } from "@/lib/leagueLocations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MatchRow = {
  id: string;
  league_id: string;
  season_id: string;
  round: number;
  status: string;
  team_a: string[] | null;
  team_b: string[] | null;
  scheduled_at: string | null;
  date_label: string | null;
  location: string | null;
  result_recorded_at: string | null;
  result_reported_by_player_id: string | null;
  result_locked: boolean | null;
};

type SeasonRow = {
  id: string;
  name: string | null;
  status: string | null;
};

type SeasonSettingRow = {
  league_id: string;
  season_id: string;
  mvp_system: string | null;
  result_confirmation_mode: string | null;
};

type VoteRow = {
  match_id: string | null;
  voter_player_id: string;
};

type ConfirmationRow = {
  match_id: string;
  player_id: string;
  status: "confirmed" | "disputed";
};

type ActivityInsertResult = {
  id: string;
};

function toPlayerIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function getParticipantIds(match: MatchRow) {
  return Array.from(
    new Set([...toPlayerIds(match.team_a), ...toPlayerIds(match.team_b)]),
  );
}

function getScheduleSummary(match: MatchRow) {
  return [match.date_label, getScheduleLocationFallbackText(match.location)]
    .filter((item): item is string => Boolean(item?.trim()))
    .join(" · ");
}

async function hasExistingRoundInPlayEvent({
  supabase,
  leagueId,
  seasonId,
  round,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  leagueId: string;
  seasonId: string;
  round: number;
}) {
  const { data, error } = await supabase
    .from("activity_events")
    .select("id")
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .eq("type", "round_in_play")
    .contains("metadata", { round })
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data && data.length > 0);
}

async function hasExistingResultReminderEvent({
  supabase,
  matchId,
  reminderHour,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  matchId: string;
  reminderHour: ResultReminderHour;
}) {
  const { data, error } = await supabase
    .from("activity_events")
    .select("id")
    .eq("match_id", matchId)
    .eq("type", "match_result_missing_reminder")
    .contains("metadata", { reminderHour })
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data && data.length > 0);
}

async function hasExistingMvpVoteReminderEvent({
  supabase,
  matchId,
  reminderHour,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  matchId: string;
  reminderHour: MvpVoteReminderHour;
}) {
  const { data, error } = await supabase
    .from("activity_events")
    .select("id")
    .eq("match_id", matchId)
    .eq("type", "match_mvp_vote_reminder")
    .contains("metadata", { reminderHour })
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data && data.length > 0);
}

async function hasExistingResultConfirmationReminderEvent({
  supabase,
  matchId,
  reminderHour,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  matchId: string;
  reminderHour: ResultConfirmationReminderHour;
}) {
  const { data, error } = await supabase
    .from("activity_events")
    .select("id")
    .eq("match_id", matchId)
    .eq("type", "match_result_confirmation_reminder")
    .contains("metadata", { reminderHour })
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data && data.length > 0);
}

async function hasExistingUpcomingReminderEvent({
  supabase,
  matchId,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  matchId: string;
}) {
  const { data, error } = await supabase
    .from("activity_events")
    .select("id")
    .eq("match_id", matchId)
    .eq("type", "match_upcoming_reminder")
    .contains("metadata", { reminderMinutes: 120 })
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data && data.length > 0);
}

async function createActivityEvent({
  supabase,
  match,
  type,
  title,
  description,
  metadata,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  match: MatchRow;
  type:
    | "round_in_play"
    | "match_result_missing_reminder"
    | "match_upcoming_reminder"
    | "match_mvp_vote_reminder"
    | "match_result_confirmation_reminder";
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from("activity_events")
    .insert({
      league_id: match.league_id,
      season_id: match.season_id,
      match_id: match.id,
      actor_user_id: null,
      actor_email: "system@smash-lob.local",
      actor_display_name: "Smash & Lob",
      type,
      title,
      description,
      metadata,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return (data as ActivityInsertResult).id;
}

function getProvidedCronSecret(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const bearerPrefix = "Bearer ";

  if (authorization.startsWith(bearerPrefix)) {
    return authorization.slice(bearerPrefix.length).trim();
  }

  const headerSecret = request.headers.get("x-cron-secret")?.trim();

  if (headerSecret) {
    return headerSecret;
  }

  const url = new URL(request.url);
  return url.searchParams.get("secret")?.trim() ?? "";
}

function isAuthorizedCronRequest(request: Request) {
  const expectedSecret = process.env.CRON_SECRET?.trim();

  if (!expectedSecret) {
    return true;
  }

  return getProvidedCronSecret(request) === expectedSecret;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      { ok: false, reason: "invalid_cron_secret" },
      { status: 401 },
    );
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, reason: "missing_service_role" },
      { status: 200 },
    );
  }

  const now = new Date();
  const upcomingReminderWindowEndsAt = new Date(
    now.getTime() + 2 * 60 * 60 * 1000,
  );

  const [scheduledResult, settingsResult] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id,league_id,season_id,round,status,team_a,team_b,scheduled_at,date_label,location,result_recorded_at,result_reported_by_player_id,result_locked",
      )
      .eq("status", "scheduled")
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", upcomingReminderWindowEndsAt.toISOString())
      .limit(500),
    supabase
      .from("season_settings")
      .select("league_id,season_id,mvp_system,result_confirmation_mode")
      .limit(1000),
  ]);

  if (scheduledResult.error) {
    return NextResponse.json(
      { ok: false, error: scheduledResult.error.message },
      { status: 500 },
    );
  }

  if (settingsResult.error) {
    return NextResponse.json(
      { ok: false, error: settingsResult.error.message },
      { status: 500 },
    );
  }

  const matches = (scheduledResult.data ?? []) as MatchRow[];
  const settings = (settingsResult.data ?? []) as SeasonSettingRow[];
  const votingSeasonIds = new Set(
    settings
      .filter((setting) => setting.mvp_system === "voting")
      .map((setting) => setting.season_id),
  );
  const requiredConfirmationSeasonIds = new Set(
    settings
      .filter((setting) => setting.result_confirmation_mode === "required")
      .map((setting) => setting.season_id),
  );
  const finishedSeasonIds = Array.from(
    new Set([...votingSeasonIds, ...requiredConfirmationSeasonIds]),
  );

  let finishedMatches: MatchRow[] = [];

  if (finishedSeasonIds.length > 0) {
    const { data, error } = await supabase
      .from("matches")
      .select(
        "id,league_id,season_id,round,status,team_a,team_b,scheduled_at,date_label,location,result_recorded_at,result_reported_by_player_id,result_locked",
      )
      .in("season_id", finishedSeasonIds)
      .eq("status", "finished")
      .not("result_recorded_at", "is", null)
      .limit(1500);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    finishedMatches = (data ?? []) as MatchRow[];
  }

  const votingMatches = finishedMatches.filter((match) =>
    votingSeasonIds.has(match.season_id),
  );
  const confirmationMatches = finishedMatches.filter((match) =>
    requiredConfirmationSeasonIds.has(match.season_id),
  );
  const allSeasonIds = Array.from(
    new Set(
      [...matches, ...finishedMatches]
        .map((match) => match.season_id)
        .filter(Boolean),
    ),
  );

  if (allSeasonIds.length === 0) {
    return NextResponse.json({
      ok: true,
      created: 0,
      sent: 0,
      autoValidated: 0,
    });
  }

  const { data: seasons, error: seasonsError } = await supabase
    .from("seasons")
    .select("id,name,status")
    .in("id", allSeasonIds);

  if (seasonsError) {
    return NextResponse.json(
      { ok: false, error: seasonsError.message },
      { status: 500 },
    );
  }

  const seasonById = new Map(
    ((seasons ?? []) as SeasonRow[]).map((season) => [season.id, season]),
  );
  const activeMatches = matches.filter(
    (match) => seasonById.get(match.season_id)?.status === "active",
  );
  const eligibleVotingMatches = votingMatches.filter((match) => {
    const status = seasonById.get(match.season_id)?.status;
    return status === "active" || status === "finished";
  });
  const eligibleConfirmationMatches = confirmationMatches.filter(
    (match) => seasonById.get(match.season_id)?.status === "active",
  );
  const roundCandidates = new Map<string, MatchRow>();
  const resultReminderCandidates: {
    match: MatchRow;
    reminderHours: ResultReminderHour[];
  }[] = [];
  const upcomingReminderCandidates: MatchRow[] = [];

  activeMatches.forEach((match) => {
    if (
      isMatchInProgressWindow({
        status: match.status,
        scheduledAt: match.scheduled_at,
        resultRecordedAt: match.result_recorded_at,
        now,
      })
    ) {
      const key = `${match.league_id}|${match.season_id}|${match.round}`;
      const current = roundCandidates.get(key);

      if (
        !current ||
        String(match.scheduled_at) < String(current.scheduled_at)
      ) {
        roundCandidates.set(key, match);
      }
    }

    if (match.scheduled_at) {
      const scheduledTime = new Date(match.scheduled_at).getTime();

      if (
        Number.isFinite(scheduledTime) &&
        scheduledTime > now.getTime() &&
        scheduledTime <= upcomingReminderWindowEndsAt.getTime()
      ) {
        upcomingReminderCandidates.push(match);
      }
    }

    const dueReminderHours = getDueMatchResultReminderHours({
      status: match.status,
      scheduledAt: match.scheduled_at,
      resultRecordedAt: match.result_recorded_at,
      now,
    });

    if (dueReminderHours.length > 0) {
      resultReminderCandidates.push({ match, reminderHours: dueReminderHours });
    }
  });

  const votesByMatchId = new Map<string, Set<string>>();
  const votingMatchIds = eligibleVotingMatches.map((match) => match.id);

  if (votingMatchIds.length > 0) {
    const { data, error } = await supabase
      .from("mvp_votes")
      .select("match_id,voter_player_id")
      .in("match_id", votingMatchIds);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    ((data ?? []) as VoteRow[]).forEach((vote) => {
      if (!vote.match_id) {
        return;
      }

      const voters = votesByMatchId.get(vote.match_id) ?? new Set<string>();
      voters.add(vote.voter_player_id);
      votesByMatchId.set(vote.match_id, voters);
    });
  }

  const voteReminderCandidates = eligibleVotingMatches
    .map((match) => {
      const participantIds = getParticipantIds(match);
      const submittedVoterIds =
        votesByMatchId.get(match.id) ?? new Set<string>();
      const missingPlayerIds = participantIds.filter(
        (playerId) => !submittedVoterIds.has(playerId),
      );
      const reminderHours = getDueMvpVoteReminderHours({
        resultRecordedAt: match.result_recorded_at,
        now,
      });

      return { match, participantIds, missingPlayerIds, reminderHours };
    })
    .filter(
      (candidate) =>
        candidate.missingPlayerIds.length > 0 &&
        candidate.reminderHours.length > 0,
    );

  const confirmationsByMatchId = new Map<string, ConfirmationRow[]>();
  const confirmationMatchIds = eligibleConfirmationMatches.map(
    (match) => match.id,
  );

  if (confirmationMatchIds.length > 0) {
    const { data, error } = await supabase
      .from("match_result_confirmations")
      .select("match_id,player_id,status")
      .in("match_id", confirmationMatchIds);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    ((data ?? []) as ConfirmationRow[]).forEach((confirmation) => {
      const rows = confirmationsByMatchId.get(confirmation.match_id) ?? [];
      rows.push(confirmation);
      confirmationsByMatchId.set(confirmation.match_id, rows);
    });
  }

  const confirmationReminderCandidates: {
    match: MatchRow;
    participantIds: string[];
    missingPlayerIds: string[];
    reminderHours: ResultConfirmationReminderHour[];
  }[] = [];
  const autoConfirmationRows: {
    match_id: string;
    player_id: string;
    status: "confirmed";
    updated_at: string;
  }[] = [];

  eligibleConfirmationMatches.forEach((match) => {
    if (match.result_locked) {
      return;
    }

    const participantIds = getParticipantIds(match).filter(
      (playerId) => playerId !== match.result_reported_by_player_id,
    );
    const rows = confirmationsByMatchId.get(match.id) ?? [];
    const hasDispute = rows.some((row) => row.status === "disputed");

    if (hasDispute) {
      return;
    }

    const confirmedPlayerIds = new Set(
      rows
        .filter((row) => row.status === "confirmed")
        .map((row) => row.player_id),
    );
    const missingPlayerIds = participantIds.filter(
      (playerId) => !confirmedPlayerIds.has(playerId),
    );

    if (missingPlayerIds.length === 0) {
      return;
    }

    if (
      isResultConfirmationAutoValidationDue({
        resultRecordedAt: match.result_recorded_at,
        now,
      })
    ) {
      missingPlayerIds.forEach((playerId) => {
        autoConfirmationRows.push({
          match_id: match.id,
          player_id: playerId,
          status: "confirmed",
          updated_at: now.toISOString(),
        });
      });
      return;
    }

    const reminderHours = getDueResultConfirmationReminderHours({
      resultRecordedAt: match.result_recorded_at,
      now,
    });

    if (reminderHours.length > 0) {
      confirmationReminderCandidates.push({
        match,
        participantIds,
        missingPlayerIds,
        reminderHours,
      });
    }
  });

  if (autoConfirmationRows.length > 0) {
    const { error } = await supabase
      .from("match_result_confirmations")
      .upsert(autoConfirmationRows, { onConflict: "match_id,player_id" });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }
  }

  const eventIds: string[] = [];

  for (const match of roundCandidates.values()) {
    const alreadySent = await hasExistingRoundInPlayEvent({
      supabase,
      leagueId: match.league_id,
      seasonId: match.season_id,
      round: match.round,
    });

    if (alreadySent) {
      continue;
    }

    const summary = getScheduleSummary(match);
    const eventId = await createActivityEvent({
      supabase,
      match,
      type: "round_in_play",
      title: `Jornada ${match.round} en juego`,
      description: summary
        ? `Jornada ${match.round} · ${summary}`
        : `Jornada ${match.round}`,
      metadata: {
        round: match.round,
        participantIds: getParticipantIds(match),
        scheduledAt: match.scheduled_at,
        location: match.location,
        automatic: true,
      },
    });

    eventIds.push(eventId);
  }

  for (const match of upcomingReminderCandidates) {
    const alreadySent = await hasExistingUpcomingReminderEvent({
      supabase,
      matchId: match.id,
    });

    if (alreadySent) {
      continue;
    }

    const locationText = getScheduleLocationFallbackText(match.location);
    const eventId = await createActivityEvent({
      supabase,
      match,
      type: "match_upcoming_reminder",
      title: "Próximo partido",
      description: locationText
        ? `Prepárate para tu partido en ${locationText}.`
        : "Prepárate para tu partido.",
      metadata: {
        round: match.round,
        reminderMinutes: 120,
        participantIds: getParticipantIds(match),
        scheduledAt: match.scheduled_at,
        location: match.location,
        locationText,
        automatic: true,
      },
    });

    eventIds.push(eventId);
  }

  for (const { match, reminderHours } of resultReminderCandidates) {
    let reminderHourToSend: ResultReminderHour | null = null;

    for (const reminderHour of reminderHours) {
      const alreadySent = await hasExistingResultReminderEvent({
        supabase,
        matchId: match.id,
        reminderHour,
      });

      if (!alreadySent) {
        reminderHourToSend = reminderHour;
        break;
      }
    }

    if (!reminderHourToSend) {
      continue;
    }

    const eventId = await createActivityEvent({
      supabase,
      match,
      type: "match_result_missing_reminder",
      title: "Falta el resultado",
      description: `No olvides registrar el resultado de tu partido de la Jornada ${match.round}.`,
      metadata: {
        round: match.round,
        reminderHour: reminderHourToSend,
        participantIds: getParticipantIds(match),
        scheduledAt: match.scheduled_at,
        location: match.location,
        automatic: true,
      },
    });

    eventIds.push(eventId);
  }

  for (const candidate of voteReminderCandidates) {
    let reminderHourToSend: MvpVoteReminderHour | null = null;

    for (const reminderHour of candidate.reminderHours) {
      const alreadySent = await hasExistingMvpVoteReminderEvent({
        supabase,
        matchId: candidate.match.id,
        reminderHour,
      });

      if (!alreadySent) {
        reminderHourToSend = reminderHour;
        break;
      }
    }

    if (!reminderHourToSend) {
      continue;
    }

    const eventId = await createActivityEvent({
      supabase,
      match: candidate.match,
      type: "match_mvp_vote_reminder",
      title: "Falta tu voto MVP",
      description: `Vota al MVP de tu partido de la Jornada ${candidate.match.round}.`,
      metadata: {
        round: candidate.match.round,
        reminderHour: reminderHourToSend,
        participantIds: candidate.participantIds,
        targetPlayerIds: candidate.missingPlayerIds,
        resultRecordedAt: candidate.match.result_recorded_at,
        automatic: true,
      },
    });

    eventIds.push(eventId);
  }

  for (const candidate of confirmationReminderCandidates) {
    let reminderHourToSend: ResultConfirmationReminderHour | null = null;

    for (const reminderHour of candidate.reminderHours) {
      const alreadySent = await hasExistingResultConfirmationReminderEvent({
        supabase,
        matchId: candidate.match.id,
        reminderHour,
      });

      if (!alreadySent) {
        reminderHourToSend = reminderHour;
        break;
      }
    }

    if (!reminderHourToSend) {
      continue;
    }

    const eventId = await createActivityEvent({
      supabase,
      match: candidate.match,
      type: "match_result_confirmation_reminder",
      title: "Confirma el resultado",
      description: `Revisa el resultado de tu partido de la Jornada ${candidate.match.round}.`,
      metadata: {
        round: candidate.match.round,
        reminderHour: reminderHourToSend,
        participantIds: candidate.participantIds,
        targetPlayerIds: candidate.missingPlayerIds,
        resultRecordedAt: candidate.match.result_recorded_at,
        automatic: true,
      },
    });

    eventIds.push(eventId);
  }

  let sent = 0;

  for (const eventId of eventIds) {
    const result = await dispatchPushForActivityEvent(eventId);
    sent += result.sent;
  }

  return NextResponse.json({
    ok: true,
    created: eventIds.length,
    sent,
    autoValidated: autoConfirmationRows.length,
  });
}
