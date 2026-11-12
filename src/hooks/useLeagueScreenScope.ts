import { useEffect, useState } from "react"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"

export function useLeagueScreenScope(leagueId: string) {
  const { getMembershipForLeague, getLeagueExperienceMode, isLeagueSpectator } = useLeagueAccess()
  const membership = getMembershipForLeague(leagueId)
  return JSON.stringify([leagueId, membership?.role, membership?.playerId, getLeagueExperienceMode(leagueId), isLeagueSpectator(leagueId)])
}

export function useLeagueScreenEntrance(screen: string, leagueId: string, ready = true) {
  const { leagueScreenData: { entrances } } = useAccountProfile()
  const key = JSON.stringify([screen, leagueId])
  const [first] = useState(() => entrances.has(key) ? null : key)
  useEffect(() => {
    if (ready) entrances.add(key)
  }, [entrances, key, ready])
  return ready && first === key
}
