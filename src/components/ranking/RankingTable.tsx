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
  gamesAgainst: number
  avatarInitials?: string | null
  avatarUrl?: string | null
}

type RankingTableProps = {
  players: RankingPlayer[]
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

export function RankingTable({ players }: RankingTableProps) {
  const { t } = useI18n()

  const sortedPlayers = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
    return b.gamesFor - a.gamesFor
  })

  return (
    <div className="space-y-2">
      {sortedPlayers.map((player, index) => (
        <Link
          key={player.id}
          href={`/player/${player.slug}`}
          className="block rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-black">
              {index + 1}
            </div>

            <PlayerAvatar player={player} size="sm" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{player.displayName}</p>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-neutral-500">
                {formatSigned(player.gamesDiff)} {t.ranking.diff} · {player.gamesFor} {t.ranking.gamesFor} · {player.gamesAgainst} {t.ranking.gamesAgainst}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xl font-black leading-none">{player.points}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-neutral-500">
                {t.common.pointsShort}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
