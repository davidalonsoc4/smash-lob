"use client"

import { TeamPlayers } from "@/components/player/TeamPlayers"
import { useI18n } from "@/i18n/I18nProvider"
import type { MatchSubstitution } from "@/lib/substitutes"
import { getMatchSubstituteLabels } from "@/lib/substitutes"
import type { PlayerProfile } from "@/data/fakeData"

type MatchScoreboardProps = {
  teamA: string[]
  teamB: string[]
  players?: PlayerProfile[]
  pointsA: number | null
  pointsB: number | null
  sets: { a: number; b: number }[]
  substitutions?: MatchSubstitution[]
  highlightedPlayerIds?: string[]
}

export function MatchScoreboard({
  teamA,
  teamB,
  players,
  pointsA,
  pointsB,
  sets,
  substitutions = [],
  highlightedPlayerIds = [],
}: MatchScoreboardProps) {
  const { t } = useI18n()
  const substituteLabels = getMatchSubstituteLabels({
    substitutions,
    players: players ?? [],
  })
  const isFinished = pointsA !== null && pointsB !== null

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-2.5 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
      {isFinished ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2.5 rounded-lg bg-neutral-50 px-2.5 py-1.5">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                {t.matchDetail.teamA}
              </p>
              <TeamPlayers
                playerIds={teamA}
                players={players}
                highlightedPlayerIds={highlightedPlayerIds}
                substituteLabels={substituteLabels}
                className="mt-0.5 flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
              />
            </div>

            <p className="shrink-0 text-xl font-black">{pointsA}</p>
          </div>

          <div className="flex items-center justify-between gap-2.5 rounded-lg bg-neutral-50 px-2.5 py-1.5">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                {t.matchDetail.teamB}
              </p>
              <TeamPlayers
                playerIds={teamB}
                players={players}
                highlightedPlayerIds={highlightedPlayerIds}
                substituteLabels={substituteLabels}
                className="mt-0.5 flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
              />
            </div>

            <p className="shrink-0 text-xl font-black">{pointsB}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] items-stretch gap-1.5">
          <div className="min-w-0 rounded-lg bg-neutral-50 px-2.5 py-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              {t.matchDetail.teamA}
            </p>
            <TeamPlayers
              playerIds={teamA}
              players={players}
              highlightedPlayerIds={highlightedPlayerIds}
              substituteLabels={substituteLabels}
              className="mt-1 flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
            />
          </div>

          <div className="flex items-center justify-center">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-black uppercase text-neutral-500">
              VS
            </span>
          </div>

          <div className="min-w-0 rounded-lg bg-neutral-50 px-2.5 py-2 text-right">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              {t.matchDetail.teamB}
            </p>
            <TeamPlayers
              playerIds={teamB}
              players={players}
              highlightedPlayerIds={highlightedPlayerIds}
              substituteLabels={substituteLabels}
              className="mt-1 flex min-w-0 flex-wrap justify-end gap-x-1 gap-y-0.5 text-sm font-black"
            />
          </div>
        </div>
      )}

      {sets.length > 0 ? (
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {sets.map((set, index) => (
            <div
              key={index}
              className="rounded-lg bg-neutral-100 px-2 py-1 text-center"
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
