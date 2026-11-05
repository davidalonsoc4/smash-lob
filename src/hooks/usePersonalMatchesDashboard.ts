import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import type { PersonalMatchesDashboardPayload } from "@/lib/personalMatches"

type Dashboard = PersonalMatchesDashboardPayload
let recent: { account: string; data: Dashboard; expiresAt: number } | undefined
const inFlight = new Map<string, Promise<Dashboard>>()

function readDashboard(account: string) {
  return recent?.account === account && recent.expiresAt > Date.now() ? recent.data : null
}

function loadDashboard(account: string) {
  const pending = account && inFlight.get(account)
  if (pending) return pending

  const request = fetch("/api/personal-matches?limit=10&offset=0&includeUpcoming=1", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("personal_matches_lookup_failed")
      const data = await response.json() as Dashboard
      if (account) recent = { account, data, expiresAt: Date.now() + 30_000 }
      return data
    }).finally(() => { if (account) inFlight.delete(account) })
  if (account) inFlight.set(account, request)
  return request
}

export function usePersonalMatchesDashboard(enabled = true) {
  const account = useSession().data?.user?.email ?? ""
  const [initial] = useState(() => ({ account, data: readDashboard(account) }))
  const [result, setResult] = useState<{ account: string; data: Dashboard | null }>()

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    void loadDashboard(account).then(
      (data) => { if (!cancelled) setResult({ account, data }) },
      () => { if (!cancelled) setResult({ account, data: null }) },
    )
    return () => { cancelled = true }
  }, [account, enabled])

  const current = result?.account === account ? result : undefined
  return { account, dashboard: enabled ? (current ? current.data : initial.account === account ? initial.data : null) : null, failed: current?.data === null, refreshing: !current }
}
