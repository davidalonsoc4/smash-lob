"use client"

import { createContext, useContext, useMemo } from "react"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import type { PlayerProfile } from "@/data/fakeData"

type CurrentUserContextValue = {
  currentUserId: string
  currentUser: PlayerProfile
}

type CurrentUserProviderProps = {
  children: React.ReactNode
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)

export function CurrentUserProvider({ children }: CurrentUserProviderProps) {
  const { activeLeagueId } = useActiveLeague()
  const { getMembershipForLeague, isSuperuser } = useLeagueAccess()
  const { playerProfiles } = useSeasonSettings()
  const membership = getMembershipForLeague(activeLeagueId)
  const linkedPlayer = membership?.playerId
    ? playerProfiles.find((player) => player.id === membership.playerId)
    : null
  const superuserPlaceholder: PlayerProfile = {
    id: "__superuser__",
    leagueId: activeLeagueId,
    slug: "superusuario",
    displayName: "Superusuario",
    avatarInitials: "SU",
    avatarUrl: null,
    userId: null,
  }
  const currentUser =
    linkedPlayer ??
    (isSuperuser
      ? superuserPlaceholder
      : playerProfiles.find((player) => player.leagueId === activeLeagueId) ??
        playerProfiles[0])

  const value = useMemo(
    () => ({
      currentUserId: currentUser.id,
      currentUser,
    }),
    [currentUser]
  )

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext)

  if (!context) {
    throw new Error("useCurrentUser must be used inside CurrentUserProvider")
  }

  return context
}
