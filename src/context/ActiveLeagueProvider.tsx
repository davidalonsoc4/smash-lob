"use client"

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  activeLeagueId as defaultActiveLeagueId,
  leagues,
} from "@/data/fakeData"

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

function isValidLeagueId(leagueId: string) {
  return leagues.some((league) => league.id === leagueId)
}

export function ActiveLeagueProvider({ children }: ActiveLeagueProviderProps) {
  const [activeLeagueId, setActiveLeagueIdState] =
    useState(defaultActiveLeagueId)

  useEffect(() => {
    const storedLeagueId = window.localStorage.getItem(storageKey)

    if (!storedLeagueId || !isValidLeagueId(storedLeagueId)) {
      return
    }

    window.setTimeout(() => {
      setActiveLeagueIdState(storedLeagueId)
    }, 0)
  }, [])

  function changeActiveLeague(leagueId: string) {
    if (!isValidLeagueId(leagueId)) {
      return
    }

    setActiveLeagueIdState(leagueId)
    window.localStorage.setItem(storageKey, leagueId)
  }

  const value = useMemo(
    () => ({
      activeLeagueId,
      changeActiveLeague,
      setActiveLeagueId: changeActiveLeague,
    }),
    [activeLeagueId]
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