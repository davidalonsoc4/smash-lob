import { useCallback, useEffect, useRef } from "react"
import { fetchSupabaseLeagueSnapshot, type LeagueSnapshot } from "@/lib/supabaseLeagues"

export function useLeagueSnapshotPreload(account: string | null) {
  const pending = useRef<{ account: string; controller: AbortController; response: Promise<LeagueSnapshot | null> } | null>(null)
  const clear = useCallback(() => {
    pending.current?.controller.abort()
    pending.current = null
  }, [])

  useEffect(() => clear, [account, clear])
  const start = useCallback((priority: RequestPriority = "low") => {
    if (!account || pending.current) return
    const controller = new AbortController()
    const response = fetchSupabaseLeagueSnapshot({ signal: controller.signal, priority }).catch(() => null)
    const request = { account, controller, response }
    pending.current = request
    window.setTimeout(() => { if (pending.current === request) clear() }, 30_000)
  }, [account, clear])
  const schedule = useCallback(() => {
    if (!account) return
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (connection?.saveData || /2g/.test(connection?.effectiveType ?? "")) return

    let idle: number | undefined
    const startWhenVisible = () => { if (!document.hidden) start() }
    const timer = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(startWhenVisible)
      else startWhenVisible()
    }, 1_500)
    return () => {
      window.clearTimeout(timer)
      if (idle !== undefined) window.cancelIdleCallback(idle)
    }
  }, [account, start])

  const take = useCallback(() => {
    const request = pending.current
    if (!request || request.account !== account) return null
    pending.current = null
    return request.response
  }, [account])
  return { schedule, start, take, clear }
}
