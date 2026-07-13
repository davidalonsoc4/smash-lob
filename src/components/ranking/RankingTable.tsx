"use client"

import Link from "next/link"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useI18n } from "@/i18n/I18nProvider"

type RankingPlayer = {
  id: string
  slug: string
  displayName: string
  points: number
  gamesDiff: number
  gamesFor: number
  matchesPlayed: number
  avatarInitials?: string | null
  avatarUrl?: string | null
}

type RankingTableProps = {
  players: RankingPlayer[]
  showAvatars?: boolean
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

function getPositionLabel(index: number) {
  return `${index + 1}º`
}

export function RankingTable({ players, showAvatars = true }: RankingTableProps) {
  const { t } = useI18n()

  const sortedPlayers = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
    return b.gamesFor - a.gamesFor
  })

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_1.4rem_2rem_2rem] items-center gap-1 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-neutral-400">
        <span>Jugador</span>
        <span className="text-right">J</span>
        <span className="text-right">Dif</span>
        <span className="text-right">PTS</span>
      </div>

      <div className="space-y-1.5">
        {sortedPlayers.map((player, index) => (
          <Link
            key={player.id}
            href={`/player/${player.slug}`}
            aria-label={`${getPositionLabel(index)} ${player.displayName}, ${player.points} ${t.common.pointsShort}`}
            className="grid grid-cols-[minmax(0,1fr)_1.4rem_2rem_2rem] items-center gap-1 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm transition active:scale-[0.99]"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-black text-neutral-950"
                aria-hidden="true"
              >
                {index + 1}
              </div>

              {showAvatars ? <PlayerAvatar player={player} size="sm" /> : null}

              <p className="min-w-0 text-[13px] font-black leading-tight text-neutral-950 [overflow-wrap:anywhere]">
                {player.displayName}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-neutral-600">
                {player.matchesPlayed}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-black text-neutral-900">
                {formatSigned(player.gamesDiff)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-black leading-none text-neutral-950">
                {player.points}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <p className="px-1 text-[11px] font-semibold text-neutral-400">
        J = jornadas jugadas · Dif = diferencia de juegos · PTS = sets ganados
      </p>
    </div>
  )
}
