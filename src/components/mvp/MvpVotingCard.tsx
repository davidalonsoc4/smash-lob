"use client";

import { useMemo, useState } from "react";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { AppCard } from "@/components/ui/AppCard";
import { useMvp } from "@/context/MvpProvider";
import {
  getMatchMvpSelection,
  getMatchVotingProgress,
  getPlayerMatchVote,
  getPlayersByIds,
  getRoundMvpSelection,
  type MvpMatch,
  type MvpPlayer,
  type MvpSystem,
} from "@/lib/mvp";
import { useI18n } from "@/i18n/I18nProvider"

type MvpVotingCardProps = {
  match: MvpMatch;
  currentUserId: string;
  players: MvpPlayer[];
  matches: MvpMatch[];
  mvpSystem: MvpSystem;
};

export function MvpVotingCard({
  match,
  currentUserId,
  players,
  matches,
  mvpSystem,
}: MvpVotingCardProps) {
  const { tx } = useI18n()
  const { votes, voteForMatchMvp } = useMvp();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const participantIds = useMemo(
    () => Array.from(new Set([...match.teamA, ...match.teamB])),
    [match.teamA, match.teamB],
  );
  const currentVote = getPlayerMatchVote({
    votes,
    matchId: match.id,
    voterPlayerId: currentUserId,
  });
  const matchProgress = getMatchVotingProgress({ votes, match });
  const matchMvp = getMatchMvpSelection({ votes, match });
  const roundMvp = getRoundMvpSelection({
    votes,
    leagueId: match.leagueId,
    seasonId: match.seasonId,
    round: match.round,
    matches,
    mvpSystem,
  });
  const matchMvpPlayers = getPlayersByIds(players, matchMvp?.playerIds ?? []);
  const roundMvpPlayers = getPlayersByIds(players, roundMvp?.playerIds ?? []);
  const candidates = players.filter(
    (player) =>
      participantIds.includes(player.id) && player.id !== currentUserId,
  );
  const isParticipant = participantIds.includes(currentUserId);
  const hasPendingVote =
    isParticipant && !currentVote && !matchProgress.complete;

  if (mvpSystem === "none") {
    return null;
  }

  if (mvpSystem === "automatic" || mvpSystem === "automatic_advanced") {
    const isAdvancedAutomatic = mvpSystem === "automatic_advanced"
    const adjustedRating = roundMvp?.adjustedRating
    const advancedDetail =
      typeof adjustedRating === "number"
        ? tx(`Índice ajustado ${(adjustedRating * 100).toFixed(1)}${roundMvp?.tied ? " · empate técnico" : ""}`)
        : "Índice ajustado pendiente"

    return (
      <AppCard className="p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="type-panel-title">{tx("MVP de la jornada")}</p>
          <span className="rounded-full bg-neutral-100 px-2 py-1 type-caption font-black text-neutral-600">
            {isAdvancedAutomatic ? tx("Automático avanzado") : tx("Automático")}
          </span>
        </div>

        {roundMvpPlayers.length > 0 && roundMvp ? (
          <MvpResultPanel
            title={tx(`Jornada ${match.round}`)}
            players={roundMvpPlayers}
            detail={
              isAdvancedAutomatic
                ? advancedDetail
                : tx(`${roundMvp.gamesDiff ?? 0} dif. de juegos`)
            }
          />
        ) : (
          <p className="mt-2 text-xs font-semibold text-neutral-500">
            {isAdvancedAutomatic
              ? tx("Se calculará al completar la jornada usando resultados, compañeros y rivales.")
              : tx("Se calculará al completar la jornada.")}
          </p>
        )}
      </AppCard>
    );
  }

  async function vote(selectedPlayerId: string) {
    if (!match.id || isSaving || matchProgress.complete) {
      return;
    }

    setIsSaving(true);
    setError(null);
    const saved = await voteForMatchMvp({
      leagueId: match.leagueId,
      seasonId: match.seasonId,
      matchId: match.id,
      round: match.round,
      voterPlayerId: currentUserId,
      selectedPlayerId,
    });
    setIsSaving(false);

    if (!saved) {
      setError("No se ha podido guardar tu voto.");
    }
  }

  return (
    <AppCard
      className={`p-2.5 ${
        hasPendingVote
          ? "border-amber-300 bg-amber-50/70 ring-1 ring-amber-200"
          : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="type-panel-title">{tx("MVP del partido")}</p>
        {hasPendingVote ? (
          <span className="rounded-full bg-amber-200 px-2 py-1 type-caption font-black text-amber-900">
            {tx("Voto pendiente")}{" "}</span>
        ) : currentVote || matchProgress.complete ? (
          <span className="rounded-full bg-emerald-100 px-2 py-1 type-caption font-black text-emerald-700">
            {matchProgress.complete ? "Cerrado" : "Votado"}
          </span>
        ) : null}
      </div>

      {isParticipant && !matchProgress.complete ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {candidates.map((player) => {
            const selected = currentVote?.selectedPlayerId === player.id;

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => vote(player.id)}
                disabled={isSaving}
                className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 disabled:opacity-50 ${
                  selected
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-900"
                }`}
              >
                <PlayerAvatar
                  player={player}
                  size="sm"
                  className={selected ? "bg-white text-neutral-950" : undefined}
                />
                <span className="w-full truncate text-center type-caption font-black">
                  {player.displayName}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {!isParticipant ? (
        <p className="mt-2 text-xs font-semibold text-neutral-500">
          {tx("Solo pueden votar los participantes.")}{" "}</p>
      ) : null}

      {error ? (
        <p className="mt-1.5 type-caption font-semibold text-red-600">{tx(error)}</p>
      ) : null}

      {matchProgress.complete && matchMvpPlayers.length > 0 ? (
        <MvpResultPanel title={tx("Partido")} players={matchMvpPlayers} />
      ) : null}

      {roundMvp && roundMvpPlayers.length > 0 ? (
        <MvpResultPanel
          title={tx(`Jornada ${match.round}`)}
          players={roundMvpPlayers}
        />
      ) : null}
    </AppCard>
  );
}

function MvpResultPanel({
  title,
  players,
  detail,
}: {
  title: string;
  players: MvpPlayer[];
  detail?: string;
}) {
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-neutral-950 p-1.5 text-white">
      <div className="flex -space-x-2">
        {players.map((player) => (
          <PlayerAvatar
            key={player.id}
            player={player}
            size="sm"
            className="border border-white/20 bg-white text-neutral-950"
          />
        ))}
      </div>
      <div className="min-w-0">
        <p className="type-caption font-black uppercase tracking-[0.14em] text-white/60">
          ⭐ MVP {title}
        </p>
        <p className="truncate text-sm font-black">
          {players.map((player) => player.displayName).join(" / ")}
        </p>
        {detail ? (
          <p className="type-caption font-semibold text-white/65">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}
