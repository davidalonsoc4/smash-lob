"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { allMatches } from "@/data/fakeData";
import {
  generateBalancedCalendar,
  type SeasonScheduleMode,
} from "@/lib/calendar";
import { getRoundMvpSelection } from "@/lib/mvp";
import { calculateSeasonRanking } from "@/lib/ranking";
import { getMatchResultConfirmationState } from "@/lib/resultConfirmations";
import {
  buildCourtBooking,
  getEmptyCourtBooking,
  setCourtBookingTransferPaidStatus,
  normalizeCourtBooking,
} from "@/lib/courtBooking";
import { useSeasonSettings } from "@/context/SeasonSettingsProvider";
import { recordActivityEvent, type ActivityEventType } from "@/lib/activity";
import { dateTimeLocalToUtcIso } from "@/lib/matchScheduleTime";
import {
  clearSupabaseMatchResult,
  clearSupabaseMatchSchedule,
  finishSupabaseMatch,
  formatScheduleDateLabel,
  postponeSupabaseMatch,
  updateSupabaseMatchResultLock,
  updateSupabaseCourtBooking,
  updateSupabaseMatchSchedule,
} from "@/lib/supabaseMatches";
import { finishSupabaseActiveSeason } from "@/lib/supabaseSeasons";
import { getScheduleLocationFallbackText } from "@/lib/leagueLocations";
import {
  clearSupabaseMatchResultConfirmations,
  fetchSupabaseMatchResultConfirmations,
  upsertSupabaseMatchResultConfirmation,
  type MatchResultConfirmation,
  type MatchResultConfirmationStatus,
} from "@/lib/supabaseMatchConfirmations";

export type MatchStatus = "finished" | "scheduling" | "scheduled" | "postponed";

export type CourtBookingReservation = {
  playerId: string;
  amount: number;
};

export type CourtBookingTransfer = {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
};

export type CourtBooking = {
  isReserved: boolean;
  reservations: CourtBookingReservation[];
  ballPurchases: CourtBookingReservation[];
  transfers: CourtBookingTransfer[];
  updatedAt: string | null;
};

export type MatchData = {
  id: string;
  leagueId: string;
  seasonId: string;
  round: number;
  status: MatchStatus;
  teamA: string[];
  teamB: string[];
  pointsA: number | null;
  pointsB: number | null;
  sets: { a: number; b: number }[];
  scheduledAt: string | null;
  dateLabel: string | null;
  location: string | null;
  resultRecordedAt: string | null;
  resultReportedByPlayerId: string | null;
  resultLocked: boolean;
  resultCounts?: boolean;
  courtBooking: CourtBooking;
};

type MatchScheduleInput = {
  scheduledAt: string;
  location: string;
};

type MatchResultInput = {
  sets: { a: number; b: number }[];
};

type CourtBookingInput = {
  participantIds: string[];
  reservations: CourtBookingReservation[];
  ballPurchases: CourtBookingReservation[];
};

type MatchDataContextValue = {
  matches: MatchData[];
  resultConfirmations: MatchResultConfirmation[];
  hydrateMatches: (matches: MatchData[]) => void;
  replaceSeasonMatches: (seasonId: string, matches: MatchData[]) => void;
  createSeasonMatches: (settings: {
    leagueId: string;
    seasonId: string;
    playerIds: string[];
    scheduleMode?: SeasonScheduleMode;
  }) => MatchData[];
  updateMatchSchedule: (
    matchId: string,
    schedule: MatchScheduleInput,
  ) => Promise<boolean>;
  postponeMatch: (matchId: string) => Promise<boolean>;
  clearMatchSchedule: (matchId: string) => Promise<boolean>;
  finishMatch: (
    matchId: string,
    result: MatchResultInput,
    reportedByPlayerId: string | null,
  ) => Promise<boolean>;
  clearMatchResult: (matchId: string) => Promise<boolean>;
  setMatchResultLocked: (
    matchId: string,
    locked: boolean,
  ) => Promise<boolean>;
  setMatchResultConfirmation: (input: {
    matchId: string;
    playerId: string;
    status: MatchResultConfirmationStatus;
  }) => Promise<boolean>;
  deleteSeasonMatches: (seasonId: string) => void;
  deleteRoundMatches: (seasonId: string, round: number) => void;
  reorderSeasonRounds: (settings: {
    seasonId: string;
    roundOrder: number[];
  }) => void;
  updateCourtBooking: (
    matchId: string,
    bookingInput: CourtBookingInput,
  ) => Promise<boolean>;
  clearCourtBooking: (matchId: string) => Promise<boolean>;
  updateCourtBookingTransferPaymentStatus: (
    matchId: string,
    transferId: string,
    isPaid: boolean,
  ) => Promise<boolean>;
  sendCourtBookingPaymentReminder: (
    matchId: string,
    transferIds?: string[],
  ) => Promise<boolean>;
};

type MatchDataProviderProps = {
  children: React.ReactNode;
};

const MatchDataContext = createContext<MatchDataContextValue | null>(null);

const storageKey = "smash-lob-matches";
const confirmationsStorageKey = "smash-lob-match-result-confirmations";
const lastSupabaseErrorStorageKey = "smash-lob-last-supabase-error";
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeMatch(match: (typeof allMatches)[number]): MatchData {
  return {
    id: match.id,
    leagueId: match.leagueId,
    seasonId: match.seasonId,
    round: match.round,
    status: match.status as MatchStatus,
    teamA: [...match.teamA],
    teamB: [...match.teamB],
    pointsA: match.pointsA,
    pointsB: match.pointsB,
    sets: match.sets.map((set) => ({ ...set })),
    scheduledAt: match.scheduledAt,
    dateLabel: match.dateLabel,
    location: match.location,
    resultRecordedAt: match.resultRecordedAt ?? null,
    resultReportedByPlayerId: match.resultReportedByPlayerId ?? null,
    resultLocked: match.resultLocked ?? false,
    courtBooking: getEmptyCourtBooking(),
  };
}

