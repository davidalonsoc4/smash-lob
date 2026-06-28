"use client"

import { StatCard } from "@/components/ui/StatCard"
import { useI18n } from "@/i18n/I18nProvider"

type MatchStatsGridProps = {
  pointsA: number | null
  pointsB: number | null
  sets: { a: number; b: number }[]
}

export function MatchStatsGrid({
  pointsA,
  pointsB,
  sets,
}: MatchStatsGridProps) {
  const { t } = useI18n()

  if (pointsA === null || pointsB === null) return null

  const gamesA = sets.reduce((total, set) => total + set.a, 0)
  const gamesB = sets.reduce((total, set) => total + set.b, 0)
  const diffA = gamesA - gamesB

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label={t.matchDetail.gamesA}
        value={gamesA}
        helper={`${diffA > 0 ? "+" : ""}${diffA} ${t.ranking.diff.toLowerCase()}`}
      />

      <StatCard
        label={t.matchDetail.gamesB}
        value={gamesB}
        helper={`${-diffA > 0 ? "+" : ""}${-diffA} ${t.ranking.diff.toLowerCase()}`}
      />

      <StatCard label={t.matchDetail.pointsA} value={pointsA} />
      <StatCard label={t.matchDetail.pointsB} value={pointsB} />
    </div>
  )
}