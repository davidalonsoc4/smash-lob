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

export function RankingTable({ players }: RankingTableProps) {
  const { t } = useI18n()

  const sortedPlayers = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
    return b.gamesFor - a.gamesFor
  })

  return (
    <div className="space-y-3">
      {sortedPlayers.map((player, index) => (
        <Link
          key={player.id}
          href={`/player/${player.slug}`}
          className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-black">
                {index + 1}
              </div>

              <PlayerAvatar player={player} size="sm" />

              <div className="min-w-0">
                <p className="truncate font-bold">{player.displayName}</p>
                <p className="text-xs text-neutral-500">
                  {player.gamesFor} {t.ranking.forShort} ·{" "}
                  {player.gamesAgainst} {t.ranking.againstShort}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-black">{player.points}</p>
              <p className="text-xs text-neutral-500">
                {t.common.pointsShort}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-neutral-100 p-2">
              <p className="font-bold">
                {player.gamesDiff > 0 ? "+" : ""}
                {player.gamesDiff}
              </p>
              <p className="text-xs text-neutral-500">{t.ranking.diff}</p>
            </div>

            <div className="rounded-xl bg-neutral-100 p-2">
              <p className="font-bold">{player.gamesFor}</p>
              <p className="text-xs text-neutral-500">
                {t.ranking.gamesFor}
              </p>
            </div>

            <div className="rounded-xl bg-neutral-100 p-2">
              <p className="font-bold">{player.gamesAgainst}</p>
              <p className="text-xs text-neutral-500">
                {t.ranking.gamesAgainst}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}