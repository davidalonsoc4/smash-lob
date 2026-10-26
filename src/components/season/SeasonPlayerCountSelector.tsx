"use client"

import { useI18n } from "@/i18n/I18nProvider"
import {
  getSeasonByeCountPerRound,
  MAX_SEASON_PLAYER_COUNT,
  MIN_SEASON_PLAYER_COUNT,
  supportsPerfectlyBalancedSeason,
} from "@/lib/seasonPlayerCount"

type SeasonPlayerCountSelectorProps = {
  modality?: "individual" | "fixed_pairs"
  playerCount: number
  onChange: (playerCount: number) => void
}

export function SeasonPlayerCountSelector({
  modality = "individual",
  playerCount,
  onChange,
}: SeasonPlayerCountSelectorProps) {
  const { tx } = useI18n()
  const step = modality === "fixed_pairs" ? 2 : 1
  const minimum = modality === "fixed_pairs" ? 4 : MIN_SEASON_PLAYER_COUNT
  const { t } = useI18n()
  const isPerfectlyBalanced = supportsPerfectlyBalancedSeason(playerCount)
  const byeCount = getSeasonByeCountPerRound(playerCount)

  return (
    <div>
      <p className="text-sm font-semibold text-neutral-700">{modality === "fixed_pairs" ? tx("Número de parejas") : t.adminSeason.playerCount}</p>
      <div className="mt-2 grid grid-cols-[48px_1fr_48px] items-stretch gap-2">
        <button type="button" aria-label={t.adminSeason.decreasePlayerCount} onClick={() => onChange(playerCount - step)} disabled={playerCount <= minimum} className="rounded-2xl bg-neutral-100 text-xl font-black text-neutral-800 disabled:cursor-not-allowed disabled:opacity-35">
          −
        </button>
        <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-center">
          <p className="text-xl font-black text-neutral-950">{modality === "fixed_pairs" ? playerCount / 2 : playerCount}</p>
          <p className="type-caption font-bold uppercase tracking-wide text-neutral-500">{modality === "fixed_pairs" ? tx("Parejas") : t.adminSeason.playersShortLabel}</p>
        </div>
        <button type="button" aria-label={t.adminSeason.increasePlayerCount} onClick={() => onChange(playerCount + step)} disabled={playerCount >= MAX_SEASON_PLAYER_COUNT} className="rounded-2xl bg-neutral-100 text-xl font-black text-neutral-800 disabled:cursor-not-allowed disabled:opacity-35">
          +
        </button>
      </div>
      <p className="mt-2 text-xs font-semibold text-neutral-500">{modality === "fixed_pairs" ? tx("De 2 a 16 parejas (4–32 jugadores).") : t.adminSeason.playerCountRangeDescription}</p>
      <p className={`mt-2 rounded-2xl px-3 py-2.5 text-xs font-semibold leading-5 ${isPerfectlyBalanced ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
        {modality === "fixed_pairs" ? tx("Cada pareja se enfrenta a las demás una vez por vuelta. Si hay un número impar de parejas, una descansa en cada jornada.") : isPerfectlyBalanced
          ? t.adminSeason.playerCountBalancedDescription
          : t.adminSeason.playerCountRequiresByesDescription.replace("{count}", String(byeCount))}
      </p>
    </div>
  )
}
