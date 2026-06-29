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
}

export function MatchScoreboard({
  teamA,
  teamB,
  players,
  pointsA,
  pointsB,
  sets,
}: MatchScoreboardProps) {
  const { t } = useI18n()
  const isFinished = pointsA !== null && pointsB !== null

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">
              {t.matchDetail.teamA}
            </p>
            <TeamPlayers playerIds={teamA} players={players} />
          </div>

          {isFinished ? (
            <p className="text-4xl font-black">{pointsA}</p>
          ) : null}
        </div>

        <div className="border-t border-neutral-200" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">
              {t.matchDetail.teamB}
            </p>
            <TeamPlayers playerIds={teamB} players={players} />
          </div>

          {isFinished ? (
            <p className="text-4xl font-black">{pointsB}</p>
          ) : null}
        </div>
      </div>

      {sets.length > 0 ? (
        <div className="mt-5 flex gap-2">
          {sets.map((set, index) => (
            <div
              key={index}
              className="flex-1 rounded-2xl bg-neutral-100 p-3 text-center"
            >
              <p className="text-xs font-semibold text-neutral-500">
                {t.matchDetail.set} {index + 1}
              </p>

              <p className="mt-1 text-lg font-black">
                {set.a}-{set.b}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
