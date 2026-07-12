"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useMatchData } from "@/context/MatchDataProvider";
import { useSeasonSettings } from "@/context/SeasonSettingsProvider";
import { recordActivityEvent } from "@/lib/activity";
import {
  getMatchMvpSelection,
  getRoundMvpSelection,
  type MvpManualSelection,
  type MvpScope,
  type MvpVote,
} from "@/lib/mvp";
import {
  deleteSupabaseMvpVotesForMatch,
  fetchSupabaseMvpData,
  hasSupabaseVotingMatchMvpEvent,
  hasSupabaseVotingRoundMvpEvent,
  saveSupabaseMvpManualSelection,
  upsertSupabaseMvpVote,
} from "@/lib/supabaseMvp";

type MvpVoteInput = {
  leagueId: string;
  seasonId: string;
  matchId: string;
  round: number;
  voterPlayerId: string;
  selectedPlayerId: string;
};

type MvpManualSelectionInput = {
  leagueId: string;
  seasonId: string;
  scope: Exclude<MvpScope, "match">;
  round: number | null;
  selectedPlayerId: string | null;
};

type MvpContextValue = {
  votes: MvpVote[];
  manualSelections: MvpManualSelection[];
  voteForMatchMvp: (input: MvpVoteInput) => Promise<boolean>;
  clearVotesForMatch: (matchId: string) => Promise<boolean>;
  setManualMvpSelection: (input: MvpManualSelectionInput) => void;
};

type MvpProviderProps = {
  children: ReactNode;
};

const MvpContext = createContext<MvpContextValue | null>(null);
const votesStorageKey = "smash-lob-mvp-votes";
const manualSelectionsStorageKey = "smash-lob-mvp-manual-selections";
const lastSupabaseErrorStorageKey = "smash-lob-last-supabase-error";
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseStoredArray<T>(value: string | null): T[] | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed as T[];
  } catch {
    return null;
  }
}

function isSameVote(firstVote: MvpVote, secondVote: MvpVoteInput) {
  return (
    firstVote.leagueId === secondVote.leagueId &&
    firstVote.seasonId === secondVote.seasonId &&
    firstVote.matchId === secondVote.matchId &&
    firstVote.voterPlayerId === secondVote.voterPlayerId
  );
}

function isSameManualSelection(
  selection: MvpManualSelection,
  input: MvpManualSelectionInput,
) {
  return (
    selection.leagueId === input.leagueId &&
    selection.seasonId === input.seasonId &&
    selection.scope === input.scope &&
    selection.round === input.round
  );
}

