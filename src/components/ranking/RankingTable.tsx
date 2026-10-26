"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import { getRankingDisplayPosition, sortRankingRows } from "@/lib/rankingOrder"

type RankingPlayer = {
  members?: { id: string; slug: string; displayName: string }[]
  id: string
  slug: string
  displayName: string
  points: number
  gamesDiff: number
  gamesFor: number
  matchesPlayed: number
  avatarInitials?: string | null
  avatarUrl?: string | null
  seasonPlayerStatus?: "active" | "withdrawn"
  joinedFromRound?: number | null
  replacedFromRound?: number | null
}

type RankingTableProps = {
  players: RankingPlayer[]
  paired?: boolean
  showAvatars?: boolean
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

function getPositionLabel(position: number | null) {
  return `${position}º`
}

function RankingRow({ paired, href, children, className, label, position }: { paired: boolean; href: string; children: ReactNode; className: string; label: string; position: number | null }) {
  return paired ? <div className={className} aria-label={label} data-ranking-position={position}>{children}</div> : <Link href={href} className={className} aria-label={label} data-ranking-position={position}>{children}</Link>
}

export function RankingTable({ players, showAvatars = true, paired = false }: RankingTableProps) {
  const { tx } = useI18n()
  const { t } = useI18n()

  const sortedPlayers = sortRankingRows(players)

  return (
    <AppCard accentStrip className="app-ranking-list overflow-hidden !p-0">
      <div className="grid grid-cols-[minmax(0,1fr)_1.4rem_2rem_2rem] items-center gap-1 border-b border-neutral-100 px-3 py-2.5 type-caption font-black uppercase tracking-[0.12em] text-neutral-600">
        <div className="flex min-w-0 items-center gap-3">
          <span className="w-7 shrink-0 text-center">{tx("POS")}</span>
          <span>{paired ? tx("Pareja") : tx("Jugador")}</span>
        </div>
        <span className="text-right">{tx("J")}</span>
        <span className="text-right">{tx("Dif")}</span>
        <span className="text-right">{tx("PTS")}</span>
      </div>

      <div>
        {sortedPlayers.map((player) => (
          <RankingRow
            key={player.id}
            paired={paired}
            href={`/player/${player.slug}`}
            position={getRankingDisplayPosition(sortedPlayers, player.id)}
            label={`${getPositionLabel(getRankingDisplayPosition(sortedPlayers, player.id))} ${player.displayName}, ${player.points} ${t.common.pointsShort}`}
            className="app-ranking-row grid grid-cols-[minmax(0,1fr)_1.4rem_2rem_2rem] items-center gap-1 px-3 py-2 transition active:bg-neutral-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="app-ranking-position w-7 shrink-0 text-center text-sm font-black tabular-nums text-neutral-700"
                aria-hidden="true"
              >
                {getRankingDisplayPosition(sortedPlayers, player.id)}
              </span>

              {showAvatars && !paired ? <PlayerAvatar player={player} size="sm" /> : null}

              <div className="min-w-0">
                <p className="min-w-0 type-player-name leading-tight text-neutral-950 truncate whitespace-nowrap">
                  {paired && player.members ? player.members.map(member => <Link href={`/player/${member.slug}`} className="block truncate active:underline" key={member.id}>{member.displayName}</Link>) : player.displayName}
                </p>
                {player.seasonPlayerStatus === "withdrawn" ? (
                  <span className="mt-0.5 inline-flex rounded-full bg-red-50 px-1.5 py-0.5 type-caption font-black uppercase tracking-wide text-red-700">
                    {tx("Baja")}{player.replacedFromRound ? ` ${tx("desde J")}${player.replacedFromRound}` : ""}
                  </span>
                ) : player.joinedFromRound && player.joinedFromRound > 1 ? (
                  <span className="mt-0.5 inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 type-caption font-black uppercase tracking-wide text-amber-700">
                    {tx("Desde J")}{player.joinedFromRound}
                  </span>
                ) : null}
              </div>
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
          </RankingRow>
        ))}
      </div>

      <p className="border-t border-neutral-100 px-3 py-2.5 type-caption font-semibold text-neutral-600">
        {tx("J = jornadas jugadas · Dif = diferencia de juegos · PTS = sets ganados")}{" "}</p>
    </AppCard>
  )
}
