import { useEffect, useSyncExternalStore } from "react"
import type { createSessionResource } from "@/lib/sessionResource"

export function useSessionResource<T>(resource: ReturnType<typeof createSessionResource<T>>) {
  const snapshot = useSyncExternalStore(resource.subscribe, resource.getSnapshot, resource.getSnapshot)
  useEffect(() => {
    const timer = window.setTimeout(resource.refresh, 0)
    const refreshVisible = () => { if (!document.hidden) resource.refresh() }
    document.addEventListener("visibilitychange", refreshVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", refreshVisible)
    }
  }, [resource])
  return snapshot
}
