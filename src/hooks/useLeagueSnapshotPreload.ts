import { useCallback, useEffect, useRef } from "react"
import { fetchSupabaseLeagueSnapshot, type LeagueSnapshot } from "@/lib/supabaseLeagues"

export function useLeagueSnapshotPreload(account: string | null) {
  const pending = useRef<{ account: string; controller: AbortController; response: Promise<LeagueSnapshot | null> } | null>(null)
  const clear = useCallback(() => {
    pending.current?.controller.abort()
    pending.current = null
  }, [])

  useEffect(() => clear, [account, clear])
  const schedule = useCallback(() => {
    if (!account) return
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (connection?.saveData || /2g/.test(connection?.effectiveType ?? "")) return

    let idle: number | undefined
    const start = () => {
      if (pending.current || document.hidden) return
      const controller = new AbortController()
      const request = { account, controller, response: fetchSupabaseLeagueSnapshot({ signal: controller.signal, priority: "low" }).catch(() => null) }
      pending.current = request
      window.setTimeout(() => { if (pending.current === request) clear() }, 30_000)
    }
    const timer = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start)
      else start()
    }, 1_500)
    return () => {
      window.clearTimeout(timer)
      if (idle !== undefined) window.cancelIdleCallback(idle)
    }
  }, [account, clear])

  const take = useCallback(() => {
    const request = pending.current
    if (!request || request.account !== account) return null
    pending.current = null
    return request.response
  }, [account])
  return { schedule, take, clear }
}
