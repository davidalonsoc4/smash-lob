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
  activateLeague: (leagueId: string) => boolean
  activateGrantedLeague: (leagueId: string) => void
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
  const [grantedLeagueId, setGrantedLeagueId] = useState<string | null>(null)
  const effectiveActiveLeagueId = grantedLeagueId
    ? grantedLeagueId
    : canAccessLeague(activeLeagueId)
      ? activeLeagueId
      : isAccessHydrated
        ? userLeagues[0]?.id ?? activeLeagueId
        : activeLeagueId

  useEffect(() => {
    // Creation and invite flows have already been confirmed by Supabase, but
    // React may still be applying the new league/membership state. Do not let
    // the normal fallback logic overwrite that freshly selected league.
    if (grantedLeagueId) {
      if (canAccessLeague(grantedLeagueId)) {
        const clearGrantedTimer = window.setTimeout(() => {
          setGrantedLeagueId(null)
        }, 0)

        return () => window.clearTimeout(clearGrantedTimer)
      }

      return
    }

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
  }, [canAccessLeague, grantedLeagueId, isAccessHydrated, userLeagues])

  const persistActiveLeague = useCallback((leagueId: string) => {
    if (!leagueId) {
      return
    }

    setActiveLeagueIdState(leagueId)
    window.localStorage.setItem(storageKey, leagueId)
  }, [])

  const activateLeague = useCallback(
    (leagueId: string) => {
      if (!canAccessLeague(leagueId)) {
        return false
      }

      setGrantedLeagueId(null)
      persistActiveLeague(leagueId)

      return true
    },
    [canAccessLeague, persistActiveLeague],
  )

  // Creation and invite flows call this only after Supabase has confirmed the
  // new access. It deliberately avoids the current render's access snapshot,
  // which can still be one render behind immediately after creating or
  // claiming a membership.
  const activateGrantedLeague = useCallback(
    (leagueId: string) => {
      if (!leagueId) {
        return
      }

      setGrantedLeagueId(leagueId)
      persistActiveLeague(leagueId)
    },
    [persistActiveLeague],
  )

  const openLeague = useCallback(
    (leagueId: string) => {
      if (!activateLeague(leagueId)) {
        return
      }

      // All accessible leagues are already hydrated in the client contexts.
      // Navigating client-side avoids repeating auth and the full Supabase snapshot.
      if (pathname !== "/") {
        router.push("/")
      } else {
        window.scrollTo({ top: 0, behavior: "auto" })
      }
    },
    [activateLeague, pathname, router],
  )

  const changeActiveLeague = useCallback(
    (leagueId: string) => {
      openLeague(leagueId)
    },
    [openLeague],
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
      activateLeague,
      activateGrantedLeague,
      changeActiveLeague,
      setActiveLeagueId,
    }),
    [
      activateGrantedLeague,
      activateLeague,
      changeActiveLeague,
      effectiveActiveLeagueId,
      setActiveLeagueId,
    ],
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
