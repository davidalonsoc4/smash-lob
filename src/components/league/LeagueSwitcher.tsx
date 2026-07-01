"use client"

import { useMemo } from "react"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import type { League } from "@/data/fakeData"

function getUniqueLeaguesById(leagues: League[]) {
  const uniqueLeagues = new Map<string, League>()

  leagues.forEach((league) => {
    if (!uniqueLeagues.has(league.id)) {
      uniqueLeagues.set(league.id, league)
    }
  })

  return Array.from(uniqueLeagues.values())
}

export function LeagueSwitcher() {
  const { t } = useI18n()
  const { activeLeagueId, setActiveLeagueId } = useActiveLeague()
  const { userLeagues } = useLeagueAccess()
  const selectableLeagues = useMemo(
    () => getUniqueLeaguesById(userLeagues),
    [userLeagues]
  )

  return (
    <div>
      <label
        htmlFor="league-switcher"
        className="mb-2 block text-sm font-semibold text-neutral-500"
      >
        {t.leagues.activeLeague}
      </label>

      <select
        id="league-switcher"
        value={activeLeagueId}
        onChange={(event) => setActiveLeagueId(event.target.value)}
        className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold text-neutral-900 shadow-sm"
      >
        {selectableLeagues.map((league) => (
          <option key={league.id} value={league.id}>
            {league.name}
          </option>
        ))}
      </select>
    </div>
  )
}
