"use client"

import { useMemo, useState } from "react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { useMvp } from "@/context/MvpProvider"
import {
  getMatchMvpSelection,
  getMatchVotingProgress,
  getPlayerMatchVote,
  getPlayersByIds,
  getRoundMvpSelection,
  getRoundVotingProgress,
  type MvpMatch,
  type MvpPlayer,
  type MvpSystem,
} from "@/lib/mvp"

type MvpVotingCardProps = {
  match: MvpMatch
  currentUserId: string
  players: MvpPlayer[]
  matches: MvpMatch[]
  mvpSystem: MvpSystem
}

export function MvpVotingCard({
  match,
  currentUserId,
  players,
  matches,
  mvpSystem,
}: MvpVotingCardProps) {
  const { votes, voteForMatchMvp } = useMvp()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const participantIds = useMemo(
    () => Array.from(new Set([...match.teamA, ...match.teamB])),
    [match.teamA, match.teamB],
  )
  const currentVote = getPlayerMatchVote({
    votes,
    matchId: match.id,
    voterPlayerId: currentUserId,
  })
  const matchProgress = getMatchVotingProgress({ votes, match })
  const matchMvp = getMatchMvpSelection({ votes, match })
  const roundProgress = getRoundVotingProgress({
    votes,
    leagueId: match.leagueId,
    seasonId: match.seasonId,
    round: match.round,
    matches,
  })
  const roundMvp = getRoundMvpSelection({
    votes,
    leagueId: match.leagueId,
    seasonId: match.seasonId,
    round: match.round,
    matches,
    mvpSystem,
  })
  const matchMvpPlayers = getPlayersByIds(players, matchMvp?.playerIds ?? [])
  const roundMvpPlayers = getPlayersByIds(players, roundMvp?.playerIds ?? [])
  const candidates = players.filter(
    (player) =>
      participantIds.includes(player.id) && player.id !== currentUserId,
  )
  const isParticipant = participantIds.includes(currentUserId)

  if (mvpSystem === "none") {
    return null
  }

  if (mvpSystem === "automatic") {
    return (
      <AppCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-black">MVP de la jornada</p>
            <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
              Se calcula automáticamente cuando todos los partidos de la jornada
              {` ${match.round}`} tienen resultado.
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-black text-neutral-700">
            Automático
          </span>
        </div>

        {roundMvpPlayers.length > 0 && roundMvp ? (
          <MvpResultPanel
            title={`MVP Jornada ${match.round}`}
            players={roundMvpPlayers}
            detail={`${roundMvp.setsFor}-${roundMvp.setsAgainst} sets · ${roundMvp.gamesFor}-${roundMvp.gamesAgainst} juegos · ${roundMvp.gamesDiff} dif.`}
          />
        ) : (
          <PendingText text="Pendiente hasta que la jornada esté completa." />
        )}
      </AppCard>
    )
  }

  async function vote(selectedPlayerId: string) {
    if (!match.id || isSaving || matchProgress.complete) {
      return
    }

    setIsSaving(true)
    setError(null)
    const saved = await voteForMatchMvp({
      leagueId: match.leagueId,
      seasonId: match.seasonId,
      matchId: match.id,
      round: match.round,
      voterPlayerId: currentUserId,
      selectedPlayerId,
    })
    setIsSaving(false)

    if (!saved) {
      setError("No se ha podido guardar tu voto. Inténtalo de nuevo.")
    }
  }

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black">Vota al MVP del partido</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            El voto es obligatorio y no puedes elegirte a ti mismo. Los votos se
            muestran cuando hayan votado los cuatro jugadores.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
            matchProgress.complete
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {matchProgress.submitted}/{matchProgress.required} votos
        </span>
      </div>

      {isParticipant && !matchProgress.complete ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {candidates.map((player) => {
            const selected = currentVote?.selectedPlayerId === player.id

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => vote(player.id)}
                disabled={isSaving}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left disabled:opacity-50 ${
                  selected
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-900"
                }`}
              >
                <PlayerAvatar
                  player={player}
                  size="sm"
                  className={selected ? "bg-white text-neutral-950" : undefined}
                />
                <span className="min-w-0 truncate text-sm font-black">
                  {player.displayName}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      {isParticipant && currentVote && !matchProgress.complete ? (
        <p className="mt-2 text-xs font-semibold text-neutral-500">
          Has votado a {players.find((item) => item.id === currentVote.selectedPlayerId)?.displayName ?? "un jugador"}. Puedes cambiarlo hasta que se cierre la votación.
        </p>
      ) : null}

      {!isParticipant ? (
        <PendingText text="Solo los cuatro participantes pueden votar en este partido." />
      ) : null}

      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>
      ) : null}

      {matchProgress.complete && matchMvpPlayers.length > 0 && matchMvp ? (
        <MvpResultPanel
          title="MVP del partido"
          players={matchMvpPlayers}
          detail={`${matchMvp.votes} ${matchMvp.votes === 1 ? "voto" : "votos"}${matchMvp.tied ? " · Empate compartido" : ""}`}
        />
      ) : null}

      <div className="mt-3 border-t border-neutral-100 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black">MVP de la jornada {match.round}</p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-500">
              Suma los votos recibidos en todos los partidos de la jornada.
            </p>
          </div>
          <span className="shrink-0 text-xs font-black text-neutral-500">
            {roundProgress.submitted}/{roundProgress.required}
          </span>
        </div>

        {roundMvp && roundMvpPlayers.length > 0 ? (
          <MvpResultPanel
            title={`MVP Jornada ${match.round}`}
            players={roundMvpPlayers}
            detail={`${roundMvp.votes} ${roundMvp.votes === 1 ? "voto" : "votos"}${roundMvp.tied ? " · Empate compartido" : ""}`}
          />
        ) : (
          <PendingText text="Se decidirá cuando estén terminados todos los partidos y hayan votado todos sus jugadores." />
        )}
      </div>
    </AppCard>
  )
}

function MvpResultPanel({
  title,
  players,
  detail,
}: {
  title: string
  players: MvpPlayer[]
  detail: string
}) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl bg-neutral-950 p-2.5 text-white">
      <div className="flex -space-x-2">
        {players.map((player) => (
          <PlayerAvatar
            key={player.id}
            player={player}
            size="md"
            className="border border-white/20 bg-white text-neutral-950"
          />
        ))}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
          ⭐ {title}
        </p>
        <p className="truncate text-base font-black">
          {players.map((player) => player.displayName).join(" / ")}
        </p>
        <p className="text-xs font-semibold text-white/70">{detail}</p>
      </div>
    </div>
  )
}

function PendingText({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-lg bg-neutral-100 px-2.5 py-2 text-xs font-semibold leading-5 text-neutral-600">
      {text}
    </div>
  )
}
