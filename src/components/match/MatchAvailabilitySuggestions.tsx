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

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`size-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
      fill="none"
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-3.5"
      fill="none"
    >
      <path
        d="M7 4.5 12.5 10 7 15.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AvailabilitySuggestionCard({
  suggestion,
  players,
  totalPlayers,
  onSelectSuggestion,
}: {
  suggestion: AvailabilityRecommendation;
  players: PlayerProfile[];
  totalPlayers: number;
  onSelectSuggestion: (dateTimeLocalValue: string) => void;
}) {
  const isPerfectMatch = suggestion.coverage === totalPlayers;
  const missingNames = suggestion.missingPlayerIds.map((playerId) =>
    getPlayerName(players, playerId),
  );
  const missingLabel = missingNames.length > 0 ? `Faltan: ${missingNames.join(", ")}` : null;

  return (
    <button
      type="button"
      onClick={() => onSelectSuggestion(suggestion.dateTimeLocalValue)}
      className="group w-full cursor-pointer rounded-xl border border-neutral-200 bg-white p-2 text-left shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50 active:scale-[0.99]"
      aria-label={`Seleccionar horario recomendado ${suggestion.dateLabel}, ${suggestion.timeLabel}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black text-neutral-500">
            {suggestion.dateLabel}
          </p>
          <p className="mt-0.5 text-sm font-black text-neutral-950">
            {suggestion.timeLabel}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
              isPerfectMatch
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {suggestion.coverage}/{totalPlayers}
          </span>
          <span className="grid size-7 place-items-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 transition group-hover:border-neutral-400 group-hover:bg-neutral-950 group-hover:text-white">
            <ArrowRightIcon />
          </span>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        {missingLabel ? (
          <p className="min-w-0 truncate text-[11px] font-semibold text-neutral-500">
            {missingLabel}
          </p>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-700">
            Todos disponibles
          </span>
        )}

        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-neutral-500 group-hover:text-neutral-900">
          Seleccionar
        </span>
      </div>
    </button>
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
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleSelectSuggestion = (dateTimeLocalValue: string) => {
    onUseSuggestion(dateTimeLocalValue);
    setIsExpanded(false);
  };
  const bestRecommendation = recommendations[0] ?? null;
  const summaryText = isLoading
    ? "Calculando..."
    : bestRecommendation
      ? `${recommendations.length} propuesta${recommendations.length === 1 ? "" : "s"}. Mejor: ${bestRecommendation.dateLabel}, ${bestRecommendation.timeLabel}.`
      : playersWithoutAvailability.length > 0
        ? "Faltan disponibilidades."
        : "Sin huecos comunes.";

  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-2">
      <button
        type="button"
        onClick={() => setIsExpanded((currentValue) => !currentValue)}
        className="group flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={isExpanded}
      >
        <div className="min-w-0">
          <p className="text-sm font-black text-neutral-950">
            Horarios recomendados
          </p>
          <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold leading-4 text-neutral-500">
            {summaryText}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isLoading ? (
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-500">
              ...
            </span>
          ) : recommendations.length > 0 ? (
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-600">
              {recommendations.length}
            </span>
          ) : null}

          <span className="grid size-7 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition group-hover:border-neutral-400 group-hover:text-neutral-950">
            <ChevronIcon isExpanded={isExpanded} />
          </span>
        </div>
      </button>

      {isExpanded ? (
        <div className="mt-2 space-y-1.5">
          {hasRemoteError ? (
            <p className="rounded-lg bg-amber-50 p-2 text-[11px] font-bold text-amber-800">
              No se ha podido cargar la disponibilidad remota. Se muestran datos de este dispositivo si existen.
            </p>
          ) : null}

          {playersWithoutAvailability.length > 0 ? (
            <p className="rounded-lg bg-white p-2 text-[11px] font-semibold leading-4 text-neutral-500">
              Sin disponibilidad: {playersWithoutAvailability
                .map((playerId) => getPlayerName(players, playerId))
                .join(", ")}
              .
            </p>
          ) : null}

          {recommendations.length > 0 ? (
            <div className="grid gap-1.5">
              {recommendations.map((suggestion) => (
                <AvailabilitySuggestionCard
                  key={`${suggestion.dateTimeLocalValue}-${suggestion.coverage}`}
                  suggestion={suggestion}
                  players={players}
                  totalPlayers={uniquePlayerIds.length}
                  onSelectSuggestion={handleSelectSuggestion}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-white p-2 text-xs font-semibold leading-5 text-neutral-500">
              No hay huecos de 2 horas. Completa más disponibilidades o introduce el horario manualmente.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
