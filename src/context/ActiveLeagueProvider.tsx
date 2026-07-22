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
  isLeagueTransitioning: boolean
  transitioningLeagueId: string | null
  activateLeague: (leagueId: string) => boolean
  activateGrantedLeague: (leagueId: string, destinationPath?: string) => void
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
  const [transitioningLeagueId, setTransitioningLeagueId] = useState<string | null>(null)
  const [transitionDestinationPath, setTransitionDestinationPath] = useState("/")
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


  useEffect(() => {
    if (!transitioningLeagueId || pathname !== transitionDestinationPath) {
      return
    }

    const targetIsReady =
      effectiveActiveLeagueId === transitioningLeagueId &&
      canAccessLeague(transitioningLeagueId) &&
      userLeagues.some((league) => league.id === transitioningLeagueId)

    if (!targetIsReady) {
      return
    }

    // Keep the transition screen visible until the destination route has
    // committed at least one paint with the newly selected league. Invitations
    // finish on HOME, while newly created leagues finish in the initial season
    // creator. This prevents stale content from the previous league flashing.
    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setTransitioningLeagueId(null)
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) {
        window.cancelAnimationFrame(secondFrame)
      }
    }
  }, [
    canAccessLeague,
    effectiveActiveLeagueId,
    pathname,
    transitioningLeagueId,
    transitionDestinationPath,
    userLeagues,
  ])

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
    (leagueId: string, destinationPath = "/") => {
      if (!leagueId) {
        return
      }

      setTransitionDestinationPath(destinationPath)
      setTransitioningLeagueId(leagueId)
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
      isLeagueTransitioning: Boolean(transitioningLeagueId),
      transitioningLeagueId,
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
      transitioningLeagueId,
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
