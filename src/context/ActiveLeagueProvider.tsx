"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { activeLeagueId as defaultActiveLeagueId } from "@/data/fakeData"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"

type ActiveLeagueContextValue = {
  activeLeagueId: string
  changeActiveLeague: (leagueId: string) => void
  setActiveLeagueId: (leagueId: string) => void
}

type ActiveLeagueProviderProps = {
  children: ReactNode
}

const ActiveLeagueContext = createContext<ActiveLeagueContextValue | null>(null)

const storageKey = "smash-lob-active-league"

function forceHomeReload() {
  window.setTimeout(() => {
    if (window.location.pathname === "/") {
      window.location.reload()
      return
    }

    window.location.assign("/")
  }, 0)
}

export function ActiveLeagueProvider({ children }: ActiveLeagueProviderProps) {
  const { userLeagues, canAccessLeague } = useLeagueAccess()
  const [activeLeagueId, setActiveLeagueIdState] =
    useState(defaultActiveLeagueId)
  const effectiveActiveLeagueId = canAccessLeague(activeLeagueId)
    ? activeLeagueId
    : userLeagues[0]?.id ?? activeLeagueId

  useEffect(() => {
    const storedLeagueId = window.localStorage.getItem(storageKey)

    if (
      storedLeagueId &&
      canAccessLeague(storedLeagueId)
    ) {
      window.setTimeout(() => {
        setActiveLeagueIdState(storedLeagueId)
      }, 0)
      return
    }

    const firstLeagueId = userLeagues[0]?.id

    if (firstLeagueId) {
      window.setTimeout(() => {
        setActiveLeagueIdState(firstLeagueId)
        window.localStorage.setItem(storageKey, firstLeagueId)
      }, 0)
    }
  }, [canAccessLeague, userLeagues])

  const changeActiveLeague = useCallback((leagueId: string) => {
    if (!canAccessLeague(leagueId)) {
      return
    }

    if (leagueId === effectiveActiveLeagueId) {
      forceHomeReload()
      return
    }

    setActiveLeagueIdState(leagueId)
    window.localStorage.setItem(storageKey, leagueId)
    forceHomeReload()
  }, [canAccessLeague, effectiveActiveLeagueId])

  const setActiveLeagueId = useCallback((leagueId: string) => {
    setActiveLeagueIdState(leagueId)
    window.localStorage.setItem(storageKey, leagueId)
    forceHomeReload()
  }, [])

  const value = useMemo(
    () => ({
      activeLeagueId: effectiveActiveLeagueId,
      changeActiveLeague,
      setActiveLeagueId,
    }),
    [changeActiveLeague, effectiveActiveLeagueId, setActiveLeagueId]
  )

  return (
    <ActiveLeagueContext.Provider value={value}>
      {children}
    </ActiveLeagueContext.Provider>
  )
}

export function useActiveLeague() {
  const context = useContext(ActiveLeagueContext)

  if (!context) {
    throw new Error("useActiveLeague must be used inside ActiveLeagueProvider")
  }

  return context
}
