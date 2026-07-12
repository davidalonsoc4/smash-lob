"use client"

import { AppCard } from "@/components/ui/AppCard"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useMvp } from "@/context/MvpProvider"
import {
  getMatchMvpSelection,
  getMissingMatchMvpVoterIds,
  getPlayerById,
  getPlayerMatchVote,
  getPlayersByIds,
  getRoundMvpSelection,
  type MvpMatch,
  type MvpPlayer,
  type SeasonMvpMode,
} from "@/lib/mvp"

type MvpVotingCardProps = {
  leagueId: string
  seasonId: string
  match: MvpMatch
  currentUserId: string
  players: MvpPlayer[]
  matches: MvpMatch[]
  mvpMode: SeasonMvpMode
}

function playerNames(players: MvpPlayer[]) {
  return players.map((player) => player.displayName).join(" / ")
}

export function MvpVotingCard({
  leagueId,
  seasonId,
  match,
  currentUserId,
  players,
  matches,
  mvpMode,
}: MvpVotingCardProps) {
  const { votes, voteForRoundMvp } = useMvp()
  const participantIds = Array.from(new Set([...match.teamA, ...match.teamB]))
  const isParticipant = participantIds.includes(currentUserId)
  const currentVote = match.id
    ? getPlayerMatchVote({
        votes,
        leagueId,
        seasonId,
        matchId: match.id,
        voterPlayerId: currentUserId,
      })
    : undefined
  const matchMvp = getMatchMvpSelection({ votes, leagueId, seasonId, match })
  const matchMvpPlayers = getPlayersByIds(players, matchMvp?.playerIds ?? [])
  const missingVoterIds = getMissingMatchMvpVoterIds({ votes, match })
  const missingVoters = getPlayersByIds(players, missingVoterIds)
  const roundMvp = getRoundMvpSelection({
    leagueId,
    seasonId,
    round: match.round,
    matches,
    votes,
    mvpMode,
  })
  const roundMvpPlayers = getPlayersByIds(players, roundMvp?.playerIds ?? [])

  if (mvpMode === "none") {
    return null
  }

  if (mvpMode === "automatic") {
    return (
      <AppCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-black">MVP de la jornada</p>
            <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
              Se calcula automaticamente cuando todos los partidos de la jornada {match.round} tienen resultado.
            </p>
          </div>

          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-black text-neutral-700">
            Auto
          </span>
        </div>

        {roundMvpPlayers.length > 0 && roundMvp ? (
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-neutral-950 p-2.5 text-white">
            <div className="flex -space-x-2">
              {roundMvpPlayers.map((player) => (
                <PlayerAvatar
                  key={player.id}
                  player={player}
                  size="md"
                  className="border border-white/20 bg-white text-neutral-950"
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase text-white/60">
                MVP Jornada {match.round}
              </p>
              <p className="truncate text-base font-black">
                {playerNames(roundMvpPlayers)}
              </p>
              <p className="text-xs font-semibold text-white/70">
                {roundMvp.setsFor}-{roundMvp.setsAgainst} sets - {roundMvp.gamesFor}-{roundMvp.gamesAgainst} juegos - {roundMvp.gamesDiff} dif.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-2 rounded-lg bg-neutral-100 px-2.5 py-2 text-xs font-semibold text-neutral-600">
            Pendiente hasta que la jornada este completa.
          </div>
        )}
      </AppCard>
    )
  }

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black">Votar MVP del partido</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            Elige a un jugador del partido. No puedes votarte a ti mismo.
          </p>
        </div>

        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-black text-neutral-700">
          Votacion
        </span>
      </div>

      {isParticipant && match.id ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {participantIds.map((playerId) => {
            const player = getPlayerById(players, playerId)
            const isSelf = playerId === currentUserId
            const isSelected = currentVote?.selectedPlayerId === playerId

            return (
              <button
                key={playerId}
                type="button"
                onClick={() =>
                  voteForRoundMvp({
                    leagueId,
                    seasonId,
                    round: match.round,
                    matchId: match.id,
                    voterPlayerId: currentUserId,
                    selectedPlayerId: playerId,
                  })
                }
                disabled={isSelf}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  isSelected
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-800"
                }`}
              >
                <PlayerAvatar
                  player={player}
                  size="sm"
                  className={isSelected ? "bg-white text-neutral-950" : ""}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">
                    {player?.displayName ?? playerId}
                  </span>
                  {isSelf ? (
                    <span className="mt-0.5 block text-xs font-semibold opacity-70">
                      Tu voto no puede ser para ti
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-neutral-100 px-3 py-2.5 text-xs font-semibold text-neutral-600">
          Solo los jugadores de este partido pueden votar.
        </div>
      )}

      <div className="mt-3 rounded-xl bg-neutral-100 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black">MVP provisional del partido</p>
          <p className="text-xs font-bold text-neutral-500">
            {matchMvp ? `${matchMvp.votes} votos` : "Sin votos"}
          </p>
        </div>
        <p className="mt-1 text-sm font-semibold text-neutral-700">
          {matchMvpPlayers.length > 0 ? playerNames(matchMvpPlayers) : "Pendiente de votos"}
        </p>
        {missingVoters.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-amber-700">
            Faltan: {playerNames(missingVoters)}
          </p>
        ) : (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            Todos los jugadores del partido han votado.
          </p>
        )}
      </div>

      {roundMvpPlayers.length > 0 ? (
        <div className="mt-3 rounded-xl bg-neutral-950 px-3 py-2.5 text-white">
          <p className="text-[11px] font-black uppercase text-white/60">
            MVP provisional Jornada {match.round}
          </p>
          <p className="mt-1 truncate text-sm font-black">
            {playerNames(roundMvpPlayers)}
          </p>
        </div>
      ) : null}
    </AppCard>
  )
}
