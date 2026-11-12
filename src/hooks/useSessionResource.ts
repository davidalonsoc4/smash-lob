import { useEffect, useSyncExternalStore } from "react"
import type { createSessionResource } from "@/lib/sessionResource"

const empty = { data: null, failed: false, refreshing: false }
const getEmpty = () => empty
const subscribeEmpty = () => () => undefined

export function useSessionResource<T>(resource: ReturnType<typeof createSessionResource<T>>, enabled = true) {
  const read = enabled ? resource.getSnapshot : getEmpty
  const snapshot = useSyncExternalStore(enabled ? resource.subscribe : subscribeEmpty, read, read)
  useEffect(() => {
    if (!enabled) return
    const timer = window.setTimeout(resource.refresh, 0)
    const refreshVisible = () => { if (!document.hidden) resource.refresh() }
    document.addEventListener("visibilitychange", refreshVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", refreshVisible)
    }
  }, [enabled, resource])
  return snapshot
}
