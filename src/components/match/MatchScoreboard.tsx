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
    <section className="rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-2.5 py-2">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              {t.matchDetail.teamA}
            </p>
            <TeamPlayers
              playerIds={teamA}
              players={players}
              highlightedPlayerIds={highlightedPlayerIds}
              className="mt-1 flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
            />
          </div>

          {isFinished ? (
            <p className="shrink-0 text-2xl font-black">{pointsA}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-2.5 py-2">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              {t.matchDetail.teamB}
            </p>
            <TeamPlayers
              playerIds={teamB}
              players={players}
              highlightedPlayerIds={highlightedPlayerIds}
              className="mt-1 flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
            />
          </div>

          {isFinished ? (
            <p className="shrink-0 text-2xl font-black">{pointsB}</p>
          ) : null}
        </div>
      </div>

      {sets.length > 0 ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {sets.map((set, index) => (
            <div
              key={index}
              className="rounded-lg bg-neutral-100 px-2 py-1.5 text-center"
            >
              <p className="text-[10px] font-black uppercase text-neutral-500">
                {t.matchDetail.set} {index + 1}
              </p>

              <p className="text-sm font-black">
                {set.a}-{set.b}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
