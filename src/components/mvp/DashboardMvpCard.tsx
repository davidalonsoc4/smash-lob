"use client"

import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import {
  getCompletedRoundNumbers,
  getPlayersByIds,
  getRoundMvpSelection,
  getSeasonMvpSelection,
  type MvpMatch,
  type MvpPlayer,
  type MvpSystem,
  type MvpVote,
} from "@/lib/mvp"

type DashboardMvpCardProps = {
  leagueId: string
  seasonId: string
  isSeasonClosed: boolean
  canManage: boolean
  players: MvpPlayer[]
  matches: MvpMatch[]
  votes: MvpVote[]
  mvpSystem: MvpSystem
}

function formatSignedDiff(value: number) {
  return `${value > 0 ? "+" : ""}${value} Dif.`
}

function formatPlayerNames(players: MvpPlayer[]) {
  return players.map((player) => player.displayName).join(" / ")
}

export function DashboardMvpCard({
  leagueId,
  seasonId,
  isSeasonClosed,
  canManage,
  players,
  matches,
  votes,
  mvpSystem,
}: DashboardMvpCardProps) {
  const completedRounds = getCompletedRoundNumbers(matches, leagueId, seasonId)
  const latestRoundWithMvp = [...completedRounds].reverse().find((round) =>
    Boolean(
      getRoundMvpSelection({
        votes,
        leagueId,
        seasonId,
        round,
        matches,
        mvpSystem,
      })
    )
  ) ?? null
  const latestRoundMvp = latestRoundWithMvp
    ? getRoundMvpSelection({
        votes,
        leagueId,
        seasonId,
        round: latestRoundWithMvp,
        matches,
        mvpSystem,
      })
    : null
  const seasonMvp = isSeasonClosed
    ? getSeasonMvpSelection({
        votes,
        leagueId,
        seasonId,
        matches,
        mvpSystem,
      })
    : null
  const latestRoundMvpPlayers = getPlayersByIds(
    players,
    latestRoundMvp?.playerIds ?? []
  )
  const seasonMvpPlayers = getPlayersByIds(players, seasonMvp?.playerIds ?? [])

  if (mvpSystem === "none" || (!latestRoundMvp && !seasonMvp)) {
    return null
  }

  return (
    <section>
      <AppCard className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-lg text-yellow-500">
              ★
            </div>

            {latestRoundMvp ? (
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
                  MVP última jornada
                </p>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <div className="flex -space-x-2">
                    {latestRoundMvpPlayers.slice(0, 2).map((player) => (
                      <PlayerAvatar
                        key={player.id}
                        player={player}
                        size="sm"
                        className="border-2 border-white"
                      />
                    ))}
                  </div>
                  <p className="truncate text-sm font-black text-neutral-950">
                    {formatPlayerNames(latestRoundMvpPlayers)}
                  </p>
                </div>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  Jornada {latestRoundWithMvp} · {mvpSystem === "voting"
                    ? `${latestRoundMvp.votes} votos${latestRoundMvp.tied ? " · empate" : ""}`
                    : formatSignedDiff(latestRoundMvp.gamesDiff ?? 0)}
                </p>
              </div>
            ) : seasonMvp ? (
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
                  MVP final
                </p>
                <p className="mt-1 truncate text-sm font-black text-neutral-950">
                  {formatPlayerNames(seasonMvpPlayers)}
                </p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  {seasonMvp.votes} MVPs de jornada{seasonMvp.tied ? " · empate" : ""}
                </p>
              </div>
            ) : null}
          </div>

          {canManage ? (
            <Link
              href="/admin/mvp"
              className="shrink-0 rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700"
            >
              Gestionar
            </Link>
          ) : null}
        </div>

        {isSeasonClosed && seasonMvp && latestRoundMvp ? (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
                MVP final
              </p>
              <p className="mt-1 truncate text-sm font-black text-neutral-950">
                {formatPlayerNames(seasonMvpPlayers)}
              </p>
            </div>
            <p className="shrink-0 text-xs font-semibold text-neutral-500">
              {seasonMvp.votes} jornadas{seasonMvp.tied ? " · empate" : ""}
            </p>
          </div>
        ) : null}
      </AppCard>
    </section>
  )
}
