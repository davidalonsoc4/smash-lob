"use client"

import { TeamPlayers } from "@/components/player/TeamPlayers"
import { useI18n } from "@/i18n/I18nProvider"
import type { PlayerProfile } from "@/data/fakeData"

type MatchScoreboardProps = {
  teamA: string[]
  teamB: string[]
  players?: PlayerProfile[]
  pointsA: number | null
  pointsB: number | null
  sets: { a: number; b: number }[]
  highlightedPlayerIds?: string[]
}

export function MatchScoreboard({
  teamA,
  teamB,
  players,
  pointsA,
  pointsB,
  sets,
  highlightedPlayerIds = [],
}: MatchScoreboardProps) {
  const { t } = useI18n()
  const isFinished = pointsA !== null && pointsB !== null

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_1px_10px_rgba(15,23,42,0.05)]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-400">
              {t.matchDetail.teamA}
            </p>
            <TeamPlayers
              playerIds={teamA}
              players={players}
              highlightedPlayerIds={highlightedPlayerIds}
              className="mt-1 flex min-w-0 flex-wrap gap-x-1 gap-y-1 text-base font-black"
            />
          </div>

          {isFinished ? (
            <p className="text-3xl font-black leading-none">{pointsA}</p>
          ) : null}
        </div>

        <div className="border-t border-neutral-100" />

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-400">
              {t.matchDetail.teamB}
            </p>
            <TeamPlayers
              playerIds={teamB}
              players={players}
              highlightedPlayerIds={highlightedPlayerIds}
              className="mt-1 flex min-w-0 flex-wrap gap-x-1 gap-y-1 text-base font-black"
            />
          </div>

          {isFinished ? (
            <p className="text-3xl font-black leading-none">{pointsB}</p>
          ) : null}
        </div>
      </div>

      {sets.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {sets.map((set, index) => (
            <div
              key={index}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2 text-center"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-neutral-400">
                {t.matchDetail.set} {index + 1}
              </p>

              <p className="mt-0.5 text-base font-black">
                {set.a}-{set.b}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
