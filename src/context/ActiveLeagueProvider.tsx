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
import { usePathname, useRouter } from "next/navigation"
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

export function ActiveLeagueProvider({ children }: ActiveLeagueProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { userLeagues, canAccessLeague, isAccessHydrated } = useLeagueAccess()
  const [activeLeagueId, setActiveLeagueIdState] =
    useState(defaultActiveLeagueId)
  const effectiveActiveLeagueId = canAccessLeague(activeLeagueId)
    ? activeLeagueId
    : isAccessHydrated
      ? userLeagues[0]?.id ?? activeLeagueId
      : activeLeagueId

  useEffect(() => {
    const storedLeagueId = window.localStorage.getItem(storageKey)

    // A cached player or spectator access is enough to restore the last league
    // immediately. Full Supabase hydration continues in the background.
    if (storedLeagueId && canAccessLeague(storedLeagueId)) {
      const restoreTimer = window.setTimeout(() => {
        setActiveLeagueIdState((currentLeagueId) =>
          currentLeagueId === storedLeagueId ? currentLeagueId : storedLeagueId,
        )
      }, 0)

      return () => window.clearTimeout(restoreTimer)
    }

    if (!isAccessHydrated) {
      return
    }

    const firstLeagueId = userLeagues[0]?.id

    if (firstLeagueId) {
      const fallbackTimer = window.setTimeout(() => {
        setActiveLeagueIdState((currentLeagueId) =>
          currentLeagueId === firstLeagueId ? currentLeagueId : firstLeagueId,
        )
        window.localStorage.setItem(storageKey, firstLeagueId)
      }, 0)

      return () => window.clearTimeout(fallbackTimer)
    }
  }, [canAccessLeague, isAccessHydrated, userLeagues])

  const openLeague = useCallback(
    (leagueId: string) => {
      setActiveLeagueIdState(leagueId)
      window.localStorage.setItem(storageKey, leagueId)

      // All accessible leagues are already hydrated in the client contexts.
      // Navigating client-side avoids repeating auth and the full Supabase snapshot.
      if (pathname !== "/") {
        router.push("/")
      } else {
        window.scrollTo({ top: 0, behavior: "auto" })
      }
    },
    [pathname, router],
  )

  const changeActiveLeague = useCallback(
    (leagueId: string) => {
      if (!canAccessLeague(leagueId)) {
        return
      }

      openLeague(leagueId)
    },
    [canAccessLeague, openLeague],
  )

  const setActiveLeagueId = useCallback(
    (leagueId: string) => {
      openLeague(leagueId)
    },
    [openLeague],
  )

  const value = useMemo(
    () => ({
      activeLeagueId: effectiveActiveLeagueId,
      changeActiveLeague,
      setActiveLeagueId,
    }),
    [changeActiveLeague, effectiveActiveLeagueId, setActiveLeagueId],
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
