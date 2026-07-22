import type {
  ManualCalendarMatchDraft,
  SeasonScheduleMode,
} from "@/lib/calendar";
import type {
  RoundWindowMode,
  SeasonRoundSettings,
  SeasonSnapshot,
} from "@/context/SeasonSettingsProvider";
import type { RosterMode, UserLeagueMembership } from "@/data/fakeData";
import type { MatchData } from "@/context/MatchDataProvider";

async function readSeasonApiPayload<T>(
  response: Response,
  errorPrefix: string,
): Promise<T> {
  const payload = (await response
    .json()
    .catch(() => null)) as (T & { message?: string; error?: string }) | null;

  if (!response.ok) {
    throw new Error(
      payload?.error || payload?.message || `${errorPrefix}-${response.status}`,
    );
  }

  if (!payload) {
    throw new Error(`${errorPrefix}-empty`);
  }

  return payload;
}

export async function updateSupabaseSeasonRoundSettings(
  settings: SeasonRoundSettings,
) {
  await readSeasonApiPayload(
    await fetch(
      `/api/leagues/${encodeURIComponent(settings.leagueId)}/seasons/${encodeURIComponent(settings.seasonId)}/settings`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundWindowMode: settings.roundWindowMode,
          seasonStartsAt: settings.seasonStartsAt,
          roundWindowDays: settings.roundWindowDays,
          requiresThreeSets: settings.requiresThreeSets,
          mvpSystem: settings.mvpSystem,
          resultConfirmationMode: settings.resultConfirmationMode,
          manualActiveRound: settings.manualActiveRound,
          manualCompletedRounds: settings.manualCompletedRounds,
          registrationFee: settings.registrationFee,
        }),
        cache: "no-store",
      },
    ),
    "season-settings-api",
  );
}

export async function finishSupabaseActiveSeason({
  leagueId,
  seasonId,
}: {
  leagueId: string;
  seasonId: string;
}): Promise<SeasonSnapshot> {
  const payload = await readSeasonApiPayload<{ snapshot?: SeasonSnapshot }>(
    await fetch(
      `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/finish`,
      {
        method: "POST",
        cache: "no-store",
      },
    ),
    "season-finish-api",
  );

  if (!payload.snapshot) {
    throw new Error("season-finish-api-empty");
  }

  return payload.snapshot;
}

export async function startSupabaseExistingSeason({
  leagueId,
  seasonId,
}: {
  leagueId: string;
  seasonId: string;
}): Promise<{ snapshot: SeasonSnapshot; matches: MatchData[] }> {
  const payload = await readSeasonApiPayload<{
    snapshot?: SeasonSnapshot;
    matches?: MatchData[];
  }>(
    await fetch(
      `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/start`,
      {
        method: "POST",
        cache: "no-store",
      },
    ),
    "season-start-api",
  );

  if (!payload.snapshot) {
    throw new Error("season-start-api-empty");
  }

  return {
    snapshot: payload.snapshot,
    matches: payload.matches ?? [],
  };
}

export async function deleteSupabaseSeason({
  leagueId,
  seasonId,
}: {
  leagueId: string;
  seasonId: string;
}): Promise<SeasonSnapshot> {
  const payload = await readSeasonApiPayload<{ snapshot?: SeasonSnapshot }>(
    await fetch(
      `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}`,
      {
        method: "DELETE",
        cache: "no-store",
      },
    ),
    "season-delete-api",
  );

  if (!payload.snapshot) {
    throw new Error("season-delete-api-empty");
  }

  return payload.snapshot;
}

export async function deleteSupabaseRoundMatches({
  leagueId,
  seasonId,
  round,
}: {
  leagueId: string;
  seasonId: string;
  round: number;
}) {
  await readSeasonApiPayload(
    await fetch(
      `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/rounds/${encodeURIComponent(String(round))}/matches`,
      {
        method: "DELETE",
        cache: "no-store",
      },
    ),
    "season-round-delete-api",
  );
}

