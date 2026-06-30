"use client"

import { AppCard } from "@/components/ui/AppCard"
import {
  getPlayerMvpSummary,
  type MvpMatch,
  type MvpPlayer,
} from "@/lib/mvp"

type PlayerMvpPanelProps = {
  leagueId: string
  seasonId: string
  playerId: string
  matches: MvpMatch[]
  players: MvpPlayer[]
}

export function PlayerMvpPanel({
  leagueId,
  seasonId,
  playerId,
  matches,
}: PlayerMvpPanelProps) {
  const summary = getPlayerMvpSummary({
    leagueId,
    seasonId,
    matches,
    playerId,
  })

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-500">MVP</p>
          <p className="mt-1 text-xl font-black">Reconocimientos</p>
        </div>

        {summary.seasonMvpCount > 0 ? (
          <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-black text-white">
            MVP final
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
        <div className="rounded-xl bg-neutral-100 p-3">
          <p className="font-black">{summary.roundMvpCount}</p>
          <p className="mt-1 text-xs text-neutral-500">MVPs de jornada</p>
        </div>

        <div className="rounded-xl bg-neutral-100 p-3">
          <p className="font-black">{summary.seasonMvpCount}</p>
          <p className="mt-1 text-xs text-neutral-500">MVP final</p>
        </div>
      </div>

      {summary.roundMvpRounds.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {summary.roundMvpRounds.map((round) => (
            <span
              key={round}
              className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-black text-white"
            >
              MVP Jornada {round}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-neutral-100 p-3 text-sm font-semibold text-neutral-500">
          Todavía no tiene MVPs registrados en esta temporada.
        </p>
      )}
    </AppCard>
  )
}
