"use client"

import {
  useCallback,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react"
import { currentUserId, playerProfiles } from "@/data/fakeData"

type CurrentUserContextValue = {
  currentUserId: string
  currentUser: (typeof playerProfiles)[number]
  setCurrentUserId: (playerId: string) => void
}

type CurrentUserProviderProps = {
  children: React.ReactNode
}

const storageKey = "smash-lob-current-user"
const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)

function getValidUserId(playerId: string | null) {
  const userExists = playerProfiles.some((player) => player.id === playerId)

  return userExists && playerId ? playerId : currentUserId
}

export function CurrentUserProvider({ children }: CurrentUserProviderProps) {
  const [selectedUserId, setSelectedUserId] = useState(() => {
    if (typeof window === "undefined") {
      return currentUserId
    }

    const urlUserId = new URLSearchParams(window.location.search).get(
      "testUser"
    )
    const validUrlUserId = getValidUserId(urlUserId)

    if (urlUserId) {
      window.localStorage.setItem(storageKey, validUrlUserId)
      return validUrlUserId
    }

    return getValidUserId(window.localStorage.getItem(storageKey))
  })

  const setCurrentUserId = useCallback((playerId: string) => {
    const validUserId = getValidUserId(playerId)

    setSelectedUserId(validUserId)
    window.localStorage.setItem(storageKey, validUserId)
  }, [])

  const currentUser =
    playerProfiles.find((player) => player.id === selectedUserId) ??
    playerProfiles[0]

  const value = useMemo(
    () => ({
      currentUserId: currentUser.id,
      currentUser,
      setCurrentUserId,
    }),
    [currentUser, setCurrentUserId]
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
