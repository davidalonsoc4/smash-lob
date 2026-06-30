"use client"

import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import {
  getLatestCompletedRound,
  getPlayersByIds,
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
  players,
  helper,
}: {
  label: string
  players: MvpPlayer[]
  helper: string
}) {
  return (
    <div className="rounded-2xl bg-neutral-100 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </p>
      {players.length > 0 ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex -space-x-2">
            {players.slice(0, 3).map((player) => (
              <PlayerAvatar
                key={player.id}
                player={player}
                size="sm"
                className="border-2 border-neutral-100"
              />
            ))}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-neutral-950">
              {players.map((player) => player.displayName).join(" / ")}
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
  const latestCompletedRound = getLatestCompletedRound(matches, leagueId, seasonId)
  const latestRoundMvp = latestCompletedRound
    ? getRoundMvpSelection({
        leagueId,
        seasonId,
        round: latestCompletedRound,
        matches,
      })
    : null
  const seasonMvp = isSeasonClosed
    ? getSeasonMvpSelection({
        leagueId,
        seasonId,
        matches,
      })
    : null
  const latestRoundMvpPlayers = getPlayersByIds(
    players,
    latestRoundMvp?.playerIds ?? []
  )
  const seasonMvpPlayers = getPlayersByIds(players, seasonMvp?.playerIds ?? [])

  if (!latestRoundMvp && !seasonMvp) {
    return null
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight">MVP</h2>
          <p className="text-sm text-neutral-500">
            Último reconocimiento confirmado.
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
        <div className={`grid gap-3 ${isSeasonClosed && seasonMvp ? "grid-cols-2" : "grid-cols-1"}`}>
          <MvpCompactItem
            label="Última jornada"
            players={latestRoundMvpPlayers}
            helper={
              latestCompletedRound && latestRoundMvp
                ? `Jornada ${latestCompletedRound} · ${latestRoundMvp.gamesDiff ?? 0} dif.`
                : "Sin jornadas completas"
            }
          />

          {isSeasonClosed ? (
            <MvpCompactItem
              label="MVP final"
              players={seasonMvpPlayers}
              helper={
                seasonMvp
                  ? `${seasonMvp.votes} MVPs de jornada${seasonMvp.tied ? " · empate" : ""}`
                  : "Pendiente"
              }
            />
          ) : null}
        </div>
      </AppCard>
    </section>
  )
}
