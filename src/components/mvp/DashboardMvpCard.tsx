"use client"

import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useMvp } from "@/context/MvpProvider"
import {
  getLatestFinishedRound,
  getPlayerById,
  getRoundMvpSelection,
  getSeasonMvpSelection,
  type MvpMatch,
  type MvpPlayer,
} from "@/lib/mvp"

type DashboardMvpCardProps = {
  leagueId: string
  seasonId: string
  isSeasonClosed: boolean
  canManage: boolean
  players: MvpPlayer[]
  matches: MvpMatch[]
}

function MvpCompactItem({
  label,
  player,
  helper,
}: {
  label: string
  player: MvpPlayer | null
  helper: string
}) {
  return (
    <div className="rounded-2xl bg-neutral-100 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </p>
      {player ? (
        <div className="mt-2 flex items-center gap-2">
          <PlayerAvatar player={player} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-neutral-950">
              {player.displayName}
            </p>
            <p className="text-xs font-semibold text-neutral-500">{helper}</p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm font-bold text-neutral-500">Pendiente</p>
      )}
    </div>
  )
}

export function DashboardMvpCard({
  leagueId,
  seasonId,
  isSeasonClosed,
  canManage,
  players,
  matches,
}: DashboardMvpCardProps) {
  const { votes, manualSelections } = useMvp()
  const latestFinishedRound = getLatestFinishedRound(matches)
  const latestRoundMvp = latestFinishedRound
    ? getRoundMvpSelection({
        votes,
        manualSelections,
        leagueId,
        seasonId,
        round: latestFinishedRound,
      })
    : null
  const seasonMvp = getSeasonMvpSelection({
    votes,
    manualSelections,
    leagueId,
    seasonId,
    matches,
  })
  const latestRoundMvpPlayer = getPlayerById(
    players,
    latestRoundMvp?.playerId ?? null
  )
  const seasonMvpPlayer = getPlayerById(players, seasonMvp?.playerId ?? null)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight">MVP</h2>
          <p className="text-sm text-neutral-500">
            Votaciones y destacados de la temporada.
          </p>
        </div>

        {canManage ? (
          <Link
            href="/admin/mvp"
            className="shrink-0 text-sm font-semibold text-neutral-600"
          >
            Gestionar
          </Link>
        ) : null}
      </div>

      <AppCard>
        <div className="grid grid-cols-2 gap-3">
          <MvpCompactItem
            label="Última jornada"
            player={latestRoundMvpPlayer}
            helper={
              latestFinishedRound
                ? `J${latestFinishedRound} · ${latestRoundMvp?.votes ?? 0} votos`
                : "Sin jornadas cerradas"
            }
          />

          <MvpCompactItem
            label={isSeasonClosed ? "MVP final" : "MVP temporada"}
            player={seasonMvpPlayer}
            helper={
              seasonMvp
                ? seasonMvp.source === "manual"
                  ? "Selección admin"
                  : `${seasonMvp.votes} MVPs de jornada`
                : "Pendiente"
            }
          />
        </div>
      </AppCard>
    </section>
  )
}
