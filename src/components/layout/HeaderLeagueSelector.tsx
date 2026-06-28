"use client"

import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { leagues } from "@/data/fakeData"
import { useI18n } from "@/i18n/I18nProvider"

export function HeaderLeagueSelector() {
  const { t } = useI18n()
  const { activeLeagueId, changeActiveLeague } = useActiveLeague()

  const activeLeague =
    leagues.find((league) => league.id === activeLeagueId) ?? leagues[0]

  if (leagues.length <= 1) {
    return (
      <h1 className="truncate text-2xl font-black tracking-tight text-neutral-950">
        {activeLeague.name}
      </h1>
    )
  }

  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{t.appHeader.leagueSelectorLabel}</span>

      <select
        value={activeLeagueId}
        onChange={(event) => changeActiveLeague(event.target.value)}
        className="w-full appearance-none truncate bg-transparent py-1 pr-8 text-2xl font-black tracking-tight text-neutral-950 outline-none"
      >
        {leagues.map((league) => (
          <option key={league.id} value={league.id}>
            {league.name}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-sm font-black text-neutral-500">
        ▼
      </span>
    </label>
  )
}