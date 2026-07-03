"use client"

import { useI18n } from "@/i18n/I18nProvider"
import { MatchCard } from "./MatchCard"

type RoundSectionProps = {
  round: number
  matches: {
    id: string
    round: number
    status: string
    teamA: string[]
    teamB: string[]
    pointsA: number | null
    pointsB: number | null
    sets: { a: number; b: number }[]
    scheduledAt?: string | null
    resultRecordedAt?: string | null
    dateLabel: string | null
    location: string | null
  }[]
}

export function RoundSection({ round, matches }: RoundSectionProps) {
  const { t } = useI18n()

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black">
        {t.matches.round} {round}
      </h2>

      <div className="space-y-3">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            roundStartsAt={null}
            roundEndsAt={null}
          />
        ))}
      </div>
    </section>
  )
}
