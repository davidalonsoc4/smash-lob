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
  if (index === 0) return "1º"
  if (index === 1) return "2º"
  if (index === 2) return "3º"
  return `${index + 1}º`
}

function getMedalClass(index: number) {
  if (index === 0) return "bg-neutral-950 text-white"
  if (index === 1) return "bg-neutral-200 text-neutral-950"
  if (index === 2) return "bg-neutral-100 text-neutral-900"
  return "bg-white text-neutral-500"
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
        <div className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_2.7rem] items-center gap-1 border-b border-neutral-100 bg-neutral-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-neutral-400">
          <span>Jugador</span>
          <span className="text-right">Pts</span>
          <span className="text-right">Dif</span>
          <span className="text-right">Juegos</span>
        </div>

        <div className="divide-y divide-neutral-100">
          {sortedPlayers.map((player, index) => (
            <Link
              key={player.id}
              href={`/player/${player.slug}`}
              aria-label={`${getPositionLabel(index)} ${player.displayName}, ${player.points} ${t.common.pointsShort}`}
              className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_2.7rem] items-center gap-1 px-3 py-2.5 transition active:bg-neutral-50"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-[11px] font-black ${getMedalClass(index)}`}
                >
                  {getPositionLabel(index)}
                </div>

                <PlayerAvatar player={player} size="sm" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-black leading-tight text-neutral-950">
                    {player.displayName}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                    {player.gamesFor} favor · {player.gamesAgainst} contra
                  </p>
                </div>
              </div>

              <p className="text-right text-lg font-black leading-none text-neutral-950">
                {player.points}
              </p>

              <p className="text-right text-sm font-black text-neutral-800">
                {formatSigned(player.gamesDiff)}
              </p>

              <p className="text-right text-[11px] font-bold leading-tight text-neutral-500">
                {player.gamesFor}-{player.gamesAgainst}
              </p>
            </Link>
          ))}
        </div>
      </AppCard>

      <p className="px-1 text-[11px] font-semibold text-neutral-400">
        Pts = sets ganados · Dif = diferencia de juegos · Juegos = a favor-en contra
      </p>
    </section>
  )
}
