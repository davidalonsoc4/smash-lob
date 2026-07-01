"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { AppCard } from "@/components/ui/AppCard";
import { BackButton } from "@/components/ui/BackButton";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useMatchData } from "@/context/MatchDataProvider";
import {
  RoundWindowMode,
  SeasonRoundSettings,
  useSeasonSettings,
} from "@/context/SeasonSettingsProvider";
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData";
import { useI18n } from "@/i18n/I18nProvider";
import {
  deleteSupabaseRoundMatches,
  deleteSupabaseSeason,
  finishSupabaseActiveSeason,
  startSupabaseExistingSeason,
  startSupabaseSeason,
  updateSupabaseSeasonRoundOrder,
  updateSupabaseSeasonRoundSettings,
} from "@/lib/supabaseSeasons";
import {
  generateBalancedCalendar,
  generateManualCalendar,
  getNewPlayerIndexFromToken,
  getNewPlayerToken,
  resolveManualCalendarDraft,
  type ManualCalendarMatchDraft,
} from "@/lib/calendar";
import { getEmptyCourtBooking } from "@/lib/courtBooking";
import { recordActivityEvent } from "@/lib/activity";
import { getPublicInviteUrl } from "@/lib/inviteUrls";
import { buildSeasonRounds } from "@/lib/rounds";

const allowedPlayerCounts = [8, 12, 16];
const lastSupabaseErrorStorageKey = "smash-lob-last-supabase-error";
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CalendarMode = "balanced" | "manual";

type SeasonPlayerSummary = {
  id: string;
  displayName: string;
  avatarInitials?: string | null;
  avatarUrl?: string | null;
};

type ManualCalendarTeamKey = "teamA" | "teamB";

type ManualCalendarRoundDraft = {
  round: number;
  matches: {
    teamA: string[];
    teamB: string[];
  }[];
};

function getTotalRoundCount(playerCount: number) {
  return Math.max(playerCount - 1, 1);
}

function getMatchesPerRound(playerCount: number) {
  return Math.max(playerCount / 4, 1);
}

function createEmptyManualCalendar(
  playerCount: number,
): ManualCalendarRoundDraft[] {
  return Array.from(
    { length: getTotalRoundCount(playerCount) },
    (_, roundIndex) => ({
      round: roundIndex + 1,
      matches: Array.from({ length: getMatchesPerRound(playerCount) }, () => ({
        teamA: ["", ""],
        teamB: ["", ""],
      })),
    }),
  );
}

function getDraftPlayerValues({
  selectedPlayerIds,
  playerCount,
}: {
  selectedPlayerIds: string[];
  playerCount: number;
}) {
  const selectedValues = selectedPlayerIds.slice(0, playerCount);
  const missingSlots = Math.max(playerCount - selectedValues.length, 0);

  return [
    ...selectedValues,
    ...Array.from({ length: missingSlots }, (_, index) =>
      getNewPlayerToken(index),
    ),
  ];
}

function createBalancedManualCalendar(
  playerValues: string[],
): ManualCalendarRoundDraft[] {
  const balancedMatches = generateBalancedCalendar({
    leagueId: "manual-draft",
    seasonId: "manual-draft-season",
    playerIds: playerValues,
  });

  if (balancedMatches.length === 0) {
    return createEmptyManualCalendar(playerValues.length);
  }

  return Array.from(
    { length: getTotalRoundCount(playerValues.length) },
    (_, roundIndex) => {
      const round = roundIndex + 1;
      const roundMatches = balancedMatches.filter(
        (match) => match.round === round,
      );

      return {
        round,
        matches: roundMatches.map((match) => ({
          teamA: match.teamA,
          teamB: match.teamB,
        })),
      };
    },
  );
}

function normalizeManualCalendarRoundOrder(
  manualCalendar: ManualCalendarRoundDraft[],
): ManualCalendarRoundDraft[] {
  return manualCalendar.map((round, index) => ({
    ...round,
    round: index + 1,
  }));
}

function moveManualCalendarRound({
  manualCalendar,
  roundIndex,
  direction,
}: {
  manualCalendar: ManualCalendarRoundDraft[];
  roundIndex: number;
  direction: -1 | 1;
}) {
  const nextIndex = roundIndex + direction;

  if (nextIndex < 0 || nextIndex >= manualCalendar.length) {
    return manualCalendar;
  }

  const nextCalendar = [...manualCalendar];
  const currentRound = nextCalendar[roundIndex];
  nextCalendar[roundIndex] = nextCalendar[nextIndex];
  nextCalendar[nextIndex] = currentRound;

  return normalizeManualCalendarRoundOrder(nextCalendar);
}

function moveRoundOrderItem({
  roundOrder,
  index,
  direction,
}: {
  roundOrder: number[];
  index: number;
  direction: -1 | 1;
}) {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= roundOrder.length) {
    return roundOrder;
  }

  const nextRoundOrder = [...roundOrder];
  const currentRound = nextRoundOrder[index];
  nextRoundOrder[index] = nextRoundOrder[nextIndex];
  nextRoundOrder[nextIndex] = currentRound;

  return nextRoundOrder;
}

function getManualCalendarMatches(
  manualCalendar: ManualCalendarRoundDraft[],
): ManualCalendarMatchDraft[] {
  return manualCalendar.flatMap((round) =>
    round.matches.map((match) => ({
      round: round.round,
      teamA: match.teamA,
      teamB: match.teamB,
    })),
  );
}

function isManualCalendarComplete({
  manualCalendar,
  validPlayerValues,
}: {
  manualCalendar: ManualCalendarRoundDraft[];
  validPlayerValues: Set<string>;
}) {
  return manualCalendar.every((round) => {
    const roundPlayerIds = round.matches.flatMap((match) => [
      ...match.teamA,
      ...match.teamB,
    ]);

    return (
      roundPlayerIds.length > 0 &&
      roundPlayerIds.every(
        (playerId) => playerId.length > 0 && validPlayerValues.has(playerId),
      ) &&
      new Set(roundPlayerIds).size === roundPlayerIds.length
    );
  });
}

function updateManualCalendarSlot({
  manualCalendar,
  roundIndex,
  matchIndex,
  teamKey,
  playerIndex,
  value,
}: {
  manualCalendar: ManualCalendarRoundDraft[];
  roundIndex: number;
  matchIndex: number;
  teamKey: ManualCalendarTeamKey;
  playerIndex: number;
  value: string;
}) {
  return manualCalendar.map((round, currentRoundIndex) => {
    if (currentRoundIndex !== roundIndex) {
      return round;
    }

    return {
      ...round,
      matches: round.matches.map((match, currentMatchIndex) => {
        if (currentMatchIndex !== matchIndex) {
          return match;
        }

        return {
          ...match,
          [teamKey]: match[teamKey].map((playerId, currentPlayerIndex) =>
            currentPlayerIndex === playerIndex ? value : playerId,
          ),
        };
      }),
    };
  });
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

function resizePlayerNames(currentNames: string[], nextCount: number) {
  return Array.from(
    { length: nextCount },
    (_, index) => currentNames[index] ?? "",
  );
}

function getNextPlayerCount(currentCount: number) {
  return (
    allowedPlayerCounts.find((count) => count >= Math.max(currentCount, 8)) ??
    allowedPlayerCounts[allowedPlayerCounts.length - 1]
  );
}

function getDefaultNewSeasonName({ seasonCount }: { seasonCount: number }) {
  return `Temporada ${seasonCount + 1}`;
}

function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  };
}

