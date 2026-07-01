"use client"

import Link from "next/link"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
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

function getPositionLabel(index: number) {
  return `${index + 1}`
}

export function RankingTable({ players }: RankingTableProps) {
  const { t } = useI18n()

  const sortedPlayers = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
    return b.gamesFor - a.gamesFor
  })

  return (
    <section className="space-y-2">
      <AppCard className="overflow-hidden p-0">
        <div className="grid grid-cols-[minmax(0,1fr)_2.4rem_2.8rem_3rem] items-center gap-1 border-b border-stone-100 bg-stone-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.11em] text-stone-400">
          <span>Jugador</span>
          <span className="text-right">Pts</span>
          <span className="text-right">Dif</span>
          <span className="text-right">J</span>
        </div>

        <div className="divide-y divide-stone-100">
          {sortedPlayers.map((player, index) => (
            <Link
              key={player.id}
              href={`/player/${player.slug}`}
              aria-label={`${index + 1}º ${player.displayName}, ${player.points} ${t.common.pointsShort}`}
              className="grid grid-cols-[minmax(0,1fr)_2.4rem_2.8rem_3rem] items-center gap-1 px-3 py-2 transition hover:bg-stone-50 active:bg-stone-100"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                    index === 0
                      ? "bg-stone-950 text-white"
                      : index < 3
                        ? "bg-stone-100 text-stone-950"
                        : "bg-white text-stone-400"
                  }`}
                >
                  {getPositionLabel(index)}
                </span>

                <PlayerAvatar player={player} size="sm" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-black leading-tight text-stone-950">
                    {player.displayName}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-stone-400">
                    {player.gamesFor} favor · {player.gamesAgainst} contra
                  </p>
                </div>
              </div>

              <p className="text-right text-base font-black leading-none text-stone-950">
                {player.points}
              </p>

              <p className="text-right text-sm font-black text-stone-800">
                {formatSigned(player.gamesDiff)}
              </p>

              <p className="text-right text-[11px] font-bold leading-tight text-stone-500">
                {player.gamesFor}-{player.gamesAgainst}
              </p>
            </Link>
          ))}
        </div>
      </AppCard>

      <p className="px-1 text-[11px] font-semibold text-stone-400">
        Pts = sets ganados · Dif = diferencia de juegos · J = juegos a favor-contra
      </p>
    </section>
  )
}
