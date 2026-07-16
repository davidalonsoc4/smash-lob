"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { BackButton } from "@/components/ui/BackButton";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData";
import { useI18n } from "@/i18n/I18nProvider";
import type { QaAction } from "@/lib/qaTypes";

type QaSeason = {
  id: string;
  league_id: string;
  name: string;
  status: "upcoming" | "active" | "finished";
  total_rounds: number;
  completed_rounds: number;
};

type QaPlayer = {
  id: string;
  league_id: string;
  display_name: string;
  avatar_initials: string;
  avatar_url: string | null;
};

type QaMatch = {
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

type QaSnapshot = {
  seasons: QaSeason[];
  players: QaPlayer[];
  seasonPlayers: { seasonId: string; playerId: string }[];
  settings: {
    league_id: string;
    season_id: string;
    mvp_system: string | null;
    result_confirmation_mode: string | null;
  }[];
  matches: QaMatch[];
  votes: {
    match_id: string | null;
    voter_player_id: string;
    selected_player_id: string;
  }[];
  confirmations: {
    match_id: string;
    player_id: string;
    status: "confirmed" | "disputed";
  }[];
};

type SelectionState = {
  seasonId: string;
  matchId: string;
  actorPlayerId: string;
  selectedPlayerId: string;
  secondaryPlayerId: string;
};

const qaEnabled = process.env.NEXT_PUBLIC_QA_MODE === "true";
const cacheKeysToClear = [
  "smash-lob-matches",
  "smash-lob-mvp-votes",
  "smash-lob-match-result-confirmations",
];

function getParticipants(match: QaMatch | null) {
  if (!match) return [];
  return Array.from(new Set([...(match.team_a ?? []), ...(match.team_b ?? [])]));
}

function getMatchLabel(match: QaMatch, players: Map<string, QaPlayer>) {
  const teamA = (match.team_a ?? [])
    .map((id) => players.get(id)?.display_name ?? "?")
    .join(" / ");
  const teamB = (match.team_b ?? [])
    .map((id) => players.get(id)?.display_name ?? "?")
    .join(" / ");

  return `${match.round}. ${teamA} vs ${teamB}`;
}

export default function AdminQaPage() {
  const { t } = useI18n();
  const { hasLeagueAdminRole } = useLeagueAccess();
  const { activeLeague } = useCurrentLeagueData();
  const canAccess = hasLeagueAdminRole(activeLeague.id);
  const storageKey = `smash-lob-qa-selection:${activeLeague.id}`;
  const [snapshot, setSnapshot] = useState<QaSnapshot | null>(null);
  const [selection, setSelection] = useState<SelectionState>({
    seasonId: "",
    matchId: "",
    actorPlayerId: "",
    selectedPlayerId: "",
    secondaryPlayerId: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await fetch(
      `/api/qa?leagueId=${encodeURIComponent(activeLeague.id)}`,
      { cache: "no-store" },
    );
    const payload = (await response.json().catch(() => null)) as
      | { ok: true; snapshot: QaSnapshot }
      | { ok: false; error?: string }
      | null;

    if (!response.ok || !payload?.ok) {
      setError(payload && "error" in payload ? payload.error ?? t.qa.error : t.qa.error);
      setIsLoading(false);
      return;
    }

    setSnapshot(payload.snapshot);
    setSelection((current) => {
      let stored: Partial<SelectionState> = {};

      try {
        stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as Partial<SelectionState>;
      } catch {
        stored = {};
      }

      const seasons = payload.snapshot.seasons;
      const preferredSeason =
        seasons.find((season) => season.id === stored.seasonId) ??
        seasons.find((season) => season.status === "active") ??
        seasons.at(-1) ??
        null;
      const seasonMatches = payload.snapshot.matches.filter(
        (match) => match.season_id === preferredSeason?.id,
      );
      const preferredMatch =
        seasonMatches.find((match) => match.id === stored.matchId) ??
        seasonMatches[0] ??
        null;
      const participants = getParticipants(preferredMatch);
      const actorPlayerId = participants.includes(stored.actorPlayerId ?? "")
        ? stored.actorPlayerId ?? ""
        : participants[0] ?? "";
      const selectedPlayerId = participants.includes(stored.selectedPlayerId ?? "")
        ? stored.selectedPlayerId ?? ""
        : participants.find((id) => id !== actorPlayerId) ?? participants[0] ?? "";
      const secondaryPlayerId = participants.includes(stored.secondaryPlayerId ?? "")
        ? stored.secondaryPlayerId ?? ""
        : participants.find((id) => id !== selectedPlayerId) ?? participants[1] ?? "";

      return {
        ...current,
        seasonId: preferredSeason?.id ?? "",
        matchId: preferredMatch?.id ?? "",
        actorPlayerId,
        selectedPlayerId,
        secondaryPlayerId,
      };
    });
    setIsLoading(false);
  }, [activeLeague.id, storageKey, t.qa.error]);

  useEffect(() => {
    const previousMessage = window.sessionStorage.getItem("smash-lob-qa-message");

    if (previousMessage) {
      window.setTimeout(() => setMessage(previousMessage), 0);
      window.sessionStorage.removeItem("smash-lob-qa-message");
    }

    const timeoutId = window.setTimeout(() => {
      if (qaEnabled && canAccess) {
        void loadSnapshot();
      } else {
        setIsLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canAccess, loadSnapshot]);

  useEffect(() => {
    if (!selection.seasonId) return;
    window.localStorage.setItem(storageKey, JSON.stringify(selection));
  }, [selection, storageKey]);

  const playerMap = useMemo(
    () => new Map((snapshot?.players ?? []).map((player) => [player.id, player])),
    [snapshot?.players],
  );
  const seasons = snapshot?.seasons ?? [];
  const seasonMatches = useMemo(
    () =>
      (snapshot?.matches ?? [])
        .filter((match) => match.season_id === selection.seasonId)
        .sort((first, second) => first.round - second.round),
    [selection.seasonId, snapshot?.matches],
  );
  const selectedMatch =
    seasonMatches.find((match) => match.id === selection.matchId) ?? null;
  const participants = getParticipants(selectedMatch);
  const matchVotes = (snapshot?.votes ?? []).filter(
    (vote) => vote.match_id === selectedMatch?.id,
  );
  const matchConfirmations = (snapshot?.confirmations ?? []).filter(
    (confirmation) => confirmation.match_id === selectedMatch?.id,
  );
  const seasonSettings = snapshot?.settings.find(
    (settings) => settings.season_id === selection.seasonId,
  );

  function updateSeason(seasonId: string) {
    const matches = (snapshot?.matches ?? []).filter(
      (match) => match.season_id === seasonId,
    );
    const match = matches[0] ?? null;
    const nextParticipants = getParticipants(match);

    setSelection({
      seasonId,
      matchId: match?.id ?? "",
      actorPlayerId: nextParticipants[0] ?? "",
      selectedPlayerId: nextParticipants[1] ?? nextParticipants[0] ?? "",
      secondaryPlayerId: nextParticipants[2] ?? nextParticipants[1] ?? "",
    });
  }

  function updateMatch(matchId: string) {
    const match = seasonMatches.find((item) => item.id === matchId) ?? null;
    const nextParticipants = getParticipants(match);

    setSelection((current) => ({
      ...current,
      matchId,
      actorPlayerId: nextParticipants.includes(current.actorPlayerId)
        ? current.actorPlayerId
        : nextParticipants[0] ?? "",
      selectedPlayerId: nextParticipants.includes(current.selectedPlayerId)
        ? current.selectedPlayerId
        : nextParticipants[1] ?? nextParticipants[0] ?? "",
      secondaryPlayerId: nextParticipants.includes(current.secondaryPlayerId)
        ? current.secondaryPlayerId
        : nextParticipants[2] ?? nextParticipants[1] ?? "",
    }));
  }

  async function runAction(action: QaAction) {
    if (!selectedMatch || isRunning) return;

    setIsRunning(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        leagueId: activeLeague.id,
        seasonId: selection.seasonId,
        matchId: selection.matchId,
        actorPlayerId: selection.actorPlayerId,
        selectedPlayerId: selection.selectedPlayerId,
        secondaryPlayerId: selection.secondaryPlayerId,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { ok: true }
      | { ok: false; error?: string }
      | null;

    if (!response.ok || !payload?.ok) {
      setError(payload && "error" in payload ? payload.error ?? t.qa.actionError : t.qa.actionError);
      setIsRunning(false);
      return;
    }

    cacheKeysToClear.forEach((key) => window.localStorage.removeItem(key));
    window.sessionStorage.setItem("smash-lob-qa-message", t.qa.actionCompleted);
    window.location.reload();
  }

  if (!qaEnabled || !canAccess) {
    return (
      <div className="compact-page space-y-3">
        <header className="pt-2">
          <BackButton fallbackHref="/admin" label={t.common.back} />
          <h1 className="mt-1 text-xl font-black tracking-tight">{t.qa.title}</h1>
        </header>
        <AppCard>
          <p className="font-bold">{t.qa.disabledTitle}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {t.qa.disabledDescription}
          </p>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label={t.common.back} />
        <p className="mt-1 text-xs font-bold text-neutral-500">{activeLeague.name}</p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">{t.qa.title}</h1>
        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          {t.qa.description}
        </p>
      </header>

      <AppCard className="border-amber-300 bg-amber-50">
        <div className="flex items-start gap-2">
          <span className="rounded-full bg-amber-200 px-2 py-1 text-[10px] font-black uppercase text-amber-950">
            QA
          </span>
          <div>
            <p className="text-sm font-black text-amber-950">{t.qa.warningTitle}</p>
            <p className="mt-0.5 text-xs font-semibold text-amber-900">
              {t.qa.warningDescription}
            </p>
          </div>
        </div>
      </AppCard>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <AppCard>
          <p className="text-sm font-bold">{t.qa.loading}</p>
        </AppCard>
      ) : snapshot && selectedMatch ? (
        <>
          <AppCard>
            <p className="font-bold">{t.qa.contextTitle}</p>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">{t.qa.season}</span>
                <select
                  value={selection.seasonId}
                  onChange={(event) => updateSeason(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-bold"
                >
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name} · {season.status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-neutral-500">{t.qa.match}</span>
                <select
                  value={selection.matchId}
                  onChange={(event) => updateMatch(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-bold"
                >
                  {seasonMatches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {getMatchLabel(match, playerMap)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-neutral-100 p-2.5">
                <p className="font-semibold text-neutral-500">{t.qa.matchStatus}</p>
                <p className="mt-0.5 font-black">{selectedMatch.status}</p>
              </div>
              <div className="rounded-xl bg-neutral-100 p-2.5">
                <p className="font-semibold text-neutral-500">{t.qa.configuration}</p>
                <p className="mt-0.5 font-black">
                  MVP {seasonSettings?.mvp_system ?? "—"} · {seasonSettings?.result_confirmation_mode ?? "—"}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-100 p-2.5">
                <p className="font-semibold text-neutral-500">{t.qa.votes}</p>
                <p className="mt-0.5 font-black">{matchVotes.length}/4</p>
              </div>
              <div className="rounded-xl bg-neutral-100 p-2.5">
                <p className="font-semibold text-neutral-500">{t.qa.confirmations}</p>
                <p className="mt-0.5 font-black">
                  {matchConfirmations.filter((item) => item.status === "confirmed").length} · {matchConfirmations.filter((item) => item.status === "disputed").length} {t.qa.disputedShort}
                </p>
              </div>
            </div>
          </AppCard>

          <AppCard>
            <p className="font-bold">{t.qa.simulatedPlayerTitle}</p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {t.qa.simulatedPlayerDescription}
            </p>
            <select
              value={selection.actorPlayerId}
              onChange={(event) =>
                setSelection((current) => ({ ...current, actorPlayerId: event.target.value }))
              }
              className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-bold"
            >
              {participants.map((playerId) => (
                <option key={playerId} value={playerId}>
                  {playerMap.get(playerId)?.display_name ?? playerId}
                </option>
              ))}
            </select>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isRunning || selectedMatch.status === "finished"}
                onClick={() => runAction("schedule_match")}
                className="rounded-xl bg-neutral-950 px-3 py-2.5 text-xs font-black text-white disabled:opacity-50"
              >
                {t.qa.scheduleMatch}
              </button>
              <button
                type="button"
                disabled={isRunning}
                onClick={() => runAction("record_result")}
                className="rounded-xl bg-neutral-950 px-3 py-2.5 text-xs font-black text-white disabled:opacity-50"
              >
                {t.qa.recordResult}
              </button>
              <button
                type="button"
                disabled={
                  isRunning ||
                  selectedMatch.status !== "finished" ||
                  seasonSettings?.result_confirmation_mode === "none"
                }
                onClick={() => runAction("confirm_all")}
                className="rounded-xl bg-neutral-200 px-3 py-2.5 text-xs font-black text-neutral-950 disabled:opacity-40"
              >
                {t.qa.confirmAll}
              </button>
              <button
                type="button"
                disabled={
                  isRunning ||
                  selectedMatch.status !== "finished" ||
                  seasonSettings?.result_confirmation_mode === "none"
                }
                onClick={() => runAction("dispute_result")}
                className="rounded-xl bg-amber-100 px-3 py-2.5 text-xs font-black text-amber-900 disabled:opacity-40"
              >
                {t.qa.disputeResult}
              </button>
              <button
                type="button"
                disabled={
                  isRunning ||
                  selectedMatch.status !== "finished" ||
                  seasonSettings?.result_confirmation_mode !== "required"
                }
                onClick={() => runAction("auto_validate_24h")}
                className="rounded-xl bg-neutral-200 px-3 py-2.5 text-xs font-black text-neutral-950 disabled:opacity-40"
              >
                {t.qa.autoValidate}
              </button>
              <button
                type="button"
                disabled={isRunning || selectedMatch.status !== "finished"}
                onClick={() =>
                  runAction(selectedMatch.result_locked ? "unlock_result" : "lock_result")
                }
                className="rounded-xl bg-neutral-200 px-3 py-2.5 text-xs font-black text-neutral-950 disabled:opacity-40"
              >
                {selectedMatch.result_locked ? t.qa.unlockResult : t.qa.lockResult}
              </button>
            </div>
          </AppCard>

          <AppCard>
            <p className="font-bold">{t.qa.mvpTitle}</p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {t.qa.mvpDescription}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-black uppercase text-neutral-500">{t.qa.target}</span>
                <select
                  value={selection.selectedPlayerId}
                  onChange={(event) =>
                    setSelection((current) => ({ ...current, selectedPlayerId: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-2 py-2 text-xs font-bold"
                >
                  {participants.map((playerId) => (
                    <option key={playerId} value={playerId}>
                      {playerMap.get(playerId)?.display_name ?? playerId}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase text-neutral-500">{t.qa.secondTarget}</span>
                <select
                  value={selection.secondaryPlayerId}
                  onChange={(event) =>
                    setSelection((current) => ({ ...current, secondaryPlayerId: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-2 py-2 text-xs font-bold"
                >
                  {participants.map((playerId) => (
                    <option key={playerId} value={playerId}>
                      {playerMap.get(playerId)?.display_name ?? playerId}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={
                  isRunning ||
                  selectedMatch.status !== "finished" ||
                  selection.actorPlayerId === selection.selectedPlayerId ||
                  seasonSettings?.mvp_system !== "voting"
                }
                onClick={() => runAction("cast_vote")}
                className="rounded-xl bg-neutral-200 px-3 py-2.5 text-xs font-black text-neutral-950 disabled:opacity-40"
              >
                {t.qa.castOneVote}
              </button>
              <button
                type="button"
                disabled={
                  isRunning ||
                  selectedMatch.status !== "finished" ||
                  seasonSettings?.mvp_system !== "voting"
                }
                onClick={() => runAction("award_three_votes")}
                className="rounded-xl bg-amber-100 px-3 py-2.5 text-xs font-black text-amber-900 disabled:opacity-40"
              >
                {t.qa.awardThreeVotes}
              </button>
              <button
                type="button"
                disabled={
                  isRunning ||
                  selectedMatch.status !== "finished" ||
                  selection.selectedPlayerId === selection.secondaryPlayerId ||
                  seasonSettings?.mvp_system !== "voting"
                }
                onClick={() => runAction("tie_votes")}
                className="rounded-xl bg-neutral-200 px-3 py-2.5 text-xs font-black text-neutral-950 disabled:opacity-40"
              >
                {t.qa.tieVotes}
              </button>
              <button
                type="button"
                disabled={isRunning || seasonSettings?.mvp_system !== "voting"}
                onClick={() => runAction("complete_round_scenario")}
                className="rounded-xl bg-neutral-950 px-3 py-2.5 text-xs font-black text-white disabled:opacity-50"
              >
                {t.qa.completeRoundScenario}
              </button>
            </div>
          </AppCard>

          <AppCard className="border-red-200">
            <p className="font-bold text-red-700">{t.qa.resetTitle}</p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {t.qa.resetDescription}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isRunning}
                onClick={() => runAction("reset_match")}
                className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-black text-red-700 disabled:opacity-50"
              >
                {t.qa.resetMatch}
              </button>
              <button
                type="button"
                disabled={isRunning}
                onClick={() => runAction("reset_round")}
                className="rounded-xl bg-red-600 px-3 py-2.5 text-xs font-black text-white disabled:opacity-50"
              >
                {t.qa.resetRound}
              </button>
            </div>
          </AppCard>
        </>
      ) : (
        <AppCard>
          <p className="font-bold">{t.qa.noDataTitle}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {t.qa.noDataDescription}
          </p>
        </AppCard>
      )}
    </div>
  );
}
