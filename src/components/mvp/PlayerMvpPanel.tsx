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
  isSeasonClosed: boolean
}

export function PlayerMvpPanel({
  leagueId,
  seasonId,
  playerId,
  matches,
  isSeasonClosed,
}: PlayerMvpPanelProps) {
  const summary = getPlayerMvpSummary({
    leagueId,
    seasonId,
    matches,
    playerId,
  })
  const showFinalMvp = isSeasonClosed && summary.seasonMvpCount > 0

  return (
    <AppCard className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-neutral-500">
            MVP
          </p>
          <p className="mt-1 text-sm font-black text-neutral-950">
            Reconocimientos de jornada
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-neutral-950 px-3 py-2 text-center text-white">
          <p className="text-lg font-black leading-none">
            {summary.roundMvpCount}
          </p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-neutral-300">
            total
          </p>
        </div>
      </div>

      {summary.roundMvpRounds.length > 0 ? (
        <p className="mt-3 text-xs font-semibold leading-relaxed text-neutral-500">
          Jornadas: {summary.roundMvpRounds.map((round) => `Jornada ${round}`).join(" · ")}
        </p>
      ) : (
        <p className="mt-3 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-500">
          Todavía no tiene MVPs de jornada en esta temporada.
        </p>
      )}

      {showFinalMvp ? (
        <p className="mt-2 inline-flex rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          MVP final de temporada
        </p>
      ) : null}
    </AppCard>
  )
}
