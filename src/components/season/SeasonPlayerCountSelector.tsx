"use client"

import { useI18n } from "@/i18n/I18nProvider"
import {
  getSeasonByeCountPerRound,
  MAX_SEASON_PLAYER_COUNT,
  MIN_SEASON_PLAYER_COUNT,
  supportsPerfectlyBalancedSeason,
} from "@/lib/seasonPlayerCount"

type SeasonPlayerCountSelectorProps = {
  playerCount: number
  onChange: (playerCount: number) => void
}

export function SeasonPlayerCountSelector({
  playerCount,
  onChange,
}: SeasonPlayerCountSelectorProps) {
  const { t } = useI18n()
  const isPerfectlyBalanced = supportsPerfectlyBalancedSeason(playerCount)
  const byeCount = getSeasonByeCountPerRound(playerCount)

  return (
    <div>
      <p className="text-sm font-semibold text-neutral-700">{t.adminSeason.playerCount}</p>
      <div className="mt-2 grid grid-cols-[48px_1fr_48px] items-stretch gap-2">
        <button type="button" aria-label={t.adminSeason.decreasePlayerCount} onClick={() => onChange(playerCount - 1)} disabled={playerCount <= MIN_SEASON_PLAYER_COUNT} className="rounded-2xl bg-neutral-100 text-xl font-black text-neutral-800 disabled:cursor-not-allowed disabled:opacity-35">
          −
        </button>
        <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-center">
          <p className="text-xl font-black text-neutral-950">{playerCount}</p>
          <p className="type-caption font-bold uppercase tracking-wide text-neutral-500">{t.adminSeason.playersShortLabel}</p>
        </div>
        <button type="button" aria-label={t.adminSeason.increasePlayerCount} onClick={() => onChange(playerCount + 1)} disabled={playerCount >= MAX_SEASON_PLAYER_COUNT} className="rounded-2xl bg-neutral-100 text-xl font-black text-neutral-800 disabled:cursor-not-allowed disabled:opacity-35">
          +
        </button>
      </div>
      <p className="mt-2 text-xs font-semibold text-neutral-500">{t.adminSeason.playerCountRangeDescription}</p>
      <p className={`mt-2 rounded-2xl px-3 py-2.5 text-xs font-semibold leading-5 ${isPerfectlyBalanced ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
        {isPerfectlyBalanced
          ? t.adminSeason.playerCountBalancedDescription
          : t.adminSeason.playerCountRequiresByesDescription.replace("{count}", String(byeCount))}
      </p>
    </div>
  )
}
