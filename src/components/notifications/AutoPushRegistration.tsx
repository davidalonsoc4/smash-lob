"use client"

import { useEffect, useRef, useState } from "react"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import {
  ensurePushSubscriptionForLeague,
  hasPushAutoPermissionBeenPrompted,
} from "@/lib/pushClient"

export function AutoPushRegistration() {
  const { activeLeagueId } = useActiveLeague()
  const { canAccessLeague, getMembershipForLeague } = useLeagueAccess()
  const membership = getMembershipForLeague(activeLeagueId)
  const playerId = membership?.playerId ?? null
  const lastSyncedKeyRef = useRef<string | null>(null)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!canAccessLeague(activeLeagueId)) {
      return
    }

    const syncKey = `${activeLeagueId}:${playerId ?? "no-player"}`

    if (lastSyncedKeyRef.current === syncKey) {
      return
    }

    lastSyncedKeyRef.current = syncKey

    let isCancelled = false

    async function syncPushSubscription() {
      const result = await ensurePushSubscriptionForLeague({
        leagueId: activeLeagueId,
        playerId,
        requestPermissionIfNeeded: !hasPushAutoPermissionBeenPrompted(),
      })

      if (isCancelled || result.ok) {
        return
      }

      lastSyncedKeyRef.current = null
    }

    syncPushSubscription()

    return () => {
      isCancelled = true
    }
  }, [activeLeagueId, canAccessLeague, playerId, retryTick])

  useEffect(() => {
    function scheduleRetry() {
      if (document.visibilityState === "visible") {
        setRetryTick((currentTick) => currentTick + 1)
      }
    }

    window.addEventListener("focus", scheduleRetry)
    window.addEventListener("pageshow", scheduleRetry)
    document.addEventListener("visibilitychange", scheduleRetry)

    return () => {
      window.removeEventListener("focus", scheduleRetry)
      window.removeEventListener("pageshow", scheduleRetry)
      document.removeEventListener("visibilitychange", scheduleRetry)
    }
  }, [])

  return null
}
