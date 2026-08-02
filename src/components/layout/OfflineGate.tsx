"use client"

import { useEffect, useState, type ReactNode } from "react"
import { OfflineFallback } from "@/components/layout/OfflineFallback"

export function OfflineGate({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    function syncConnectionStatus() {
      setIsOffline(!window.navigator.onLine)
    }

    syncConnectionStatus()
    window.addEventListener("offline", syncConnectionStatus)
    window.addEventListener("online", syncConnectionStatus)

    return () => {
      window.removeEventListener("offline", syncConnectionStatus)
      window.removeEventListener("online", syncConnectionStatus)
    }
  }, [])

  if (isOffline) {
    return <OfflineFallback />
  }

  return children
}
