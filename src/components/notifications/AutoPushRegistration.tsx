"use client"

import { useEffect, useRef } from "react"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { ensurePushSubscriptionForLeague } from "@/lib/pushClient"

export function AutoPushRegistration() {
  const { activeLeagueId } = useActiveLeague()
  const { canAccessLeague, getMembershipForLeague } = useLeagueAccess()
  const membership = getMembershipForLeague(activeLeagueId)
  const playerId = membership?.playerId ?? null
  const lastSyncedKeyRef = useRef<string | null>(null)

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
  }, [activeLeagueId, canAccessLeague, playerId])

  return null
}