export async function updateSupabaseSeasonRoundOrder({
  leagueId,
  seasonId,
  roundOrder,
}: {
  leagueId: string;
  seasonId: string;
  roundOrder: number[];
}) {
  await readSeasonApiPayload(
    await fetch(
      `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/round-order`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundOrder }),
        cache: "no-store",
      },
    ),
    "season-round-order-api",
  );
}

export async function replaceSupabaseUpcomingSeasonBalancedCalendar({
  leagueId,
  seasonId,
  playerIds,
  scheduleMode = "single",
}: {
  leagueId: string;
  seasonId: string;
  playerIds: string[];
  scheduleMode?: SeasonScheduleMode;
}): Promise<MatchData[]> {
  const payload = await readSeasonApiPayload<{ matches?: MatchData[] }>(
    await fetch(
      `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/repair-calendar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerIds,
          scheduleMode,
        }),
        cache: "no-store",
      },
    ),
    "season-repair-api",
  );

  if (!payload.matches) {
    throw new Error("season-repair-api-empty");
  }

  return payload.matches;
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
  mvpSystem,
  resultConfirmationMode,
  manualMatches,
  scheduleMode = "single",
  registrationFeeEnabled = false,
  registrationFeeAmount = 0,
  registrationFeePurpose = "",
  selfPlayerValue,
  rosterMode = "fixed",
  playerCapacity,
  calendarMode = "balanced",
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
  mvpSystem: SeasonRoundSettings["mvpSystem"];
  resultConfirmationMode: SeasonRoundSettings["resultConfirmationMode"];
  manualMatches?: ManualCalendarMatchDraft[];
  scheduleMode?: SeasonScheduleMode;
  registrationFeeEnabled?: boolean;
  registrationFeeAmount?: number;
  registrationFeePurpose?: string;
  selfPlayerValue?: string | null;
  rosterMode?: RosterMode;
  playerCapacity: number;
  calendarMode?: "balanced" | "manual";
}): Promise<{
  matches: MatchData[];
  seasonSnapshot: SeasonSnapshot;
  linkedMembership: UserLeagueMembership | null;
}> {
  const payload = await readSeasonApiPayload<{
    matches?: MatchData[];
    seasonSnapshot?: SeasonSnapshot;
    linkedMembership?: UserLeagueMembership | null;
  }>(
    await fetch(`/api/leagues/${encodeURIComponent(leagueId)}/seasons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activeSeasonId,
        name,
        playerIds,
        newPlayerNames,
        roundWindowMode,
        seasonStartsAt,
        roundWindowDays,
        requiresThreeSets,
        mvpSystem,
        resultConfirmationMode,
        manualMatches,
        scheduleMode,
        registrationFeeEnabled,
        registrationFeeAmount,
        registrationFeePurpose,
        selfPlayerValue,
        rosterMode,
        playerCapacity,
        calendarMode,
      }),
      cache: "no-store",
    }),
    "season-create-api",
  );

  if (!payload.matches || !payload.seasonSnapshot) {
    throw new Error("season-create-api-empty");
  }

  return {
    matches: payload.matches,
    seasonSnapshot: payload.seasonSnapshot,
    linkedMembership: payload.linkedMembership ?? null,
  };
}

export async function duplicateSupabaseSeason({
  leagueId,
  seasonId,
  name,
}: {
  leagueId: string
  seasonId: string
  name: string
}): Promise<{ snapshot: SeasonSnapshot; matches: MatchData[] }> {
  const payload = await readSeasonApiPayload<{
    snapshot?: SeasonSnapshot
    matches?: MatchData[]
  }>(
    await fetch(
      `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/duplicate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        cache: "no-store",
      },
    ),
    "season-duplicate-api",
  )

  if (!payload.snapshot) {
    throw new Error("season-duplicate-api-empty")
  }

  return {
    snapshot: payload.snapshot,
    matches: payload.matches ?? [],
  }
}