function isSupabaseBackedId(id: string) {
  return supabaseUuidPattern.test(id);
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

function getVoteKey(vote: MvpVote) {
  return vote.matchId
    ? `${vote.leagueId}:${vote.seasonId}:match:${vote.matchId}:${vote.voterPlayerId}`
    : `${vote.leagueId}:${vote.seasonId}:round:${vote.round}:${vote.voterPlayerId}`;
}

function mergeVotes(currentVotes: MvpVote[], incomingVotes: MvpVote[]) {
  const items = new Map(currentVotes.map((vote) => [getVoteKey(vote), vote]));

  incomingVotes.forEach((vote) => {
    items.set(getVoteKey(vote), vote);
  });

  return Array.from(items.values());
}

function mergeManualSelections(
  currentSelections: MvpManualSelection[],
  incomingSelections: MvpManualSelection[],
) {
  const items = new Map(
    currentSelections.map((selection) => [
      `${selection.leagueId}:${selection.seasonId}:${selection.scope}:${selection.round ?? "season"}`,
      selection,
    ]),
  );

  incomingSelections.forEach((selection) => {
    items.set(
      `${selection.leagueId}:${selection.seasonId}:${selection.scope}:${selection.round ?? "season"}`,
      selection,
    );
  });

  return Array.from(items.values());
}

export function MvpProvider({ children }: MvpProviderProps) {
  const { userLeagues } = useLeagueAccess();
  const { matches } = useMatchData();
  const { getSeasonRoundSettings, playerProfiles } = useSeasonSettings();
  const [votes, setVotes] = useState<MvpVote[]>([]);
  const [manualSelections, setManualSelections] = useState<
    MvpManualSelection[]
  >([]);
  const supabaseLeagueIds = useMemo(
    () => userLeagues.map((league) => league.id).filter(isSupabaseBackedId),
    [userLeagues],
  );
  const supabaseLeagueIdKey = supabaseLeagueIds.join("|");

  useEffect(() => {
    const storedVotes = parseStoredArray<MvpVote>(
      window.localStorage.getItem(votesStorageKey),
    );
    const storedManualSelections = parseStoredArray<MvpManualSelection>(
      window.localStorage.getItem(manualSelectionsStorageKey),
    );

    if (storedVotes) {
      window.setTimeout(
        () =>
          setVotes(
            storedVotes.map((vote) => ({
              ...vote,
              matchId: typeof vote.matchId === "string" ? vote.matchId : null,
            })),
          ),
        0,
      );
    }

    if (storedManualSelections) {
      window.setTimeout(() => setManualSelections(storedManualSelections), 0);
    }
  }, []);

  const persistVotes = useCallback((nextVotes: MvpVote[]) => {
    window.localStorage.setItem(votesStorageKey, JSON.stringify(nextVotes));
    return nextVotes;
  }, []);

  const persistManualSelections = useCallback(
    (nextSelections: MvpManualSelection[]) => {
      window.localStorage.setItem(
        manualSelectionsStorageKey,
        JSON.stringify(nextSelections),
      );
      return nextSelections;
    },
    [],
  );

  useEffect(() => {
    if (!supabaseLeagueIdKey) {
      return;
    }

    fetchSupabaseMvpData(supabaseLeagueIds)
      .then((result) => {
        setVotes((currentVotes) =>
          persistVotes(mergeVotes(currentVotes, result.votes)),
        );
        setManualSelections((currentSelections) =>
          persistManualSelections(
            mergeManualSelections(currentSelections, result.manualSelections),
          ),
        );
      })
      .catch((error) => {
        recordSupabaseError("fetch-mvp-data", error);
      });
  }, [
    persistManualSelections,
    persistVotes,
    supabaseLeagueIdKey,
    supabaseLeagueIds,
  ]);

  const voteForMatchMvp = useCallback(
    async (input: MvpVoteInput) => {
      if (input.voterPlayerId === input.selectedPlayerId) {
        return false;
      }

      const settings = getSeasonRoundSettings(input.seasonId);

      if (settings.mvpSystem !== "voting") {
        return false;
      }

      const targetMatch = matches.find((match) => match.id === input.matchId);

      if (!targetMatch || getMatchMvpSelection({ votes, match: targetMatch })) {
        return false;
      }

      const nextVote: MvpVote = {
        ...input,
        createdAt: new Date().toISOString(),
      };
      const previousMatchMvp = getMatchMvpSelection({
        votes,
        match: targetMatch,
      });
      const previousRoundMvp = getRoundMvpSelection({
        votes,
        leagueId: input.leagueId,
        seasonId: input.seasonId,
        round: input.round,
        matches,
        mvpSystem: "voting",
      });
      let nextVotes = [
        ...votes.filter((vote) => !isSameVote(vote, input)),
        nextVote,
      ];

      if (isSupabaseBackedId(input.leagueId)) {
        try {
          await upsertSupabaseMvpVote(nextVote);
          const remoteData = await fetchSupabaseMvpData([input.leagueId]);
          nextVotes = mergeVotes(nextVotes, remoteData.votes);
        } catch (error) {
          recordSupabaseError("upsert-match-mvp-vote", error);
          return false;
        }
      }

      setVotes(() => persistVotes(nextVotes));

      const nextMatchMvp = getMatchMvpSelection({
        votes: nextVotes,
        match: targetMatch,
      });
      const nextRoundMvp = getRoundMvpSelection({
        votes: nextVotes,
        leagueId: input.leagueId,
        seasonId: input.seasonId,
        round: input.round,
        matches,
        mvpSystem: "voting",
      });

      let shouldRecordMatchMvp = !previousMatchMvp && Boolean(nextMatchMvp);

      if (nextMatchMvp && isSupabaseBackedId(input.leagueId)) {
        try {
          shouldRecordMatchMvp = !(await hasSupabaseVotingMatchMvpEvent({
            leagueId: input.leagueId,
            seasonId: input.seasonId,
            matchId: input.matchId,
          }));
        } catch (error) {
          recordSupabaseError("check-match-mvp-awarded", error);
        }
      }

      if (shouldRecordMatchMvp && nextMatchMvp) {
        const winnerNames = nextMatchMvp.playerIds.map(
          (playerId) =>
            playerProfiles.find((player) => player.id === playerId)
              ?.displayName ?? "Jugador",
        );
        const winnerText = winnerNames.join(" / ");
        const participantIds = Array.from(
          new Set([...targetMatch.teamA, ...targetMatch.teamB]),
        );

        try {
          await recordActivityEvent({
            leagueId: input.leagueId,
            seasonId: input.seasonId,
            matchId: input.matchId,
            actorEmail: "system@smash-lob.local",
            actorDisplayName: "Smash & Lob",
            type: "match_mvp_awarded",
            title: "MVP del partido decidido",
            description: `${winnerText} ${winnerNames.length > 1 ? "son" : "es"} el MVP del partido de la Jornada ${input.round}.`,
            metadata: {
              round: input.round,
              playerIds: nextMatchMvp.playerIds,
              playerNames: winnerNames,
              participantIds,
              targetPlayerIds: participantIds,
              votes: nextMatchMvp.votes,
              tied: nextMatchMvp.tied ?? false,
              resolvedWithThreeVotes: nextMatchMvp.votes >= 3,
              system: "voting",
            },
          });
        } catch (error) {
          recordSupabaseError("record-match-mvp-awarded", error);
        }
      }

      let shouldRecordRoundMvp = !previousRoundMvp && Boolean(nextRoundMvp);

      if (nextRoundMvp && isSupabaseBackedId(input.leagueId)) {
        try {
          shouldRecordRoundMvp = !(await hasSupabaseVotingRoundMvpEvent({
            leagueId: input.leagueId,
            seasonId: input.seasonId,
            round: input.round,
          }));
        } catch (error) {
          recordSupabaseError("check-round-mvp-awarded", error);
        }
      }

      if (shouldRecordRoundMvp && nextRoundMvp) {
        const winnerNames = nextRoundMvp.playerIds.map(
          (playerId) =>
            playerProfiles.find((player) => player.id === playerId)
              ?.displayName ?? "Jugador",
        );
        const winnerText = winnerNames.join(" / ");
        const targetPlayerIds = Array.from(
          new Set(
            matches
              .filter(
                (match) =>
                  match.leagueId === input.leagueId &&
                  match.seasonId === input.seasonId &&
                  match.round === input.round,
              )
              .flatMap((match) => [...match.teamA, ...match.teamB]),
          ),
        );

        try {
          await recordActivityEvent({
            leagueId: input.leagueId,
            seasonId: input.seasonId,
            matchId: nextRoundMvp.matchId ?? input.matchId,
            actorEmail: "system@smash-lob.local",
            actorDisplayName: "Smash & Lob",
            type: "round_mvp_awarded",
            title: `MVP de Jornada ${input.round} decidido`,
            description: `${winnerText} ${winnerNames.length > 1 ? "son" : "es"} el MVP de la Jornada ${input.round}.`,
            metadata: {
              round: input.round,
              playerIds: nextRoundMvp.playerIds,
              playerNames: winnerNames,
              targetPlayerIds,
              votes: nextRoundMvp.votes,
              tied: nextRoundMvp.tied ?? false,
              system: "voting",
            },
          });
        } catch (error) {
          recordSupabaseError("record-round-mvp-awarded", error);
        }
      }

      return true;
    },
    [
      getSeasonRoundSettings,
      matches,
      persistVotes,
      playerProfiles,
      votes,
    ],
  );

  const clearVotesForMatch = useCallback(
    async (matchId: string) => {
      if (isSupabaseBackedId(matchId)) {
        try {
          await deleteSupabaseMvpVotesForMatch(matchId);
        } catch (error) {
          recordSupabaseError("delete-match-mvp-votes", error);
          return false;
        }
      }

      setVotes((currentVotes) =>
        persistVotes(currentVotes.filter((vote) => vote.matchId !== matchId)),
      );

      return true;
    },
    [persistVotes],
  );

  const setManualMvpSelection = useCallback(
    (input: MvpManualSelectionInput) => {
      setManualSelections((currentSelections) => {
        const selectionsWithoutCurrent = currentSelections.filter(
          (selection) => !isSameManualSelection(selection, input),
        );

        if (!input.selectedPlayerId) {
          return persistManualSelections(selectionsWithoutCurrent);
        }

        return persistManualSelections([
          ...selectionsWithoutCurrent,
          {
            leagueId: input.leagueId,
            seasonId: input.seasonId,
            scope: input.scope,
            round: input.round,
            selectedPlayerId: input.selectedPlayerId,
            updatedAt: new Date().toISOString(),
          },
        ]);
      });

      if (isSupabaseBackedId(input.leagueId)) {
        saveSupabaseMvpManualSelection(input).catch((error) => {
          recordSupabaseError("save-mvp-manual-selection", error);
        });
      }
    },
    [persistManualSelections],
  );

  const value = useMemo(
    () => ({
      votes,
      manualSelections,
      voteForMatchMvp,
      clearVotesForMatch,
      setManualMvpSelection,
    }),
    [
      clearVotesForMatch,
      manualSelections,
      setManualMvpSelection,
      voteForMatchMvp,
      votes,
    ],
  );

  return <MvpContext.Provider value={value}>{children}</MvpContext.Provider>;
}

export function useMvp() {
  const context = useContext(MvpContext);

  if (!context) {
    throw new Error("useMvp must be used inside MvpProvider");
  }

  return context;
}
