"use client"

import { MatchTeamsPanel } from "@/components/matches/MatchTeamsPanel"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import type { MatchSubstitution } from "@/lib/substitutes"
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
  const isFinished = pointsA !== null && pointsB !== null

  return (
    <AppCard className="!p-2.5">
      <MatchTeamsPanel
        teamA={teamA}
        teamB={teamB}
        players={players}
        substitutions={substitutions}
        highlightedPlayerIds={highlightedPlayerIds}
        mode={isFinished ? "rows" : "versus"}
        teamATrailing={
          isFinished ? <p className="shrink-0 self-center text-xl font-black">{pointsA}</p> : null
        }
        teamBTrailing={
          isFinished ? <p className="shrink-0 self-center text-xl font-black">{pointsB}</p> : null
        }
        linkPlayers
      />

      {sets.length > 0 ? (
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {sets.map((set, index) => (
            <div key={index} className="rounded-lg bg-neutral-100 px-2 py-1 text-center">
              <p className="type-caption font-black uppercase text-neutral-500">
                {t.matchDetail.set} {index + 1}
              </p>
              <p className="text-sm font-black">{set.a}-{set.b}</p>
            </div>
          ))}
        </div>
      ) : null}
    </AppCard>
  )
}
