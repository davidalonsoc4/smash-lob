"use client";

import { useMemo, useState, type ReactNode } from "react";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { AppCard } from "@/components/ui/AppCard";
import { StatusHelp } from "@/components/ui/StatusHelp";
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
  resultActions?: ReactNode;
};

export function MvpVotingCard({
  match,
  currentUserId,
  players,
  matches,
  mvpSystem,
  resultActions,
}: MvpVotingCardProps) {
  const { tx, locale } = useI18n()
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
    return <>{resultActions}</>;
  }

  if (mvpSystem === "automatic" || mvpSystem === "automatic_advanced") {
    const isAdvancedAutomatic = mvpSystem === "automatic_advanced"
    const adjustedRating = roundMvp?.adjustedRating
    const advancedDetail =
      typeof adjustedRating === "number"
        ? `${tx("Índice ajustado")} ${new Intl.NumberFormat(locale === "en" ? "en-GB" : locale === "eu" ? "eu-ES" : "es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(adjustedRating * 100)}`
        : tx("Índice ajustado pendiente")

    return (
      <>
        {roundMvpPlayers.length > 0 && roundMvp ? (
          <MvpResultPanel
            title={`${tx("MVP de la jornada")}${isAdvancedAutomatic && roundMvp.tied ? ` · ${tx("Empate técnico")}` : ""}`}
            players={roundMvpPlayers}
            detail={
              isAdvancedAutomatic
                ? <>{tx("Automático avanzado")} · {typeof adjustedRating === "number" ? <AdjustedIndexHelp>{advancedDetail}</AdjustedIndexHelp> : advancedDetail}</>
                : `${tx("Automático")} · ${tx(`${roundMvp.gamesDiff ?? 0} dif. de juegos`)}`
            }
          />
        ) : (
          <p className="px-1 text-xs leading-5 text-neutral-500" data-mvp-pending>
            <span className="font-semibold">{tx("MVP de la jornada")} · </span>
            {isAdvancedAutomatic
              ? tx("Se calculará al completar la jornada usando resultados, compañeros y rivales.")
              : tx("Se calculará al completar la jornada.")}
          </p>
        )}
        {resultActions}
      </>
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
    <>
      {matchProgress.complete && matchMvpPlayers.length > 0 ? (
        <MvpResultPanel title={tx("MVP del partido")} players={matchMvpPlayers} detail={tx("Cerrado")} />
      ) : null}
      {roundMvp && roundMvpPlayers.length > 0 ? (
        <MvpResultPanel title={tx("MVP de la jornada")} players={roundMvpPlayers} />
      ) : null}
      {resultActions}
      {!matchProgress.complete ? (
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

    </AppCard>
      ) : null}
    </>
  );
}

function MvpResultPanel({
  title,
  players,
  detail,
}: {
  title: string;
  players: MvpPlayer[];
  detail?: ReactNode;
}) {
  return (
    <div className="app-match-mvp-recognition flex items-center gap-2.5 rounded-xl border border-neutral-200 px-3 py-2.5" data-mvp-recognition>
      <span className="app-match-mvp-star text-xl" aria-hidden="true">★</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-500">
          {title}
        </p>
        <p className="app-match-mvp-name break-words text-lg font-bold leading-snug text-neutral-950">
          {players.map((player) => player.displayName).join(" / ")}
        </p>
        {detail ? (
          <p className="text-xs text-neutral-500">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

function AdjustedIndexHelp({ children }: { children: ReactNode }) {
  const { tx } = useI18n()
  return (
    <StatusHelp label={tx("Información sobre el índice ajustado")} className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2" description={
      <span className="block space-y-2">
        <span className="block font-black">{tx("Cómo se elige el MVP avanzado")}</span>
        <span className="block">{tx("Primero se elige la pareja ganadora más dominante de la jornada: diferencia de juegos y, si empata, sets y juegos a favor y en contra.")}</span>
        <span className="block">{tx("El índice usa los partidos válidos de esta temporada hasta esa jornada. Por partido: resultado (60%), diferencia relativa de sets (25%) y de juegos (15%). Ajusta la aportación estimada según compañeros y rivales, suavizando la estimación cuando hay pocos datos.")}</span>
        <span className="block">{tx("Se muestra multiplicado por 100. Cuanto mayor, mejor; no es un porcentaje ni una escala fija de 0 a 100.")}</span>
        <span className="block">{tx("Si los índices de los dos compañeros difieren en 3 puntos o menos, comparten el MVP por empate técnico.")}</span>
      </span>
    }>
      {children}
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3 w-3 shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none" /></svg>
    </StatusHelp>
  )
}