function getInitialMatches() {
  return allMatches.map(normalizeMatch);
}

function sanitizeMatch(match: MatchData): MatchData {
  const cleanMatch = {
    ...match,
    resultReportedByPlayerId:
      typeof match.resultReportedByPlayerId === "string"
        ? match.resultReportedByPlayerId
        : null,
    resultLocked: Boolean(match.resultLocked),
    courtBooking: normalizeCourtBooking(match.courtBooking),
  };

  if (cleanMatch.status !== "postponed") {
    return cleanMatch;
  }

  return {
    ...cleanMatch,
    scheduledAt: null,
    dateLabel: null,
    location: null,
  };
}

function calculateResultPoints(sets: { a: number; b: number }[]) {
  const pointsA = sets.filter((set) => set.a > set.b).length;
  const pointsB = sets.filter((set) => set.b > set.a).length;

  return {
    pointsA,
    pointsB,
  };
}

function parseStoredMatches(value: string | null): MatchData[] | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const initialMatches = getInitialMatches();

    const mergedInitialMatches = initialMatches.map((initialMatch) => {
      const storedMatch = parsed.find(
        (item: Partial<MatchData>) => item.id === initialMatch.id,
      ) as Partial<MatchData> | undefined;

      if (!storedMatch) {
        return initialMatch;
      }

      const mergedMatch = {
        ...initialMatch,
        ...storedMatch,
        scheduledAt: storedMatch.scheduledAt ?? initialMatch.scheduledAt,
        dateLabel: storedMatch.dateLabel ?? initialMatch.dateLabel,
        location: storedMatch.location ?? initialMatch.location,
        resultRecordedAt:
          storedMatch.resultRecordedAt ?? initialMatch.resultRecordedAt,
        resultReportedByPlayerId:
          storedMatch.resultReportedByPlayerId ??
          initialMatch.resultReportedByPlayerId,
        resultLocked: storedMatch.resultLocked ?? initialMatch.resultLocked,
        courtBooking: normalizeCourtBooking(storedMatch.courtBooking),
      };

      return sanitizeMatch(mergedMatch);
    });
    const extraMatches = parsed.filter((storedMatch: Partial<MatchData>) => {
      return (
        typeof storedMatch.id === "string" &&
        !initialMatches.some(
          (initialMatch) => initialMatch.id === storedMatch.id,
        )
      );
    }) as MatchData[];

    return [...mergedInitialMatches, ...extraMatches.map(sanitizeMatch)];
  } catch {
    return null;
  }
}

function mergeMatches(current: MatchData[], incoming: MatchData[]) {
  const items = new Map(current.map((match) => [match.id, match]));

  incoming.forEach((match) => {
    items.set(match.id, sanitizeMatch(match));
  });

  return Array.from(items.values());
}

function replaceMatch(currentMatches: MatchData[], updatedMatch: MatchData) {
  const exists = currentMatches.some((match) => match.id === updatedMatch.id);

  if (!exists) {
    return [...currentMatches, sanitizeMatch(updatedMatch)];
  }

  return currentMatches.map((match) =>
    match.id === updatedMatch.id ? sanitizeMatch(updatedMatch) : match,
  );
}

function isSupabaseBackedMatch(matchId: string) {
  return supabaseUuidPattern.test(matchId);
}

function recordSupabaseError(action: string, error: unknown) {
  const details =
    typeof error === "object" && error !== null
      ? error
      : { message: String(error) };

  window.localStorage.setItem(
    lastSupabaseErrorStorageKey,
    JSON.stringify({
      action,
      ...details,
      createdAt: new Date().toISOString(),
    }),
  );
}

function getLocalScheduledMatch(
  match: MatchData,
  schedule: MatchScheduleInput,
): MatchData {
  return {
    ...match,
    status: match.status === "finished" ? "finished" : "scheduled",
    scheduledAt: dateTimeLocalToUtcIso(schedule.scheduledAt),
    dateLabel: formatScheduleDateLabel(
      dateTimeLocalToUtcIso(schedule.scheduledAt),
    ),
    location: schedule.location,
  };
}

function getLocalPostponedMatch(match: MatchData): MatchData {
  if (match.status === "finished") {
    return match;
  }

  return {
    ...match,
    status: "postponed",
    scheduledAt: null,
    dateLabel: null,
    location: null,
  };
}

function getLocalClearedScheduleMatch(match: MatchData): MatchData {
  if (match.status === "finished") {
    return match;
  }

  return {
    ...match,
    status: "scheduling",
    scheduledAt: null,
    dateLabel: null,
    location: null,
  };
}

function getLocalFinishedMatch(
  match: MatchData,
  result: MatchResultInput,
  reportedByPlayerId: string | null,
): MatchData {
  const points = calculateResultPoints(result.sets);

  return {
    ...match,
    status: "finished",
    sets: result.sets,
    pointsA: points.pointsA,
    pointsB: points.pointsB,
    resultRecordedAt: new Date().toISOString(),
    resultReportedByPlayerId: reportedByPlayerId,
    resultLocked: false,
  };
}

function getLocalClearedResultMatch(match: MatchData): MatchData {
  return {
    ...match,
    status: match.scheduledAt ? "scheduled" : "scheduling",
    sets: [],
    pointsA: null,
    pointsB: null,
    resultRecordedAt: null,
    resultReportedByPlayerId: null,
    resultLocked: false,
  };
}