function InviteLinkCard({
  inviteCode,
  leagueName,
}: {
  inviteCode: string;
  leagueName: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inviteUrl = getPublicInviteUrl(inviteCode);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setError(null);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(t.adminSeason.inviteCopyError);
    }
  }

  if (!inviteCode) {
    return null;
  }

  return (
    <AppCard>
      <p className="font-bold">{t.adminSeason.inviteTitle}</p>
      <p className="mt-2 text-sm text-stone-500">
        {t.adminSeason.inviteDescription.replace("{leagueName}", leagueName)}
      </p>

      <div className="mt-4 rounded-xl bg-stone-100 px-4 py-2.5 text-xs font-semibold text-stone-600 break-all">
        {inviteUrl}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 w-full rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white"
      >
        {copied ? t.adminSeason.inviteCopied : t.adminSeason.copyInviteLink}
      </button>

      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </AppCard>
  );
}

function RoundManagementPanel({
  activeLeagueId,
  activeSeason,
  roundSettings,
  matches,
}: {
  activeLeagueId: string;
  activeSeason: {
    id: string;
    leagueId: string;
    totalRounds: number;
    status?: "upcoming" | "active" | "finished";
  };
  roundSettings: SeasonRoundSettings;
  matches: ReturnType<typeof useCurrentLeagueData>["matches"];
}) {
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const rounds = buildSeasonRounds({
    season: activeSeason,
    settings: roundSettings,
    matches,
  });
  const activeRound = rounds.find((round) => round.status === "active");
  const firstUpcomingRound = rounds.find(
    (round) => round.status === "upcoming",
  );
  const defaultSelectedRound =
    activeRound?.round ?? firstUpcomingRound?.round ?? 1;
  const [selectedRound, setSelectedRound] = useState(defaultSelectedRound);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function persistRoundSettings(nextSettings: SeasonRoundSettings) {
    setIsSaving(true);
    setError(null);
    setFeedback(null);

    if (isSupabaseBackedId(activeSeason.id)) {
      try {
        await updateSupabaseSeasonRoundSettings(nextSettings);
      } catch (supabaseError) {
        recordSupabaseError("update-round-management", supabaseError);
        setError(
          "No se ha podido guardar la gestión de jornadas en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    updateSeasonRoundSettings(nextSettings);
    setFeedback("Gestión de jornadas actualizada.");
    setIsSaving(false);
  }

  function getBaseSettings() {
    return {
      ...roundSettings,
      leagueId: activeLeagueId,
      seasonId: activeSeason.id,
      manualCompletedRounds: roundSettings.manualCompletedRounds ?? [],
    };
  }

  function activateRound(round: number) {
    const nextCompletedRounds = (
      roundSettings.manualCompletedRounds ?? []
    ).filter((completedRound) => completedRound !== round);

    return persistRoundSettings({
      ...getBaseSettings(),
      manualActiveRound: round,
      manualCompletedRounds: nextCompletedRounds,
    });
  }

  function finishRound(round: number) {
    const nextCompletedRounds = Array.from(
      new Set([...(roundSettings.manualCompletedRounds ?? []), round]),
    ).sort((firstRound, secondRound) => firstRound - secondRound);
    const nextOpenRound = Array.from(
      { length: activeSeason.totalRounds },
      (_, index) => index + 1,
    ).find((candidateRound) => !nextCompletedRounds.includes(candidateRound));

    return persistRoundSettings({
      ...getBaseSettings(),
      manualActiveRound: nextOpenRound ?? null,
      manualCompletedRounds: nextCompletedRounds,
    });
  }

  function reopenRound(round: number) {
    return persistRoundSettings({
      ...getBaseSettings(),
      manualActiveRound: round,
      manualCompletedRounds: (roundSettings.manualCompletedRounds ?? []).filter(
        (completedRound) => completedRound !== round,
      ),
    });
  }

  const previousRound = Math.max((activeRound?.round ?? selectedRound) - 1, 1);
  const nextRound = Math.min(
    (activeRound?.round ?? selectedRound) + 1,
    activeSeason.totalRounds,
  );

  return (
    <AppCard>
      <p className="font-bold">Gestión de jornadas</p>
      <p className="mt-2 text-sm text-stone-500">
        Control manual para activar, finalizar, reabrir o mover la jornada
        activa cuando haga falta.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {rounds.map((round) => (
          <button
            key={round.id}
            type="button"
            onClick={() => setSelectedRound(round.round)}
            className={`rounded-xl px-2 py-2.5 text-xs font-black ${
              selectedRound === round.round
                ? "bg-stone-950 text-white"
                : round.status === "active"
                  ? "bg-emerald-100 text-emerald-900"
                  : round.status === "completed"
                    ? "bg-neutral-200 text-stone-600"
                    : "bg-stone-100 text-stone-700"
            }`}
          >
            <span className="block">J{round.round}</span>
            <span className="mt-1 block text-[10px] uppercase tracking-wide opacity-70">
              {round.status === "active"
                ? "Activa"
                : round.status === "completed"
                  ? "Finalizada"
                  : "Próxima"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-stone-100 p-3">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5">
          <span className="text-xs font-black uppercase tracking-wide text-stone-500">
            Jornada seleccionada
          </span>
          <span className="text-sm font-black text-stone-950">
            Jornada {selectedRound}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => activateRound(selectedRound)}
            disabled={isSaving}
            className="rounded-xl bg-stone-950 px-3 py-2.5 text-xs font-black text-white disabled:bg-neutral-300"
          >
            Activar
          </button>
          <button
            type="button"
            onClick={() => finishRound(selectedRound)}
            disabled={isSaving}
            className="rounded-xl bg-stone-950 px-3 py-2.5 text-xs font-black text-white disabled:bg-neutral-300"
          >
            Finalizar
          </button>
          <button
            type="button"
            onClick={() => reopenRound(selectedRound)}
            disabled={isSaving}
            className="rounded-xl bg-white px-3 py-2.5 text-xs font-black text-stone-800 disabled:text-stone-300"
          >
            Reabrir
          </button>
          <button
            type="button"
            onClick={() =>
              persistRoundSettings({
                ...getBaseSettings(),
                manualActiveRound: null,
              })
            }
            disabled={isSaving}
            className="rounded-xl bg-white px-3 py-2.5 text-xs font-black text-stone-800 disabled:text-stone-300"
          >
            Modo automático
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => activateRound(previousRound)}
            disabled={isSaving || previousRound === activeRound?.round}
            className="rounded-xl bg-white px-3 py-2.5 text-xs font-black text-stone-800 disabled:text-stone-300"
          >
            Jornada anterior
          </button>
          <button
            type="button"
            onClick={() => activateRound(nextRound)}
            disabled={isSaving || nextRound === activeRound?.round}
            className="rounded-xl bg-white px-3 py-2.5 text-xs font-black text-stone-800 disabled:text-stone-300"
          >
            Siguiente jornada
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <p className="mt-4 text-center text-sm font-semibold text-stone-600">
          {feedback}
        </p>
      ) : null}
    </AppCard>
  );
}

function RoundOrderPanel({
  activeSeasonId,
  totalRounds,
}: {
  activeSeasonId: string;
  totalRounds: number;
}) {
  const { reorderSeasonRounds } = useMatchData();
  const defaultRoundOrder = useMemo(
    () => Array.from({ length: totalRounds }, (_, index) => index + 1),
    [totalRounds],
  );
  const [roundOrder, setRoundOrder] = useState(defaultRoundOrder);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const hasChanges = roundOrder.some((round, index) => round !== index + 1);

  async function handleSave() {
    if (isSaving || !hasChanges) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        await updateSupabaseSeasonRoundOrder({
          seasonId: activeSeasonId,
          roundOrder,
        });
      } catch (supabaseError) {
        recordSupabaseError("update-round-order", supabaseError);
        setError(
          "No se ha podido guardar el orden de jornadas en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    reorderSeasonRounds({
      seasonId: activeSeasonId,
      roundOrder,
    });
    setRoundOrder(defaultRoundOrder);
    setFeedback("Orden de jornadas actualizado.");
    setIsSaving(false);
  }

  if (totalRounds <= 1) {
    return null;
  }

  return (
    <AppCard>
      <p className="font-bold">Orden de jornadas</p>
      <p className="mt-2 text-sm text-stone-500">
        Reordena las jornadas si el calendario ya creado no encaja. Al guardar,
        los partidos se renumeran con el nuevo orden.
      </p>

      <div className="mt-4 space-y-2">
        {roundOrder.map((round, index) => (
          <div
            key={`${round}-${index}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-stone-100 px-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-black text-stone-950">
                Posición {index + 1}
              </p>
              <p className="text-xs font-semibold text-stone-500">
                Jornada {round}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() =>
                  setRoundOrder((currentOrder) =>
                    moveRoundOrderItem({
                      roundOrder: currentOrder,
                      index,
                      direction: -1,
                    }),
                  )
                }
                disabled={isSaving || index === 0}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-stone-700 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() =>
                  setRoundOrder((currentOrder) =>
                    moveRoundOrderItem({
                      roundOrder: currentOrder,
                      index,
                      direction: 1,
                    }),
                  )
                }
                disabled={isSaving || index === roundOrder.length - 1}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-stone-700 disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setRoundOrder(defaultRoundOrder);
            setFeedback(null);
            setError(null);
          }}
          disabled={isSaving || !hasChanges}
          className="rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-black text-stone-800 disabled:text-stone-300"
        >
          Restaurar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {isSaving ? "Guardando..." : "Guardar orden"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <p className="mt-4 text-center text-sm font-semibold text-stone-600">
          {feedback}
        </p>
      ) : null}
    </AppCard>
  );
}

function SeasonPlayersStatus({
  activeLeagueId,
  players,
}: {
  activeLeagueId: string;
  players: SeasonPlayerSummary[];
}) {
  const { t } = useI18n();
  const { isPlayerClaimed } = useLeagueAccess();

  return (
    <AppCard>
      <p className="font-bold">{t.adminSeason.activePlayersTitle}</p>
      <p className="mt-2 text-sm text-stone-500">
        {t.adminSeason.activePlayersDescription}
      </p>

      <div className="mt-4 space-y-2">
        {players.map((player) => {
          const isClaimed = isPlayerClaimed(activeLeagueId, player.id);

          return (
            <div
              key={player.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-stone-100 px-4 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <PlayerAvatar
                  player={player}
                  size="sm"
                  className="bg-white text-stone-700"
                />
                <p className="truncate text-sm font-black">
                  {player.displayName}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                  isClaimed
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isClaimed
                  ? t.adminSeason.playerLinked
                  : t.adminSeason.playerPending}
              </span>
            </div>
          );
        })}
      </div>
    </AppCard>
  );
}

function SeasonPlayerNamesPanel({
  activeLeagueId,
  players,
}: {
  activeLeagueId: string;
  players: SeasonPlayerSummary[];
}) {
  const { updateLeaguePlayerName } = useLeagueAccess();
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(players.map((player) => [player.id, player.displayName])),
  );
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSave(player: SeasonPlayerSummary) {
    if (savingPlayerId) {
      return;
    }

    const nextName = (draftNames[player.id] ?? "").trim();

    if (!nextName || nextName === player.displayName) {
      return;
    }

    setSavingPlayerId(player.id);
    setError(null);
    setFeedback(null);

    const updated = await updateLeaguePlayerName(
      activeLeagueId,
      player.id,
      nextName,
    );

    setSavingPlayerId(null);

    if (!updated) {
      setError(
        "No se ha podido cambiar el nombre del jugador. Revisa Supabase o smash-lob-last-supabase-error.",
      );
      return;
    }

    setFeedback(`${player.displayName} actualizado a ${nextName}.`);
  }

  if (players.length === 0) {
    return null;
  }

  return (
    <AppCard>
      <p className="font-bold">Nombres de jugadores</p>
      <p className="mt-2 text-sm text-stone-500">
        Corrige nombres mal escritos sin recrear la temporada ni tocar el
        calendario ya generado.
      </p>

      <div className="mt-4 space-y-2">
        {players.map((player) => {
          const draftName = draftNames[player.id] ?? player.displayName;
          const hasChanges = draftName.trim() !== player.displayName;
          const isSavingPlayer = savingPlayerId === player.id;

          return (
            <div
              key={player.id}
              className="rounded-xl bg-stone-100 p-3"
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  player={player}
                  size="sm"
                  className="bg-white text-stone-700"
                />
                <input
                  value={draftName}
                  onChange={(event) => {
                    setDraftNames((currentNames) => ({
                      ...currentNames,
                      [player.id]: event.target.value,
                    }));
                    setError(null);
                    setFeedback(null);
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-black text-stone-950 outline-none focus:border-neutral-400"
                />
                <button
                  type="button"
                  onClick={() => handleSave(player)}
                  disabled={Boolean(savingPlayerId) || !hasChanges || !draftName.trim()}
                  className="shrink-0 rounded-xl bg-stone-950 px-4 py-2.5 text-xs font-black text-white disabled:bg-neutral-300"
                >
                  {isSavingPlayer ? "..." : "Guardar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <p className="mt-4 text-center text-sm font-semibold text-stone-600">
          {feedback}
        </p>
      ) : null}
    </AppCard>
  );
}

function FinishSeasonPanel({
  activeLeagueId,
  activeSeasonId,
}: {
  activeLeagueId: string;
  activeSeasonId: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { data: session } = useSession();
  const { finishActiveSeason, hydrateSeasonSnapshot } = useSeasonSettings();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinishSeason() {
    if (isSaving) {
      return;
    }

    const confirmed = window.confirm(t.adminSeason.finishConfirmMessage);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    setError(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const seasonSnapshot = await finishSupabaseActiveSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        });

        hydrateSeasonSnapshot(seasonSnapshot);
      } catch (supabaseError) {
        recordSupabaseError("finish-active-season", supabaseError);
        setError(
          "No se ha podido finalizar la temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    finishActiveSeason(activeLeagueId);

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: activeSeasonId,
        ...getActorFromSession(session),
        type: "season_finished",
        title: "Temporada cerrada",
        description:
          "La temporada se ha cerrado. La liga queda pendiente de crear una nueva temporada activa.",
      });
    } catch {
      // El cierre no debe fallar si el registro de actividad no entra.
    }

    setFeedback(t.adminSeason.seasonFinished);
    setIsSaving(false);
    router.push("/");
  }

  return (
    <AppCard>
      <p className="font-bold">{t.adminSeason.finishTitle}</p>
      <p className="mt-2 text-sm text-stone-500">
        {t.adminSeason.finishDescription}
      </p>

      <button
        type="button"
        onClick={handleFinishSeason}
        disabled={isSaving}
        className="mt-4 w-full rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
      >
        {isSaving ? "Guardando..." : t.adminSeason.finishSeason}
      </button>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <p className="mt-4 text-center text-sm font-semibold text-stone-600">
          {feedback}
        </p>
      ) : null}
    </AppCard>
  );
}

function StartSeasonPanel({
  activeLeagueId,
  activeSeasonId,
}: {
  activeLeagueId: string;
  activeSeasonId: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { hydrateSeasonSnapshot, startSeason } = useSeasonSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartSeason() {
    if (isSaving) {
      return;
    }

    const confirmed = window.confirm(
      "¿Comenzar la temporada? A partir de ese momento se podrán programar partidos y registrar resultados.",
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const snapshot = await startSupabaseExistingSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        });

        hydrateSeasonSnapshot(snapshot);
      } catch (supabaseError) {
        recordSupabaseError("start-existing-season", supabaseError);
        setError(
          "No se ha podido comenzar la temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    startSeason(activeLeagueId, activeSeasonId);

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: activeSeasonId,
        ...getActorFromSession(session),
        type: "season_created",
        title: "Temporada comenzada",
        description: "La temporada ha pasado de próximamente a activa.",
      });
    } catch {
      // La temporada ya ha comenzado; la actividad es auxiliar.
    }

    setIsSaving(false);
    router.push("/");
  }

  return (
    <AppCard>
      <p className="font-bold">Comenzar temporada</p>
      <p className="mt-2 text-sm text-stone-500">
        La temporada está creada, pero todavía no está activa. Al comenzar se
        desbloquean la programación de partidos y el registro de resultados.
      </p>

      <button
        type="button"
        onClick={handleStartSeason}
        disabled={isSaving}
        className="mt-4 w-full rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
      >
        {isSaving ? "Guardando..." : "Comenzar temporada"}
      </button>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </AppCard>
  );
}

function ReopenSeasonPanel({
  activeLeagueId,
  activeSeasonId,
}: {
  activeLeagueId: string;
  activeSeasonId: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { hydrateSeasonSnapshot, startSeason } = useSeasonSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReopenSeason() {
    if (isSaving) {
      return;
    }

    const confirmed = window.confirm(
      "¿Reabrir esta temporada? Volverá a estar activa para poder corregir partidos o resultados.",
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const snapshot = await startSupabaseExistingSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        });

        hydrateSeasonSnapshot(snapshot);
      } catch (supabaseError) {
        recordSupabaseError("reopen-finished-season", supabaseError);
        setError(
          "No se ha podido reabrir la temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    startSeason(activeLeagueId, activeSeasonId);

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: activeSeasonId,
        ...getActorFromSession(session),
        type: "season_created",
        title: "Temporada reabierta",
        description:
          "La temporada se ha reabierto manualmente para corregir partidos o resultados.",
      });
    } catch {
      // La reapertura no debe fallar si el registro de actividad no entra.
    }

    setIsSaving(false);
    router.push("/admin/season");
  }

  return (
    <AppCard>
      <p className="font-bold">Reabrir temporada pasada</p>
      <p className="mt-2 text-sm text-stone-500">
        Úsalo solo si la temporada se cerró por error o necesitas corregir algún
        resultado. La temporada volverá a estar activa.
      </p>

      <button
        type="button"
        onClick={handleReopenSeason}
        disabled={isSaving}
        className="mt-4 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-black text-stone-950 ring-1 ring-neutral-200 disabled:text-stone-300"
      >
        {isSaving ? "Guardando..." : "Reabrir temporada pasada"}
      </button>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </AppCard>
  );
}

function SeasonDangerZone({
  activeLeagueId,
  activeSeasonId,
  totalRounds,
}: {
  activeLeagueId: string;
  activeSeasonId: string;
  totalRounds: number;
}) {
  const router = useRouter();
  const { deleteSeason, hydrateSeasonSnapshot } = useSeasonSettings();
  const { deleteRoundMatches, deleteSeasonMatches } = useMatchData();
  const [selectedRound, setSelectedRound] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleDeleteRound() {
    if (isSaving) {
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la Jornada ${selectedRound}? Se borrarán sus partidos y resultados.`,
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        await deleteSupabaseRoundMatches({
          seasonId: activeSeasonId,
          round: selectedRound,
        });
      } catch (supabaseError) {
        recordSupabaseError("delete-round-matches", supabaseError);
        setError(
          "No se ha podido eliminar la jornada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    deleteRoundMatches(activeSeasonId, selectedRound);
    setFeedback(`Jornada ${selectedRound} eliminada.`);
    setIsSaving(false);
  }

  async function handleDeleteSeason() {
    if (isSaving) {
      return;
    }

    const confirmed = window.confirm(
      "¿Eliminar la temporada completa? Se borrarán sus jornadas, partidos y resultados.",
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const snapshot = await deleteSupabaseSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        });

        hydrateSeasonSnapshot(snapshot);
      } catch (supabaseError) {
        recordSupabaseError("delete-season", supabaseError);
        setError(
          "No se ha podido eliminar la temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    deleteSeason(activeLeagueId, activeSeasonId);
    deleteSeasonMatches(activeSeasonId);
    setIsSaving(false);
    router.push("/");
  }

  return (
    <AppCard>
      <p className="font-bold">Zona de eliminación</p>
      <p className="mt-2 text-sm text-stone-500">
        Permite borrar jornadas o temporadas completas si el calendario se creó
        mal. Es una acción destructiva.
      </p>

      <div className="mt-4 rounded-xl bg-stone-100 p-3">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-stone-500">
            Jornada a eliminar
          </span>
          <select
            value={selectedRound}
            onChange={(event) => setSelectedRound(Number(event.target.value))}
            disabled={isSaving}
            className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-black text-stone-950 outline-none"
          >
            {Array.from({ length: totalRounds }, (_, index) => index + 1).map(
              (round) => (
                <option key={round} value={round}>
                  Jornada {round}
                </option>
              ),
            )}
          </select>
        </label>

        <button
          type="button"
          onClick={handleDeleteRound}
          disabled={isSaving}
          className="mt-3 w-full rounded-xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 disabled:text-red-300"
        >
          Eliminar jornada
        </button>
      </div>

      <button
        type="button"
        onClick={handleDeleteSeason}
        disabled={isSaving}
        className="mt-3 w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white disabled:bg-red-200"
      >
        Eliminar temporada completa
      </button>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <p className="mt-4 text-center text-sm font-semibold text-stone-600">
          {feedback}
        </p>
      ) : null}
    </AppCard>
  );
}

function NewSeasonForm({
  activeLeagueId,
  activeLeagueName,
  activeSeasonId,
  currentPlayers,
}: {
  activeLeagueId: string;
  activeLeagueName: string;
  activeSeasonId: string;
  currentPlayers: SeasonPlayerSummary[];
}) {
  const { t } = useI18n();
  const { data: session } = useSession();
  const { hydrateSeasonSnapshot, playerProfiles, seasons, startNewSeason } =
    useSeasonSettings();
  const { createSeasonMatches, hydrateMatches } = useMatchData();
  const {
    getLeagueInviteCode,
    isSuperuser,
    linkCurrentUserToLeaguePlayer,
    userId,
  } = useLeagueAccess();
  const leaguePlayers = playerProfiles.filter(
    (player) => player.leagueId === activeLeagueId,
  );
  const leagueSeasonCount = seasons.filter(
    (season) => season.leagueId === activeLeagueId,
  ).length;
  const isFirstLeagueSeason = leagueSeasonCount === 0;
  const defaultPlayerCount = getNextPlayerCount(currentPlayers.length);
  const [newSeasonName, setNewSeasonName] = useState(
    getDefaultNewSeasonName({ seasonCount: leagueSeasonCount }),
  );
  const [playerCount, setPlayerCount] = useState(defaultPlayerCount);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    currentPlayers.map((player) => player.id).slice(0, defaultPlayerCount),
  );
  const [newPlayerNames, setNewPlayerNames] = useState<string[]>([]);
  const [selfPlayerValue, setSelfPlayerValue] = useState<string | null>(null);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("balanced");
  const [manualCalendar, setManualCalendar] = useState<
    ManualCalendarRoundDraft[]
  >(() =>
    createBalancedManualCalendar(
      getDraftPlayerValues({
        selectedPlayerIds: currentPlayers
          .map((player) => player.id)
          .slice(0, defaultPlayerCount),
        playerCount: defaultPlayerCount,
      }),
    ),
  );
  const [roundWindowMode, setRoundWindowMode] =
    useState<RoundWindowMode>("none");
  const [seasonStartsAt, setSeasonStartsAt] = useState("");
  const [roundWindowDays, setRoundWindowDays] = useState("15");
  const [requiresThreeSets, setRequiresThreeSets] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inviteCode = getLeagueInviteCode(activeLeagueId);
  const canLinkSelfPlayer = Boolean(userId && !isSuperuser);

  const parsedRoundWindowDays = Number(roundWindowDays);
  const isFixedDaysMode = roundWindowMode === "fixed-days";
  const selectedPlayerIdSet = useMemo(
    () => new Set(selectedPlayerIds),
    [selectedPlayerIds],
  );
  const continuingPlayers = leaguePlayers.filter((player) =>
    selectedPlayerIdSet.has(player.id),
  );
  const removedPlayers = currentPlayers.filter(
    (player) => !selectedPlayerIdSet.has(player.id),
  );
  const newPlayerSlotCount = Math.max(
    playerCount - selectedPlayerIds.length,
    0,
  );
  const visibleNewPlayerNames = resizePlayerNames(
    newPlayerNames,
    newPlayerSlotCount,
  );
  const cleanNewPlayerNames = visibleNewPlayerNames.map((playerName) =>
    playerName.trim(),
  );
  const manualPlayerOptions = [
    ...selectedPlayerIds.map((playerId) => {
      const player = leaguePlayers.find((item) => item.id === playerId);

      return {
        value: playerId,
        label: player?.displayName ?? playerId,
      };
    }),
    ...visibleNewPlayerNames.map((playerName, index) => ({
      value: getNewPlayerToken(index),
      label:
        playerName.trim() ||
        (isFirstLeagueSeason
          ? `Jugador ${selectedPlayerIds.length + index + 1}`
          : `Sustituto ${index + 1}`),
    })),
  ];
  const validManualPlayerValues = new Set(
    manualPlayerOptions.map((option) => option.value),
  );
  const selectedSelfPlayerValue =
    selfPlayerValue && validManualPlayerValues.has(selfPlayerValue)
      ? selfPlayerValue
      : null;
  const manualCalendarMatches = getManualCalendarMatches(manualCalendar);
  const isManualCalendarReady =
    calendarMode !== "manual" ||
    isManualCalendarComplete({
      manualCalendar,
      validPlayerValues: validManualPlayerValues,
    });
  const hasValidPlayers =
    allowedPlayerCounts.includes(playerCount) &&
    selectedPlayerIds.length <= playerCount &&
    selectedPlayerIds.length + cleanNewPlayerNames.length === playerCount &&
    cleanNewPlayerNames.every(Boolean);
  const canStartSeason =
    !isSaving &&
    newSeasonName.trim().length > 0 &&
    hasValidPlayers &&
    isManualCalendarReady &&
    (roundWindowMode === "none" ||
      (seasonStartsAt.length > 0 &&
        Number.isFinite(parsedRoundWindowDays) &&
        parsedRoundWindowDays >= 1));

  function refreshManualCalendarFromPlayers({
    selectedIds,
    count,
  }: {
    selectedIds: string[];
    count: number;
  }) {
    setManualCalendar(
      createBalancedManualCalendar(
        getDraftPlayerValues({
          selectedPlayerIds: selectedIds,
          playerCount: count,
        }),
      ),
    );
  }

  function handlePlayerCountChange(nextCount: number) {
    setPlayerCount(nextCount);
    const nextSelectedPlayerIds = selectedPlayerIds.slice(0, nextCount);

    setSelectedPlayerIds(nextSelectedPlayerIds);
    setNewPlayerNames((currentNames) =>
      resizePlayerNames(
        currentNames,
        Math.max(
          nextCount - Math.min(nextSelectedPlayerIds.length, nextCount),
          0,
        ),
      ),
    );
    refreshManualCalendarFromPlayers({
      selectedIds: nextSelectedPlayerIds,
      count: nextCount,
    });
    if (selfPlayerValue) {
      const nextValidValues = new Set(
        getDraftPlayerValues({
          selectedPlayerIds: nextSelectedPlayerIds,
          playerCount: nextCount,
        }),
      );

      if (!nextValidValues.has(selfPlayerValue)) {
        setSelfPlayerValue(null);
      }
    }
    setFeedback(null);
  }

  function toggleExistingPlayer(playerId: string) {
    const nextSelectedPlayerIds = selectedPlayerIds.includes(playerId)
      ? selectedPlayerIds.filter(
          (currentPlayerId) => currentPlayerId !== playerId,
        )
      : selectedPlayerIds.length >= playerCount
        ? selectedPlayerIds
        : [...selectedPlayerIds, playerId];

    setSelectedPlayerIds(nextSelectedPlayerIds);
    refreshManualCalendarFromPlayers({
      selectedIds: nextSelectedPlayerIds,
      count: playerCount,
    });
    if (
      selfPlayerValue === playerId &&
      !nextSelectedPlayerIds.includes(playerId)
    ) {
      setSelfPlayerValue(null);
    }
    setFeedback(null);
  }

  async function handleStartSeason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canStartSeason) {
      return;
    }

    const manualMatches =
      calendarMode === "manual" ? manualCalendarMatches : undefined;
    const settings = {
      leagueId: activeLeagueId,
      name: newSeasonName.trim(),
      playerIds: selectedPlayerIds,
      newPlayerNames: cleanNewPlayerNames,
      roundWindowMode,
      seasonStartsAt: isFixedDaysMode ? seasonStartsAt : null,
      roundWindowDays: isFixedDaysMode ? parsedRoundWindowDays : null,
      requiresThreeSets,
      manualMatches,
      selfPlayerValue: selectedSelfPlayerValue,
      currentUserEmail: userId,
      currentUserDisplayName: session?.user?.name ?? null,
    };

    setIsSaving(true);
    setFeedback(null);
    setError(null);

    if (isSupabaseBackedId(activeLeagueId)) {
      try {
        const result = await startSupabaseSeason({
          ...settings,
          activeSeasonId:
            activeSeasonId && isSupabaseBackedId(activeSeasonId)
              ? activeSeasonId
              : null,
        });

        hydrateSeasonSnapshot(result.seasonSnapshot);
        hydrateMatches(result.matches);

        if (result.linkedMembership) {
          linkCurrentUserToLeaguePlayer(
            result.linkedMembership.leagueId,
            result.linkedMembership.playerId,
          );
        }
      } catch (supabaseError) {
        recordSupabaseError("start-new-season", supabaseError);
        setError(
          "No se ha podido crear la nueva temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    } else {
      const result = startNewSeason(settings);
      const selectedNewPlayerIndex = selectedSelfPlayerValue
        ? getNewPlayerIndexFromToken(selectedSelfPlayerValue)
        : null;
      const selectedSelfPlayerId = selectedSelfPlayerValue
        ? selectedNewPlayerIndex === null
          ? selectedSelfPlayerValue
          : (result.newPlayerIds[selectedNewPlayerIndex] ?? null)
        : null;

      if (selectedSelfPlayerId) {
        linkCurrentUserToLeaguePlayer(activeLeagueId, selectedSelfPlayerId);
      }

      if (calendarMode === "manual" && manualMatches) {
        const resolvedManualMatches = resolveManualCalendarDraft({
          matches: manualMatches,
          newPlayerIds: result.newPlayerIds,
        });
        const localManualMatches = generateManualCalendar({
          leagueId: activeLeagueId,
          seasonId: result.season.id,
          matches: resolvedManualMatches,
        }).map((match) => ({
          ...match,
          courtBooking: getEmptyCourtBooking(),
        }));

        hydrateMatches(localManualMatches);
      } else {
        createSeasonMatches({
          leagueId: activeLeagueId,
          seasonId: result.season.id,
          playerIds: result.playerIds,
        });
      }
    }

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: undefined,
        ...getActorFromSession(session),
        type: "season_created",
        title: "Nueva temporada creada",
        description: `${settings.name} creada en estado próximamente con ${playerCount} jugadores y calendario ${calendarMode === "manual" ? "manual" : "equilibrado"}.`,
        metadata: {
          playerCount,
          existingPlayerIds: selectedPlayerIds,
          newPlayerNames: cleanNewPlayerNames,
          calendarMode,
        },
      });
    } catch {
      // La temporada ya está creada; la actividad es auxiliar.
    }

    setNewSeasonName("");
    setFeedback(
      "Temporada creada. Puedes comenzarla cuando esté todo preparado.",
    );
    setIsSaving(false);
  }

  return (
    <form onSubmit={handleStartSeason} className="space-y-3">
      <AppCard>
        <p className="font-bold">{t.adminSeason.newSeasonTitle}</p>
        <p className="mt-2 text-sm text-stone-500">
          {isFirstLeagueSeason
            ? "Configura la Temporada 1 con sus jugadores, calendario y reglas antes de abrir invitaciones."
            : t.adminSeason.newSeasonDescription}
        </p>

        {!isFirstLeagueSeason ? (
          <div className="mt-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
            <p className="font-black">No hay temporada activa.</p>
            <p className="mt-1">
              Confirma quién continúa, quita bajas, añade sustitutos y se
              generarán las jornadas de la nueva temporada, pero quedará en
              estado próximamente hasta que pulses Comenzar temporada.
            </p>
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">
              {t.adminSeason.newSeasonName}
            </span>

            <input
              value={newSeasonName}
              onChange={(event) => {
                setNewSeasonName(event.target.value);
                setFeedback(null);
              }}
              placeholder={t.adminSeason.newSeasonNamePlaceholder}
              className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-sm outline-none focus:border-neutral-400"
            />
          </label>

          <div>
            <p className="text-sm font-semibold text-stone-700">
              {t.adminSeason.playerCount}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {allowedPlayerCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handlePlayerCountChange(count)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-black ${
                    playerCount === count
                      ? "bg-stone-950 text-white"
                      : "bg-stone-100 text-stone-800"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.adminSeason.seasonPlayersTitle}</p>
        <p className="mt-2 text-sm text-stone-500">
          {isFirstLeagueSeason
            ? "Añade los jugadores que formarán parte de esta primera temporada."
            : t.adminSeason.seasonPlayersDescription}
        </p>

        {canLinkSelfPlayer ? (
          <div className="mt-4 rounded-xl bg-stone-100 px-4 py-2.5 text-xs font-semibold text-stone-600">
            Marca qué jugador eres tú para vincular automáticamente tu cuenta,
            tu perfil y tu foto en esta liga.
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-stone-100 px-4 py-2.5">
            <p className="text-xs font-semibold text-stone-500">
              Seleccionados
            </p>
            <p className="text-lg font-black">
              {selectedPlayerIds.length}/{playerCount}
            </p>
          </div>
          <div className="rounded-xl bg-stone-100 px-4 py-2.5">
            <p className="text-xs font-semibold text-stone-500">
              {isFirstLeagueSeason ? "Jugadores" : "Sustitutos"}
            </p>
            <p className="text-lg font-black">{newPlayerSlotCount}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {leaguePlayers.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const wasInPreviousSeason = currentPlayers.some(
              (currentPlayer) => currentPlayer.id === player.id,
            );
            const isDisabled =
              !isSelected && selectedPlayerIds.length >= playerCount;

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => toggleExistingPlayer(player.id)}
                disabled={isDisabled}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-black disabled:opacity-40 ${
                  isSelected
                    ? "bg-stone-950 text-white"
                    : "bg-stone-100 text-stone-800"
                }`}
              >
                <PlayerAvatar
                  player={player}
                  size="sm"
                  className={isSelected ? "bg-white text-stone-900" : ""}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{player.displayName}</span>
                  <span
                    className={`mt-0.5 block text-xs ${isSelected ? "text-stone-300" : "text-stone-500"}`}
                  >
                    {isFirstLeagueSeason
                      ? "Jugador"
                      : isSelected
                        ? "Continúa"
                        : wasInPreviousSeason
                          ? "Baja esta temporada"
                          : "Jugador de la liga"}
                  </span>
                </span>
                {canLinkSelfPlayer && isSelected ? (
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelfPlayerValue(player.id);
                    }}
                    className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${
                      selectedSelfPlayerValue === player.id
                        ? "bg-amber-300 text-stone-950"
                        : isSelected
                          ? "bg-white/10 text-white"
                          : "bg-white text-stone-700"
                    }`}
                  >
                    {selectedSelfPlayerValue === player.id ? "Yo" : "Soy yo"}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {!isFirstLeagueSeason && continuingPlayers.length > 0 ? (
          <p className="mt-4 text-xs font-semibold text-stone-500">
            Continúan:{" "}
            {continuingPlayers.map((player) => player.displayName).join(", ")}
          </p>
        ) : null}

        {!isFirstLeagueSeason && removedPlayers.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-amber-700">
            No entran en la nueva temporada:{" "}
            {removedPlayers.map((player) => player.displayName).join(", ")}
          </p>
        ) : null}

        {newPlayerSlotCount > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {visibleNewPlayerNames.map((playerName, index) => (
              <label key={index} className="block">
                <span className="text-xs font-semibold text-stone-500">
                  {t.adminSeason.newPlayerName} {index + 1}
                </span>
                <div className="mt-1 flex gap-2">
                  <input
                    value={playerName}
                    placeholder={
                      isFirstLeagueSeason
                        ? `Jugador ${selectedPlayerIds.length + index + 1}`
                        : `Sustituto ${index + 1}`
                    }
                    onChange={(event) => {
                      const nextNames = [...visibleNewPlayerNames];
                      nextNames[index] = event.target.value;
                      setNewPlayerNames(nextNames);
                      setFeedback(null);
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-sm outline-none focus:border-neutral-400"
                  />
                  {canLinkSelfPlayer ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelfPlayerValue(getNewPlayerToken(index));
                        setFeedback(null);
                      }}
                      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${
                        selectedSelfPlayerValue === getNewPlayerToken(index)
                          ? "bg-amber-300 text-stone-950"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {selectedSelfPlayerValue === getNewPlayerToken(index)
                        ? "Yo"
                        : "Soy yo"}
                    </button>
                  ) : null}
                </div>
              </label>
            ))}
          </div>
        ) : null}
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.adminSeason.calendarTitle}</p>
        <p className="mt-2 text-sm text-stone-500">
          {t.adminSeason.calendarDescription}
        </p>

        <div className="mt-5 space-y-3">
          {(["balanced", "manual"] as CalendarMode[]).map((mode) => (
            <label
              key={mode}
              className="flex items-start gap-3 rounded-xl border border-stone-200 p-3"
            >
              <input
                type="radio"
                name="calendarMode"
                value={mode}
                checked={calendarMode === mode}
                onChange={() => {
                  setCalendarMode(mode);
                  setFeedback(null);
                }}
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-black">
                  {mode === "balanced"
                    ? t.adminSeason.balancedCalendar
                    : t.adminSeason.manualCalendar}
                </span>
                <span className="mt-1 block text-xs text-stone-500">
                  {mode === "balanced"
                    ? t.adminSeason.balancedCalendarDescription
                    : t.adminSeason.manualCalendarDescription}
                </span>
              </span>
            </label>
          ))}
        </div>

        {calendarMode === "manual" ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-stone-100 px-4 py-2.5 text-sm text-stone-700">
              <p className="font-black">
                {getTotalRoundCount(playerCount)} jornadas ·{" "}
                {getMatchesPerRound(playerCount)}{" "}
                {getMatchesPerRound(playerCount) === 1 ? "partido" : "partidos"}{" "}
                por jornada
              </p>
              <p className="mt-1 text-xs font-semibold text-stone-500">
                Elige manualmente la Pareja A y la Pareja B de cada partido.
                Cada desplegable viene preseleccionado con el calendario
                automático, pero puedes editarlo.
              </p>
              <button
                type="button"
                onClick={() => {
                  refreshManualCalendarFromPlayers({
                    selectedIds: selectedPlayerIds,
                    count: playerCount,
                  });
                  setFeedback(null);
                }}
                className="mt-3 w-full rounded-xl bg-white px-4 py-2.5 text-xs font-black text-stone-800 shadow-sm"
              >
                Restaurar calendario automático
              </button>
            </div>

            {manualCalendar.map((round, roundIndex) => (
              <div
                key={round.round}
                className="rounded-xl border border-stone-200 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">Jornada {round.round}</p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setManualCalendar((currentCalendar) =>
                          moveManualCalendarRound({
                            manualCalendar: currentCalendar,
                            roundIndex,
                            direction: -1,
                          }),
                        )
                      }
                      disabled={roundIndex === 0}
                      className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setManualCalendar((currentCalendar) =>
                          moveManualCalendarRound({
                            manualCalendar: currentCalendar,
                            roundIndex,
                            direction: 1,
                          }),
                        )
                      }
                      disabled={roundIndex === manualCalendar.length - 1}
                      className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-4">
                  {round.matches.map((manualMatch, matchIndex) => {
                    const selectedRoundPlayerIds = [
                      ...manualMatch.teamA,
                      ...manualMatch.teamB,
                    ].filter(Boolean);
                    const hasDuplicatePlayers =
                      new Set(selectedRoundPlayerIds).size !==
                      selectedRoundPlayerIds.length;

                    return (
                      <div
                        key={`${round.round}-${matchIndex}`}
                        className="rounded-xl bg-stone-100 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-black">
                            Partido {matchIndex + 1}
                          </p>
                          {hasDuplicatePlayers ? (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">
                              Revisa duplicados
                            </span>
                          ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {(["teamA", "teamB"] as ManualCalendarTeamKey[]).map(
                            (teamKey) => (
                              <div
                                key={teamKey}
                                className="rounded-xl bg-white p-3"
                              >
                                <p className="text-[10px] font-black uppercase tracking-wide text-stone-500">
                                  {teamKey === "teamA"
                                    ? "Pareja A"
                                    : "Pareja B"}
                                </p>

                                <div className="mt-2 space-y-2">
                                  {manualMatch[teamKey].map(
                                    (playerId, playerIndex) => (
                                      <select
                                        key={`${teamKey}-${playerIndex}`}
                                        value={playerId}
                                        onChange={(event) => {
                                          setManualCalendar((currentCalendar) =>
                                            updateManualCalendarSlot({
                                              manualCalendar: currentCalendar,
                                              roundIndex,
                                              matchIndex,
                                              teamKey,
                                              playerIndex,
                                              value: event.target.value,
                                            }),
                                          );
                                          setFeedback(null);
                                        }}
                                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-bold text-stone-950 outline-none"
                                      >
                                        <option value="">
                                          Jugador {playerIndex + 1}
                                        </option>
                                        {manualPlayerOptions.map((option) => (
                                          <option
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    ),
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {!isManualCalendarReady ? (
              <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
                Completa todos los desplegables sin repetir jugador dentro de la
                misma jornada para poder crear la temporada.
              </p>
            ) : null}
          </div>
        ) : null}
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.adminSeason.resultRulesTitle}</p>
        <p className="mt-2 text-sm text-stone-500">
          {t.adminSeason.resultRulesDescription}
        </p>

        <label className="mt-5 flex items-start gap-3 rounded-xl border border-stone-200 p-3">
          <input
            type="checkbox"
            checked={requiresThreeSets}
            onChange={(event) => {
              setRequiresThreeSets(event.target.checked);
              setFeedback(null);
            }}
            className="mt-1"
          />

          <span>
            <span className="block text-sm font-black">
              {t.adminSeason.requireThreeSetsTitle}
            </span>
            <span className="mt-1 block text-xs text-stone-500">
              {t.adminSeason.requireThreeSetsDescription}
            </span>
          </span>
        </label>
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.adminSeason.roundWindowTitle}</p>
        <p className="mt-2 text-sm text-stone-500">
          {t.adminSeason.newRoundWindowDescription}
        </p>

        <div className="mt-5 space-y-3">
          {(["none", "fixed-days"] as RoundWindowMode[]).map((mode) => (
            <label
              key={mode}
              className="flex items-start gap-3 rounded-xl border border-stone-200 p-3"
            >
              <input
                type="radio"
                name="newRoundWindowMode"
                value={mode}
                checked={roundWindowMode === mode}
                onChange={() => {
                  setRoundWindowMode(mode);
                  setFeedback(null);
                }}
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-black">
                  {mode === "none"
                    ? t.adminSeason.noWindowTitle
                    : t.adminSeason.fixedDaysTitle}
                </span>
                <span className="mt-1 block text-xs text-stone-500">
                  {mode === "none"
                    ? t.adminSeason.noWindowDescription
                    : t.adminSeason.fixedDaysDescription}
                </span>
              </span>
            </label>
          ))}
        </div>

        {isFixedDaysMode ? (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">
                {t.adminSeason.seasonStartDate}
              </span>

              <input
                type="date"
                value={seasonStartsAt}
                onChange={(event) => {
                  setSeasonStartsAt(event.target.value);
                  setFeedback(null);
                }}
                className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">
                {t.adminSeason.daysPerRound}
              </span>

              <input
                type="number"
                min={1}
                value={roundWindowDays}
                onChange={(event) => {
                  setRoundWindowDays(event.target.value);
                  setFeedback(null);
                }}
                className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>
          </div>
        ) : null}
      </AppCard>

      <button
        type="submit"
        disabled={!canStartSeason}
        className="w-full rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
      >
        {isSaving ? "Guardando..." : "Crear temporada"}
      </button>

      {error ? (
        <p className="text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <p className="text-center text-sm font-semibold text-stone-600">
          {feedback}
        </p>
      ) : null}

      {feedback && inviteCode ? (
        <InviteLinkCard inviteCode={inviteCode} leagueName={activeLeagueName} />
      ) : null}
    </form>
  );
}

export default function AdminSeasonPage() {
  const { t } = useI18n();
  const { hasLeagueAdminRole } = useLeagueAccess();
  const { activeLeague, activeSeason, roundSettings, players, matches } =
    useCurrentLeagueData();
  const canAccessAdmin = hasLeagueAdminRole(activeLeague.id);
  const isActiveSeason = activeSeason.status === "active";
  const isUpcomingSeason = activeSeason.status === "upcoming";
  const canReopenFinishedSeason =
    activeSeason.status === "finished" &&
    activeSeason.totalRounds > 0 &&
    matches.length > 0;

  if (!canAccessAdmin) {
    return (
      <div className="space-y-3">
        <header className="pt-2">
          <BackButton fallbackHref="/settings" label={t.common.back} />

          <h1 className="mt-4 text-3xl font-black tracking-tight">
            {t.adminPanel.accessDeniedTitle}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.adminPanel.accessDeniedCardTitle}</p>
          <p className="mt-2 text-sm text-stone-500">
            {t.adminPanel.accessDeniedDescription}
          </p>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-stone-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {isActiveSeason
            ? t.adminSeason.title
            : isUpcomingSeason
              ? "Temporada próximamente"
              : t.adminSeason.newSeasonTitle}
        </h1>

        <p className="mt-1 text-sm text-stone-500">
          {isActiveSeason
            ? t.adminSeason.description
            : isUpcomingSeason
              ? "La temporada está creada. Comiénzala cuando esté preparada para jugarse."
              : t.adminSeason.finishedDescription}
        </p>
      </header>

      {isActiveSeason ? (
        <>
          <RoundManagementPanel
            activeLeagueId={activeLeague.id}
            activeSeason={activeSeason}
            roundSettings={roundSettings}
            matches={matches}
          />

          <RoundOrderPanel
            activeSeasonId={activeSeason.id}
            totalRounds={activeSeason.totalRounds}
          />

          <SeasonPlayersStatus
            activeLeagueId={activeLeague.id}
            players={players}
          />

          <SeasonPlayerNamesPanel
            activeLeagueId={activeLeague.id}
            players={players}
          />

          <FinishSeasonPanel
            activeLeagueId={activeLeague.id}
            activeSeasonId={activeSeason.id}
          />

          <SeasonDangerZone
            activeLeagueId={activeLeague.id}
            activeSeasonId={activeSeason.id}
            totalRounds={activeSeason.totalRounds}
          />
        </>
      ) : isUpcomingSeason ? (
        <>
          <StartSeasonPanel
            activeLeagueId={activeLeague.id}
            activeSeasonId={activeSeason.id}
          />

          <RoundOrderPanel
            activeSeasonId={activeSeason.id}
            totalRounds={activeSeason.totalRounds}
          />

          <SeasonPlayersStatus
            activeLeagueId={activeLeague.id}
            players={players}
          />

          <SeasonPlayerNamesPanel
            activeLeagueId={activeLeague.id}
            players={players}
          />

          <SeasonDangerZone
            activeLeagueId={activeLeague.id}
            activeSeasonId={activeSeason.id}
            totalRounds={activeSeason.totalRounds}
          />
        </>
      ) : (
        <>
          {canReopenFinishedSeason ? (
            <>
              <ReopenSeasonPanel
                activeLeagueId={activeLeague.id}
                activeSeasonId={activeSeason.id}
              />

              <SeasonPlayerNamesPanel
                activeLeagueId={activeLeague.id}
                players={players}
              />
            </>
          ) : null}

          <NewSeasonForm
            key={`${activeSeason.id}-new`}
            activeLeagueId={activeLeague.id}
            activeLeagueName={activeLeague.name}
            activeSeasonId={activeSeason.id}
            currentPlayers={players}
          />
        </>
      )}
    </div>
  );
}
