"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlayerProfile } from "@/data/fakeData";
import {
  buildAvailabilityRecommendations,
  findStoredPlayerAvailability,
  getRecommendedDefaultDateTimeLocalValue,
  isSupabaseBackedAvailabilityId,
  type AvailabilityRecommendation,
  type PlayerAvailability,
} from "@/lib/playerAvailability";
import { fetchSupabasePlayerAvailabilities } from "@/lib/supabasePlayerAvailability";

type MatchAvailabilitySuggestionsProps = {
  leagueId: string;
  seasonId: string;
  playerIds: string[];
  players: PlayerProfile[];
  roundStartsAt: string | null;
  roundEndsAt: string | null;
  onUseSuggestion: (dateTimeLocalValue: string) => void;
  onDefaultSuggestionReady?: (dateTimeLocalValue: string) => void;
};

function getPlayerName(players: PlayerProfile[], playerId: string) {
  return players.find((player) => player.id === playerId)?.displayName ?? playerId;
}

function AvailabilitySuggestionCard({
  suggestion,
  players,
  totalPlayers,
  onUseSuggestion,
}: {
  suggestion: AvailabilityRecommendation;
  players: PlayerProfile[];
  totalPlayers: number;
  onUseSuggestion: (dateTimeLocalValue: string) => void;
}) {
  const isPerfectMatch = suggestion.coverage === totalPlayers;
  const missingNames = suggestion.missingPlayerIds.map((playerId) =>
    getPlayerName(players, playerId),
  );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-neutral-950">
            {suggestion.dateLabel}
          </p>
          <p className="mt-0.5 text-sm font-black text-neutral-950">
            {suggestion.timeLabel}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
            isPerfectMatch
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {suggestion.coverage}/{totalPlayers}
        </span>
      </div>

      <p className="mt-1 text-[11px] font-semibold leading-4 text-neutral-500">
        {isPerfectMatch
          ? "Coinciden todos los jugadores."
          : suggestion.isCommonForConfiguredPlayers
            ? `Coinciden los ${suggestion.configuredPlayerCount} jugadores con disponibilidad. Falta${missingNames.length === 1 ? "" : "n"}: ${missingNames.join(", ")}.`
            : `Falta${missingNames.length === 1 ? "" : "n"}: ${missingNames.join(", ")}.`}
      </p>

      <button
        type="button"
        onClick={() => onUseSuggestion(suggestion.dateTimeLocalValue)}
        className="mt-2 w-full rounded-lg bg-neutral-950 px-2.5 py-1.5 text-xs font-black text-white"
      >
        Usar este horario
      </button>
    </div>
  );
}

export function MatchAvailabilitySuggestions({
  leagueId,
  seasonId,
  playerIds,
  players,
  roundStartsAt,
  roundEndsAt,
  onUseSuggestion,
  onDefaultSuggestionReady,
}: MatchAvailabilitySuggestionsProps) {
  const [availabilities, setAvailabilities] = useState<PlayerAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRemoteError, setHasRemoteError] = useState(false);
  const playerIdsKey = playerIds.join("|");
  const uniquePlayerIds = useMemo(
    () => [...new Set(playerIdsKey.split("|").filter(Boolean))],
    [playerIdsKey],
  );
  const isPersistentAvailability =
    isSupabaseBackedAvailabilityId(leagueId) &&
    isSupabaseBackedAvailabilityId(seasonId) &&
    uniquePlayerIds.every(isSupabaseBackedAvailabilityId);

  useEffect(() => {
    let isCancelled = false;

    const storedAvailabilities = uniquePlayerIds
      .map((playerId) =>
        findStoredPlayerAvailability({ leagueId, seasonId, playerId }),
      )
      .filter((item): item is PlayerAvailability => Boolean(item));

    setAvailabilities(storedAvailabilities);
    setHasRemoteError(false);

    if (!isPersistentAvailability || uniquePlayerIds.length === 0) {
      return;
    }

    async function hydrateAvailabilities() {
      setIsLoading(true);

      try {
        const remoteAvailabilities = await fetchSupabasePlayerAvailabilities({
          leagueId,
          seasonId,
          playerIds: uniquePlayerIds,
        });

        if (!isCancelled) {
          setAvailabilities(remoteAvailabilities);
        }
      } catch {
        if (!isCancelled) {
          setHasRemoteError(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    hydrateAvailabilities();

    return () => {
      isCancelled = true;
    };
  }, [isPersistentAvailability, leagueId, seasonId, uniquePlayerIds]);

  const recommendations = useMemo(
    () =>
      buildAvailabilityRecommendations({
        playerIds: uniquePlayerIds,
        availabilities,
        startsAt: roundStartsAt,
        endsAt: roundEndsAt,
        maxResults: 5,
      }),
    [availabilities, roundEndsAt, roundStartsAt, uniquePlayerIds],
  );
  const defaultDateTimeLocalValue = useMemo(
    () =>
      getRecommendedDefaultDateTimeLocalValue({
        playerIds: uniquePlayerIds,
        availabilities,
        startsAt: roundStartsAt,
        endsAt: roundEndsAt,
      }),
    [availabilities, roundEndsAt, roundStartsAt, uniquePlayerIds],
  );

  useEffect(() => {
    if (!defaultDateTimeLocalValue) {
      return;
    }

    onDefaultSuggestionReady?.(defaultDateTimeLocalValue);
  }, [defaultDateTimeLocalValue, onDefaultSuggestionReady]);

  const playersWithoutAvailability = uniquePlayerIds.filter(
    (playerId) => !availabilities.some((item) => item.playerId === playerId),
  );

  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-neutral-950">
            Horarios recomendados
          </p>
          <p className="mt-0.5 text-[11px] font-semibold leading-4 text-neutral-500">
            La app cruza la disponibilidad semanal de los 4 jugadores y propone huecos de 2 horas.
          </p>
        </div>

        {isLoading ? (
          <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Cargando
          </span>
        ) : null}
      </div>

      {hasRemoteError ? (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] font-bold text-amber-800">
          No se ha podido cargar la disponibilidad remota. Se muestran datos guardados en este dispositivo si existen.
        </p>
      ) : null}

      {playersWithoutAvailability.length > 0 ? (
        <p className="mt-2 rounded-lg bg-white p-2 text-[11px] font-semibold leading-4 text-neutral-500">
          Falta disponibilidad de: {playersWithoutAvailability
            .map((playerId) => getPlayerName(players, playerId))
            .join(", ")}
          .
        </p>
      ) : null}

      {recommendations.length > 0 ? (
        <div className="mt-2 grid gap-2">
          {recommendations.map((suggestion) => (
            <AvailabilitySuggestionCard
              key={`${suggestion.dateTimeLocalValue}-${suggestion.coverage}`}
              suggestion={suggestion}
              players={players}
              totalPlayers={uniquePlayerIds.length}
              onUseSuggestion={onUseSuggestion}
            />
          ))}
        </div>
      ) : (
        <p className="mt-2 rounded-lg bg-white p-2 text-xs font-semibold leading-5 text-neutral-500">
          Todavía no hay huecos comunes suficientes. Pide a los jugadores que completen su disponibilidad o prueba con otro horario manualmente.
        </p>
      )}
    </section>
  );
}