function getSetsSummary(sets: { a: number; b: number }[]) {
  if (sets.length === 0) {
    return "sin juegos registrados";
  }

  return sets.map((set) => `${set.a}-${set.b}`).join(", ");
}

function getResultSummary(match: MatchData) {
  if (match.pointsA === null || match.pointsB === null) {
    return "Resultado sin puntos registrados";
  }

  return `Sets ${match.pointsA}-${match.pointsB} · Juegos: ${getSetsSummary(match.sets)}`;
}

function getBookingTotal(match: MatchData) {
  return [
    ...match.courtBooking.reservations,
    ...match.courtBooking.ballPurchases,
  ].reduce((total, payment) => total + payment.amount, 0);
}

function formatActivityMoney(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function getSeasonWinnerName({
  seasonId,
  playerProfiles,
  seasonPlayers,
  matches,
}: {
  seasonId: string;
  playerProfiles: Parameters<
    typeof calculateSeasonRanking
  >[0]["playerProfiles"];
  seasonPlayers: Parameters<typeof calculateSeasonRanking>[0]["seasonPlayers"];
  matches: Parameters<typeof calculateSeasonRanking>[0]["matches"];
}) {
  return (
    calculateSeasonRanking({
      seasonId,
      playerProfiles,
      seasonPlayers,
      matches,
    })[0]?.displayName ?? null
  );
}

function getActivityMatchDescription(match: MatchData, extra?: string | null) {
  const parts = [`Jornada ${match.round}`];

  if (extra) {
    parts.push(extra);
  }

  return parts.join(" · ");
}

function parseStoredConfirmations(
  value: string | null,
): MatchResultConfirmation[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is MatchResultConfirmation => {
      if (typeof item !== "object" || item === null) {
        return false;
      }

      const confirmation = item as Partial<MatchResultConfirmation>;

      return (
        typeof confirmation.matchId === "string" &&
        typeof confirmation.playerId === "string" &&
        (confirmation.status === "confirmed" ||
          confirmation.status === "disputed") &&
        typeof confirmation.updatedAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function mergeConfirmations(
  current: MatchResultConfirmation[],
  incoming: MatchResultConfirmation[],
) {
  const items = new Map(
    current.map((confirmation) => [
      `${confirmation.matchId}:${confirmation.playerId}`,
      confirmation,
    ]),
  );

  incoming.forEach((confirmation) => {
    items.set(`${confirmation.matchId}:${confirmation.playerId}`, confirmation);
  });

  return Array.from(items.values());
}

export function MatchDataProvider({ children }: MatchDataProviderProps) {
  const { data: session } = useSession();
  const {
    finishSeason,
    getSeasonRoundSettings,
    hydrateSeasonSnapshot,
    playerProfiles,
    seasonPlayers,
    seasons,
  } = useSeasonSettings();
  const actorEmail =
    session?.user?.email?.trim().toLowerCase() || "usuario@smash-lob.local";
  const actorDisplayName = session?.user?.name ?? null;
  const [matches, setMatches] = useState<MatchData[]>(getInitialMatches);
  const [resultConfirmations, setResultConfirmations] = useState<
    MatchResultConfirmation[]
  >([]);

  const applyResultCountState = useCallback(
    (sourceMatches: MatchData[], confirmations: MatchResultConfirmation[]) =>
      sourceMatches.map((match) => ({
        ...match,
        resultCounts: getMatchResultConfirmationState({
          matchId: match.id,
          participantIds: [...match.teamA, ...match.teamB],
          reporterPlayerId: match.resultReportedByPlayerId,
          resultRecordedAt: match.resultRecordedAt,
          resultLocked: match.resultLocked,
          confirmations,
          mode: getSeasonRoundSettings(match.seasonId).resultConfirmationMode,
        }).countsForRanking,
      })),
    [getSeasonRoundSettings],
  );

  useEffect(() => {
    const storedMatches = parseStoredMatches(
      window.localStorage.getItem(storageKey),
    );

    if (storedMatches) {
      window.setTimeout(() => {
        setMatches(storedMatches);
        window.localStorage.setItem(storageKey, JSON.stringify(storedMatches));
      }, 0);
    }

    const storedConfirmations = parseStoredConfirmations(
      window.localStorage.getItem(confirmationsStorageKey),
    );

    if (storedConfirmations.length > 0) {
      window.setTimeout(() => setResultConfirmations(storedConfirmations), 0);
    }
  }, []);

  const persistNextMatches = useCallback((nextMatches: MatchData[]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(nextMatches));
    return nextMatches;
  }, []);

  const persistConfirmations = useCallback(
    (nextConfirmations: MatchResultConfirmation[]) => {
      window.localStorage.setItem(
        confirmationsStorageKey,
        JSON.stringify(nextConfirmations),
      );
      return nextConfirmations;
    },
    [],
  );

  const supabaseMatchIds = useMemo(
    () => matches.map((match) => match.id).filter(isSupabaseBackedMatch),
    [matches],
  );
  const supabaseMatchIdKey = supabaseMatchIds.join("|");

  useEffect(() => {
    if (!supabaseMatchIdKey) {
      return;
    }

    fetchSupabaseMatchResultConfirmations(supabaseMatchIds)
      .then((incomingConfirmations) => {
        setResultConfirmations((currentConfirmations) =>
          persistConfirmations(
            mergeConfirmations(currentConfirmations, incomingConfirmations),
          ),
        );
      })
      .catch((error) => {
        recordSupabaseError("fetch-match-result-confirmations", error);
      });
  }, [persistConfirmations, supabaseMatchIdKey, supabaseMatchIds]);

  const recordMatchActivity = useCallback(
    async ({
      match,
      type,
      title,
      description,
      metadata,
    }: {
      match: MatchData;
      type: ActivityEventType;
      title: string;
      description?: string | null;
      metadata?: Record<string, unknown>;
    }) => {
      if (!isSupabaseBackedMatch(match.id)) {
        return;
      }

      try {
        await recordActivityEvent({
          leagueId: match.leagueId,
          seasonId: match.seasonId,
          matchId: match.id,
          actorEmail,
          actorDisplayName,
          type,
          title,
          description,
          metadata: {
            participantIds: [...match.teamA, ...match.teamB],
            round: match.round,
            ...(metadata ?? {}),
            actorEmailFallbackUsed: actorEmail === "usuario@smash-lob.local",
          },
        });
      } catch (error) {
        recordSupabaseError("record-activity", error);
      }
    },
    [actorDisplayName, actorEmail],
  );

  const hydrateMatches = useCallback(
    (incomingMatches: MatchData[]) => {
      setMatches((currentMatches) => {
        const nextMatches = mergeMatches(currentMatches, incomingMatches);

        return persistNextMatches(nextMatches);
      });
    },
    [persistNextMatches],
  );

  const replaceSeasonMatches = useCallback(
    (seasonId: string, incomingMatches: MatchData[]) => {
      setMatches((currentMatches) =>
        persistNextMatches([
          ...currentMatches.filter((match) => match.seasonId !== seasonId),
          ...incomingMatches,
        ]),
      );
    },
    [persistNextMatches],
  );

  const createSeasonMatches = useCallback(
    ({
      leagueId,
      seasonId,
      playerIds,
      scheduleMode = "single",
    }: {
      leagueId: string;
      seasonId: string;
      playerIds: string[];
      scheduleMode?: SeasonScheduleMode;
    }) => {
      const seasonMatches = generateBalancedCalendar({
        leagueId,
        seasonId,
        playerIds,
        scheduleMode,
      }).map((match) => ({
        ...match,
        courtBooking: getEmptyCourtBooking(),
      }));

      setMatches((currentMatches) => {
        const existingIds = new Set(currentMatches.map((match) => match.id));
        const nextMatches = [
          ...currentMatches,
          ...seasonMatches.filter((match) => !existingIds.has(match.id)),
        ];

        return persistNextMatches(nextMatches);
      });

      return seasonMatches;
    },
    [persistNextMatches],
  );

  const updateMatchSchedule = useCallback(
    async (matchId: string, schedule: MatchScheduleInput) => {
      const currentMatch = matches.find((match) => match.id === matchId);

      if (!currentMatch) {
        return false;
      }

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId
                ? getLocalScheduledMatch(match, schedule)
                : match,
            ),
          ),
        );
        return true;
      }

      try {
        const updatedMatch = await updateSupabaseMatchSchedule({
          matchId,
          scheduledAt: schedule.scheduledAt,
          location: schedule.location,
        });

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch)),
        );

        const wasAlreadyScheduled = Boolean(
          currentMatch.scheduledAt || currentMatch.status === "scheduled",
        );

        await recordMatchActivity({
          match: updatedMatch,
          type: wasAlreadyScheduled
            ? "match_schedule_updated"
            : "match_scheduled",
          title: wasAlreadyScheduled
            ? "Programación modificada"
            : "Partido programado",
          description: getActivityMatchDescription(
            updatedMatch,
            [
              updatedMatch.dateLabel,
              getScheduleLocationFallbackText(updatedMatch.location),
            ]
              .filter(Boolean)
              .join(" · "),
          ),
          metadata: {
            previousScheduledAt: currentMatch.scheduledAt,
            previousLocation: currentMatch.location,
            scheduledAt: updatedMatch.scheduledAt,
            location: updatedMatch.location,
          },
        });

        return true;
      } catch (error) {
        recordSupabaseError("update-match-schedule", error);
        return false;
      }
    },
    [matches, persistNextMatches, recordMatchActivity],
  );

  const postponeMatch = useCallback(
    async (matchId: string) => {
      const currentMatch = matches.find((match) => match.id === matchId);

      if (!currentMatch) {
        return false;
      }

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId ? getLocalPostponedMatch(match) : match,
            ),
          ),
        );
        return true;
      }

      try {
        const updatedMatch = await postponeSupabaseMatch(matchId);

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch)),
        );

        await recordMatchActivity({
          match: updatedMatch,
          type: "match_postponed",
          title: "Partido aplazado",
          description: getActivityMatchDescription(updatedMatch),
        });

        return true;
      } catch (error) {
        recordSupabaseError("postpone-match", error);
        return false;
      }
    },
    [matches, persistNextMatches, recordMatchActivity],
  );

  const clearMatchSchedule = useCallback(
    async (matchId: string) => {
      const currentMatch = matches.find((match) => match.id === matchId);

      if (!currentMatch || currentMatch.status === "finished") {
        return false;
      }

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId
                ? getLocalClearedScheduleMatch(match)
                : match,
            ),
          ),
        );
        return true;
      }

      try {
        const updatedMatch = await clearSupabaseMatchSchedule(matchId);

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch)),
        );

        await recordMatchActivity({
          match: updatedMatch,
          type: "match_schedule_updated",
          title: "Programación eliminada",
          description: getActivityMatchDescription(
            updatedMatch,
            "Sin fecha, hora ni lugar",
          ),
          metadata: {
            previousScheduledAt: currentMatch.scheduledAt,
            previousLocation: currentMatch.location,
            scheduledAt: null,
            location: null,
            scheduleCleared: true,
          },
        });

        return true;
      } catch (error) {
        recordSupabaseError("clear-match-schedule", error);
        return false;
      }
    },
    [matches, persistNextMatches, recordMatchActivity],
  );

  const finishMatch = useCallback(
    async (
      matchId: string,
      result: MatchResultInput,
      reportedByPlayerId: string | null,
    ) => {
      const currentMatch = matches.find((match) => match.id === matchId);

      if (!currentMatch) {
        return false;
      }

      const seasonSettings = getSeasonRoundSettings(currentMatch.seasonId);
      const mvpSystem = seasonSettings.mvpSystem;
      const resultConfirmationMode = seasonSettings.resultConfirmationMode;

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId
                ? getLocalFinishedMatch(match, result, reportedByPlayerId)
                : match,
            ),
          ),
        );
        setResultConfirmations((currentConfirmations) =>
          persistConfirmations(
            currentConfirmations.filter((item) => item.matchId !== matchId),
          ),
        );
        return true;
      }

      try {
        const previousRoundMvp = getRoundMvpSelection({
          leagueId: currentMatch.leagueId,
          seasonId: currentMatch.seasonId,
          round: currentMatch.round,
          matches,
          mvpSystem,
        });
        const updatedMatch = await finishSupabaseMatch({
          matchId,
          result,
          reportedByPlayerId,
        });
        const nextMatches = replaceMatch(matches, updatedMatch);
        const nextConfirmations = resultConfirmations.filter(
          (item) => item.matchId !== matchId,
        );
        const calculatedNextMatches = applyResultCountState(
          nextMatches,
          nextConfirmations,
        );
        const nextRoundMvp = getRoundMvpSelection({
          leagueId: updatedMatch.leagueId,
          seasonId: updatedMatch.seasonId,
          round: updatedMatch.round,
          matches: calculatedNextMatches,
          mvpSystem,
        });

        setMatches(() => persistNextMatches(nextMatches));
        try {
          await clearSupabaseMatchResultConfirmations(matchId);
        } catch (confirmationError) {
          recordSupabaseError(
            "clear-match-result-confirmations-after-save",
            confirmationError,
          );
        }
        setResultConfirmations((currentConfirmations) =>
          persistConfirmations(
            currentConfirmations.filter((item) => item.matchId !== matchId),
          ),
        );

        const wasAlreadyFinished = Boolean(
          currentMatch.status === "finished" ||
          currentMatch.resultRecordedAt ||
          currentMatch.pointsA !== null ||
          currentMatch.pointsB !== null ||
          currentMatch.sets.length > 0,
        );
        const previousResultSummary = getResultSummary(currentMatch);
        const currentResultSummary = getResultSummary(updatedMatch);

        await recordMatchActivity({
          match: updatedMatch,
          type: wasAlreadyFinished
            ? "match_result_updated"
            : "match_result_saved",
          title: wasAlreadyFinished
            ? "Resultado modificado"
            : "Resultado registrado",
          description: getActivityMatchDescription(
            updatedMatch,
            wasAlreadyFinished
              ? `${previousResultSummary} → ${currentResultSummary}`
              : currentResultSummary,
          ),
          metadata: {
            previousPointsA: currentMatch.pointsA,
            previousPointsB: currentMatch.pointsB,
            previousSets: currentMatch.sets,
            pointsA: updatedMatch.pointsA,
            pointsB: updatedMatch.pointsB,
            sets: updatedMatch.sets,
            resultConfirmationMode,
            resultReportedByPlayerId: updatedMatch.resultReportedByPlayerId,
          },
        });

        if (mvpSystem === "automatic" && !previousRoundMvp && nextRoundMvp) {
          await recordMatchActivity({
            match: updatedMatch,
            type: "round_mvp_awarded",
            title: `MVP de Jornada ${updatedMatch.round} decidido`,
            description: getActivityMatchDescription(
              updatedMatch,
              `Pareja MVP automática · ${nextRoundMvp.gamesFor}-${nextRoundMvp.gamesAgainst} juegos · ${nextRoundMvp.gamesDiff ?? 0} dif.`,
            ),
            metadata: {
              round: updatedMatch.round,
              playerIds: nextRoundMvp.playerIds,
              gamesFor: nextRoundMvp.gamesFor,
              gamesAgainst: nextRoundMvp.gamesAgainst,
              gamesDiff: nextRoundMvp.gamesDiff,
              setsFor: nextRoundMvp.setsFor,
              setsAgainst: nextRoundMvp.setsAgainst,
            },
          });
        }

        const targetSeason = seasons.find(
          (season) => season.id === updatedMatch.seasonId,
        );
        const seasonMatches = nextMatches.filter(
          (match) => match.seasonId === updatedMatch.seasonId,
        );
        const shouldAutoFinishSeason = Boolean(
          targetSeason?.status === "active" &&
          updatedMatch.round === targetSeason.totalRounds &&
          seasonMatches.length > 0 &&
          calculatedNextMatches
            .filter((match) => match.seasonId === updatedMatch.seasonId)
            .every(
              (match) =>
                match.status === "finished" && match.resultCounts !== false,
            ),
        );

        if (shouldAutoFinishSeason) {
          try {
            const seasonSnapshot = await finishSupabaseActiveSeason({
              leagueId: updatedMatch.leagueId,
              seasonId: updatedMatch.seasonId,
            });

            hydrateSeasonSnapshot(seasonSnapshot);
          } catch (seasonError) {
            recordSupabaseError("auto-finish-season", seasonError);
          }

          finishSeason(updatedMatch.leagueId, updatedMatch.seasonId);

          const winnerName = getSeasonWinnerName({
            seasonId: updatedMatch.seasonId,
            playerProfiles,
            seasonPlayers,
            matches: calculatedNextMatches,
          });

          await recordMatchActivity({
            match: updatedMatch,
            type: "season_finished",
            title: "Temporada finalizada",
            description: winnerName
              ? `Enhorabuena a ${winnerName}, ganador de la temporada.`
              : "La temporada ha finalizado.",
            metadata: {
              automatic: true,
              totalRounds: targetSeason?.totalRounds ?? updatedMatch.round,
              winnerName,
            },
          });
        }

        return true;
      } catch (error) {
        recordSupabaseError("finish-match", error);
        return false;
      }
    },
    [
      applyResultCountState,
      finishSeason,
      getSeasonRoundSettings,
      hydrateSeasonSnapshot,
      matches,
      persistConfirmations,
      persistNextMatches,
      playerProfiles,
      recordMatchActivity,
      resultConfirmations,
      seasonPlayers,
      seasons,
    ],
  );

  const clearMatchResult = useCallback(
    async (matchId: string) => {
      const currentMatch = matches.find((match) => match.id === matchId);

      if (!currentMatch) {
        return false;
      }

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId ? getLocalClearedResultMatch(match) : match,
            ),
          ),
        );
        setResultConfirmations((currentConfirmations) =>
          persistConfirmations(
            currentConfirmations.filter((item) => item.matchId !== matchId),
          ),
        );
        return true;
      }

      try {
        const updatedMatch = await clearSupabaseMatchResult(matchId);
        await clearSupabaseMatchResultConfirmations(matchId);

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch)),
        );
        setResultConfirmations((currentConfirmations) =>
          persistConfirmations(
            currentConfirmations.filter((item) => item.matchId !== matchId),
          ),
        );

        await recordMatchActivity({
          match: updatedMatch,
          type: "match_result_cleared",
          title: "Resultado limpiado",
          description: getActivityMatchDescription(updatedMatch),
        });

        return true;
      } catch (error) {
        recordSupabaseError("clear-match-result", error);
        return false;
      }
    },
    [matches, persistConfirmations, persistNextMatches, recordMatchActivity],
  );

  const setMatchResultLocked = useCallback(
    async (matchId: string, locked: boolean) => {
      const currentMatch = matches.find((match) => match.id === matchId);

      if (!currentMatch || currentMatch.status !== "finished") {
        return false;
      }

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId ? { ...match, resultLocked: locked } : match,
            ),
          ),
        );
        return true;
      }

      try {
        const updatedMatch = await updateSupabaseMatchResultLock({
          matchId,
          locked,
        });

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch)),
        );

        await recordMatchActivity({
          match: updatedMatch,
          type: "match_result_updated",
          title: locked
            ? "Resultado fijado por administración"
            : "Resultado desbloqueado por administración",
          description: getActivityMatchDescription(
            updatedMatch,
            locked
              ? "El resultado queda marcado como definitivo."
              : "El resultado vuelve a admitir correcciones.",
          ),
          metadata: {
            pointsA: updatedMatch.pointsA,
            pointsB: updatedMatch.pointsB,
            sets: updatedMatch.sets,
            resultConfirmationMode: getSeasonRoundSettings(
              updatedMatch.seasonId,
            ).resultConfirmationMode,
            resultLockOnly: true,
            resultLocked: locked,
          },
        });

        return true;
      } catch (error) {
        recordSupabaseError("update-match-result-lock", error);
        return false;
      }
    },
    [
      getSeasonRoundSettings,
      matches,
      persistNextMatches,
      recordMatchActivity,
    ],
  );

  const setMatchResultConfirmation = useCallback(
    async ({
      matchId,
      playerId,
      status,
    }: {
      matchId: string;
      playerId: string;
      status: MatchResultConfirmationStatus;
    }) => {
      const match = matches.find((item) => item.id === matchId);

      if (
        !match ||
        match.status !== "finished" ||
        ![...match.teamA, ...match.teamB].includes(playerId)
      ) {
        return false;
      }

      const settings = getSeasonRoundSettings(match.seasonId);

      const currentValidation = getMatchResultConfirmationState({
        matchId: match.id,
        participantIds: [...match.teamA, ...match.teamB],
        reporterPlayerId: match.resultReportedByPlayerId,
        resultRecordedAt: match.resultRecordedAt,
        resultLocked: match.resultLocked,
        confirmations: resultConfirmations,
        mode: settings.resultConfirmationMode,
      });

      if (
        settings.resultConfirmationMode === "none" ||
        match.resultLocked ||
        playerId === match.resultReportedByPlayerId ||
        currentValidation.state === "validated" ||
        currentValidation.state === "auto_validated"
      ) {
        return false;
      }

      const confirmation: MatchResultConfirmation = {
        matchId,
        playerId,
        status,
        updatedAt: new Date().toISOString(),
      };

      if (isSupabaseBackedMatch(matchId)) {
        try {
          await upsertSupabaseMatchResultConfirmation(confirmation);
        } catch (error) {
          recordSupabaseError("upsert-match-result-confirmation", error);
          return false;
        }
      }

      const nextConfirmations = [
        ...resultConfirmations.filter(
          (item) => !(item.matchId === matchId && item.playerId === playerId),
        ),
        confirmation,
      ];

      setResultConfirmations(() => persistConfirmations(nextConfirmations));

      if (status === "disputed") {
        const targetPlayerIds = match.resultReportedByPlayerId
          ? [match.resultReportedByPlayerId]
          : [...match.teamA, ...match.teamB].filter(
              (participantId) => participantId !== playerId,
            );

        await recordMatchActivity({
          match,
          type: "match_result_disputed",
          title: "Resultado marcado como incorrecto",
          description: getActivityMatchDescription(
            match,
            "Un jugador ha indicado que el resultado necesita corregirse.",
          ),
          metadata: {
            targetPlayerIds,
            disputedByPlayerId: playerId,
            resultReportedByPlayerId: match.resultReportedByPlayerId,
          },
        });
      }

      const previousCalculatedMatches = applyResultCountState(
        matches,
        resultConfirmations,
      );
      const nextCalculatedMatches = applyResultCountState(
        matches,
        nextConfirmations,
      );
      const previousRoundMvp = getRoundMvpSelection({
        leagueId: match.leagueId,
        seasonId: match.seasonId,
        round: match.round,
        matches: previousCalculatedMatches,
        mvpSystem: settings.mvpSystem,
      });
      const nextRoundMvp = getRoundMvpSelection({
        leagueId: match.leagueId,
        seasonId: match.seasonId,
        round: match.round,
        matches: nextCalculatedMatches,
        mvpSystem: settings.mvpSystem,
      });

      if (
        settings.mvpSystem === "automatic" &&
        !previousRoundMvp &&
        nextRoundMvp
      ) {
        await recordMatchActivity({
          match,
          type: "round_mvp_awarded",
          title: `MVP de Jornada ${match.round} decidido`,
          description: `Pareja MVP automática · ${nextRoundMvp.gamesFor}-${nextRoundMvp.gamesAgainst} juegos · ${nextRoundMvp.gamesDiff ?? 0} dif.`,
          metadata: {
            round: match.round,
            playerIds: nextRoundMvp.playerIds,
            gamesFor: nextRoundMvp.gamesFor,
            gamesAgainst: nextRoundMvp.gamesAgainst,
            gamesDiff: nextRoundMvp.gamesDiff,
            setsFor: nextRoundMvp.setsFor,
            setsAgainst: nextRoundMvp.setsAgainst,
          },
        });
      }

      const targetSeason = seasons.find(
        (season) => season.id === match.seasonId,
      );
      const countedSeasonMatches = nextCalculatedMatches.filter(
        (item) => item.seasonId === match.seasonId,
      );
      const shouldAutoFinishSeason = Boolean(
        targetSeason?.status === "active" &&
        match.round === targetSeason.totalRounds &&
        countedSeasonMatches.length > 0 &&
        countedSeasonMatches.every(
          (item) => item.status === "finished" && item.resultCounts !== false,
        ),
      );

      if (shouldAutoFinishSeason) {
        if (isSupabaseBackedMatch(match.id)) {
          try {
            const seasonSnapshot = await finishSupabaseActiveSeason({
              leagueId: match.leagueId,
              seasonId: match.seasonId,
            });
            hydrateSeasonSnapshot(seasonSnapshot);
          } catch (seasonError) {
            recordSupabaseError(
              "auto-finish-season-after-confirmation",
              seasonError,
            );
          }
        }

        finishSeason(match.leagueId, match.seasonId);
        const winnerName = getSeasonWinnerName({
          seasonId: match.seasonId,
          playerProfiles,
          seasonPlayers,
          matches: nextCalculatedMatches,
        });

        await recordMatchActivity({
          match,
          type: "season_finished",
          title: "Temporada finalizada",
          description: winnerName
            ? `Enhorabuena a ${winnerName}, ganador de la temporada.`
            : "La temporada ha finalizado.",
          metadata: {
            automatic: true,
            totalRounds: targetSeason?.totalRounds ?? match.round,
            winnerName,
          },
        });
      }

      return true;
    },
    [
      applyResultCountState,
      finishSeason,
      getSeasonRoundSettings,
      hydrateSeasonSnapshot,
      matches,
      persistConfirmations,
      playerProfiles,
      recordMatchActivity,
      resultConfirmations,
      seasonPlayers,
      seasons,
    ],
  );

  const deleteSeasonMatches = useCallback(
    (seasonId: string) => {
      setMatches((currentMatches) =>
        persistNextMatches(
          currentMatches.filter((match) => match.seasonId !== seasonId),
        ),
      );
    },
    [persistNextMatches],
  );

  const deleteRoundMatches = useCallback(
    (seasonId: string, round: number) => {
      setMatches((currentMatches) =>
        persistNextMatches(
          currentMatches.filter(
            (match) => !(match.seasonId === seasonId && match.round === round),
          ),
        ),
      );
    },
    [persistNextMatches],
  );

  const reorderSeasonRounds = useCallback(
    ({ seasonId, roundOrder }: { seasonId: string; roundOrder: number[] }) => {
      const nextRoundByCurrentRound = new Map(
        roundOrder.map((round, index) => [round, index + 1]),
      );

      setMatches((currentMatches) =>
        persistNextMatches(
          currentMatches.map((match) => {
            if (match.seasonId !== seasonId) {
              return match;
            }

            const nextRound = nextRoundByCurrentRound.get(match.round);

            return typeof nextRound === "number"
              ? {
                  ...match,
                  round: nextRound,
                }
              : match;
          }),
        ),
      );
    },
    [persistNextMatches],
  );

  const updateCourtBooking = useCallback(
    async (matchId: string, bookingInput: CourtBookingInput) => {
      const currentMatch = matches.find((match) => match.id === matchId);

      if (!currentMatch) {
        return false;
      }

      const booking = buildCourtBooking({
        participantIds: bookingInput.participantIds,
        reservations: bookingInput.reservations,
        ballPurchases: bookingInput.ballPurchases,
        previousTransfers: currentMatch.courtBooking.transfers,
      });

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId
                ? { ...match, courtBooking: booking }
                : match,
            ),
          ),
        );
        return true;
      }

      try {
        const updatedMatch = await updateSupabaseCourtBooking({
          matchId,
          booking,
        });

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch)),
        );

        await recordMatchActivity({
          match: updatedMatch,
          type: "court_booking_updated",
          title: "Tienes pagos pendientes",
          description: getActivityMatchDescription(
            updatedMatch,
            `Total pagos y reservas: ${formatActivityMoney(getBookingTotal(updatedMatch))}`,
          ),
          metadata: {
            reservations: updatedMatch.courtBooking.reservations,
            ballPurchases: updatedMatch.courtBooking.ballPurchases,
            transfers: updatedMatch.courtBooking.transfers,
          },
        });

        return true;
      } catch (error) {
        recordSupabaseError("update-court-booking", error);
        return false;
      }
    },
    [matches, persistNextMatches, recordMatchActivity],
  );

  const clearCourtBooking = useCallback(
    async (matchId: string) => {
      const currentMatch = matches.find((match) => match.id === matchId);

      if (!currentMatch) {
        return false;
      }

      const booking = getEmptyCourtBooking();

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId
                ? { ...match, courtBooking: booking }
                : match,
            ),
          ),
        );
        return true;
      }

      try {
        const updatedMatch = await updateSupabaseCourtBooking({
          matchId,
          booking,
        });

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch)),
        );

        await recordMatchActivity({
          match: updatedMatch,
          type: "court_booking_cleared",
          title: "Reserva de pista eliminada",
          description: getActivityMatchDescription(updatedMatch),
        });

        return true;
      } catch (error) {
        recordSupabaseError("clear-court-booking", error);
        return false;
      }
    },
    [matches, persistNextMatches, recordMatchActivity],
  );

  const updateCourtBookingTransferPaymentStatus = useCallback(
    async (matchId: string, transferId: string, isPaid: boolean) => {
      const currentMatch = matches.find((match) => match.id === matchId);

      if (!currentMatch) {
        return false;
      }

      const booking = setCourtBookingTransferPaidStatus({
        booking: currentMatch.courtBooking,
        transferId,
        isPaid,
      });

      if (!isSupabaseBackedMatch(matchId)) {
        setMatches((currentMatches) =>
          persistNextMatches(
            currentMatches.map((match) =>
              match.id === matchId
                ? { ...match, courtBooking: booking }
                : match,
            ),
          ),
        );
        return true;
      }

      try {
        const updatedMatch = await updateSupabaseCourtBooking({
          matchId,
          booking,
        });

        setMatches((currentMatches) =>
          persistNextMatches(replaceMatch(currentMatches, updatedMatch)),
        );

        const updatedTransfer = updatedMatch.courtBooking.transfers.find(
          (transfer) => transfer.id === transferId,
        );

        if (isPaid) {
          await recordMatchActivity({
            match: updatedMatch,
            type: "court_booking_payment_paid",
            title: "Pago de pista recibido",
            description: getActivityMatchDescription(
              updatedMatch,
              updatedTransfer
                ? `${formatActivityMoney(updatedTransfer.amount)} pagado`
                : null,
            ),
            metadata: {
              transferId,
              paidTransfer: updatedTransfer ?? null,
            },
          });
        }

        return true;
      } catch (error) {
        recordSupabaseError(
          "update-court-booking-transfer-payment-status",
          error,
        );
        return false;
      }
    },
    [matches, persistNextMatches, recordMatchActivity],
  );

  const sendCourtBookingPaymentReminder = useCallback(
    async (matchId: string, transferIds?: string[]) => {
      const currentMatch = matches.find((match) => match.id === matchId);

      if (!currentMatch || !currentMatch.courtBooking.isReserved) {
        return false;
      }

      const transferIdSet = transferIds?.length ? new Set(transferIds) : null;
      const pendingTransfers = currentMatch.courtBooking.transfers.filter(
        (transfer) =>
          !transfer.isPaid &&
          (!transferIdSet || transferIdSet.has(transfer.id)),
      );

      if (pendingTransfers.length === 0 || !isSupabaseBackedMatch(matchId)) {
        return false;
      }

      try {
        await recordMatchActivity({
          match: currentMatch,
          type: "court_booking_payment_reminder",
          title: "Tienes pagos pendientes",
          description: getActivityMatchDescription(
            currentMatch,
            "Recordatorio de pago de reserva",
          ),
          metadata: {
            reservations: currentMatch.courtBooking.reservations,
            ballPurchases: currentMatch.courtBooking.ballPurchases,
            transfers: pendingTransfers,
            reminder: true,
          },
        });

        return true;
      } catch (error) {
        recordSupabaseError("send-court-booking-payment-reminder", error);
        return false;
      }
    },
    [matches, recordMatchActivity],
  );

  const value = useMemo(
    () => ({
      matches,
      resultConfirmations,
      hydrateMatches,
      replaceSeasonMatches,
      createSeasonMatches,
      updateMatchSchedule,
      postponeMatch,
      clearMatchSchedule,
      finishMatch,
      clearMatchResult,
      setMatchResultLocked,
      setMatchResultConfirmation,
      deleteSeasonMatches,
      deleteRoundMatches,
      reorderSeasonRounds,
      updateCourtBooking,
      clearCourtBooking,
      updateCourtBookingTransferPaymentStatus,
      sendCourtBookingPaymentReminder,
    }),
    [
      clearCourtBooking,
      clearMatchResult,
      clearMatchSchedule,
      createSeasonMatches,
      deleteRoundMatches,
      deleteSeasonMatches,
      finishMatch,
      hydrateMatches,
      replaceSeasonMatches,
      updateCourtBookingTransferPaymentStatus,
      matches,
      resultConfirmations,
      sendCourtBookingPaymentReminder,
      setMatchResultLocked,
      setMatchResultConfirmation,
      postponeMatch,
      reorderSeasonRounds,
      updateCourtBooking,
      updateMatchSchedule,
    ],
  );

  return (
    <MatchDataContext.Provider value={value}>
      {children}
    </MatchDataContext.Provider>
  );
}

export function useMatchData() {
  const context = useContext(MatchDataContext);

  if (!context) {
    throw new Error("useMatchData must be used inside MatchDataProvider");
  }

  return context;
}
