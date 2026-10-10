import { useEffect, useSyncExternalStore } from "react"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { readSelectedSeasonId, subscribeSeasonSelection, writeSelectedSeasonId } from "@/lib/seasonSelection"
import { useMatchData } from "@/context/MatchDataProvider"

/** Resolve an already-authorized deep link without looking up arbitrary leagues. */
export function useMatchLeagueContext(matchId: string) {
  const { matches } = useMatchData()
  const { activeLeagueId, activateLeague } = useActiveLeague()
  const { canAccessLeague, isAccessHydrated } = useLeagueAccess()
  const match = matches.find((match) => match.id === matchId)
  const leagueId = match?.leagueId
  const seasonId = match?.seasonId
  const selectedSeasonId = useSyncExternalStore(subscribeSeasonSelection, () => readSelectedSeasonId(leagueId ?? ""), () => null)
  const shouldSelectSeason = Boolean(leagueId && seasonId && canAccessLeague(leagueId) && selectedSeasonId !== seasonId)
  const shouldSwitch = Boolean(leagueId && leagueId !== activeLeagueId && canAccessLeague(leagueId))

  useEffect(() => {
    if (!leagueId || !isAccessHydrated || (!shouldSwitch && !shouldSelectSeason)) return
    const timer = window.setTimeout(() => {
      if (shouldSwitch) activateLeague(leagueId)
      if (shouldSelectSeason && seasonId) writeSelectedSeasonId(leagueId, seasonId)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [activateLeague, isAccessHydrated, leagueId, seasonId, shouldSelectSeason, shouldSwitch])

  return !isAccessHydrated || shouldSwitch || shouldSelectSeason
}
