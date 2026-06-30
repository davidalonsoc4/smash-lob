"use client"

import { AppCard } from "@/components/ui/AppCard"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useMvp } from "@/context/MvpProvider"
import {
  getPlayerById,
  getPlayerRoundVote,
  getRoundMvpSelection,
  getRoundPlayerIds,
  getRoundVoteRows,
  type MvpMatch,
  type MvpPlayer,
} from "@/lib/mvp"

type MvpVotingCardProps = {
  leagueId: string
  seasonId: string
  round: number
  currentUserId: string
  players: MvpPlayer[]
  matches: MvpMatch[]
}

export function MvpVotingCard({
  leagueId,
  seasonId,
  round,
  currentUserId,
  players,
  matches,
}: MvpVotingCardProps) {
  const { votes, manualSelections, voteForRoundMvp } = useMvp()
  const candidateIds = getRoundPlayerIds(matches, round)
  const candidates = candidateIds
    .map((playerId) => getPlayerById(players, playerId))
    .filter((player): player is MvpPlayer => Boolean(player))
  const currentVote = getPlayerRoundVote({
    votes,
    leagueId,
    seasonId,
    round,
    voterPlayerId: currentUserId,
  })
  const roundMvp = getRoundMvpSelection({
    votes,
    manualSelections,
    leagueId,
    seasonId,
    round,
  })
  const selectedMvpPlayer = getPlayerById(players, roundMvp?.playerId ?? null)
  const voteRows = getRoundVoteRows({ votes, leagueId, seasonId, round })
  const canVote = candidates.some((candidate) => candidate.id === currentUserId)

  if (candidates.length === 0) {
    return null
  }

  function handleVote(selectedPlayerId: string) {
    if (!canVote) {
      return
    }

    voteForRoundMvp({
      leagueId,
      seasonId,
      round,
      voterPlayerId: currentUserId,
      selectedPlayerId,
    })
  }

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">MVP de la jornada</p>
          <p className="mt-2 text-sm text-neutral-500">
            Vota al jugador más decisivo de la jornada {round}.
          </p>
        </div>

        {roundMvp ? (
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
            {roundMvp.source === "manual" ? "Admin" : "Votos"}
          </span>
        ) : null}
      </div>

      {selectedMvpPlayer ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-950 p-3 text-white">
          <PlayerAvatar
            player={selectedMvpPlayer}
            size="md"
            className="border border-white/20 bg-white text-neutral-950"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
              MVP provisional
            </p>
            <p className="truncate text-lg font-black">
              {selectedMvpPlayer.displayName}
            </p>
            <p className="text-xs font-semibold text-white/70">
              {roundMvp?.votes ?? 0} votos recibidos
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-neutral-100 p-3 text-sm font-semibold text-neutral-600">
          Todavía no hay MVP provisional en esta jornada.
        </div>
      )}

      {canVote ? (
        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Tu voto
          </p>

          <div className="mt-3 grid gap-2">
            {candidates.map((candidate) => {
              const isSelected = currentVote?.selectedPlayerId === candidate.id
              const voteCount =
                voteRows.find((row) => row.playerId === candidate.id)?.votes ?? 0

              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => handleVote(candidate.id)}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition active:scale-[0.99] ${
                    isSelected
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-white text-neutral-950"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <PlayerAvatar
                      player={candidate}
                      size="sm"
                      className={isSelected ? "bg-white text-neutral-950" : ""}
                    />
                    <span className="truncate text-sm font-black">
                      {candidate.displayName}
                    </span>
                  </span>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-black ${
                      isSelected
                        ? "bg-white/15 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {voteCount}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm font-semibold text-neutral-500">
          Solo los jugadores de la jornada pueden votar el MVP.
        </p>
      )}
    </AppCard>
  )
}
