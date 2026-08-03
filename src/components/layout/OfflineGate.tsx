"use client"

import { useEffect, useState, type ReactNode } from "react"
import { OfflineFallback } from "@/components/layout/OfflineFallback"

export function OfflineGate({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    function showOfflineFallback() {
      setIsOffline(true)
    }

    if (!window.navigator.onLine) {
      showOfflineFallback()
    }
    window.addEventListener("offline", showOfflineFallback)

    return () => {
      window.removeEventListener("offline", showOfflineFallback)
    }
  }, [])

  if (isOffline) {
    return <OfflineFallback />
  }

  return children
}
