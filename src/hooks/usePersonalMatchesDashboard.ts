import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useSessionResource } from "@/hooks/useSessionResource"

export function usePersonalMatchesDashboard(enabled = true) {
  const { account, matchDashboard } = useAccountProfile()
  const { data, failed, refreshing } = useSessionResource(matchDashboard, enabled)
  return { account, dashboard: data, failed, refreshing: refreshing || (!data && !failed) }
}
