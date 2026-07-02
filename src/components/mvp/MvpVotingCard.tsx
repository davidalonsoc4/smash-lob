"use client"

import { AppCard } from "@/components/ui/AppCard"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import {
  getPlayersByIds,
  getRoundMvpSelection,
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
  players,
  matches,
}: MvpVotingCardProps) {
  const roundMvp = getRoundMvpSelection({
    leagueId,
    seasonId,
    round,
    matches,
  })
  const roundMvpPlayers = getPlayersByIds(players, roundMvp?.playerIds ?? [])

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black">MVP de la jornada</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            Se calcula automáticamente cuando todos los partidos de la jornada {round} tienen resultado.
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
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
              ⭐ MVP Jornada {round}
            </p>
            <p className="truncate text-base font-black">
              {roundMvpPlayers.map((player) => player.displayName).join(" / ")}
            </p>
            <p className="text-xs font-semibold text-white/70">
              {roundMvp.setsFor}-{roundMvp.setsAgainst} sets · {roundMvp.gamesFor}-{roundMvp.gamesAgainst} juegos · {roundMvp.gamesDiff} dif.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-2 rounded-lg bg-neutral-100 px-2.5 py-2 text-xs font-semibold text-neutral-600">
          Pendiente hasta que la jornada esté completa.
        </div>
      )}
    </AppCard>
  )
}
