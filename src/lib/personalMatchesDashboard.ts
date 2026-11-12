import { PERSONAL_PROFILE_ACCOUNT_HEADER, type PersonalMatchesDashboardPayload } from "@/lib/personalMatches"
import { createSessionResource } from "@/lib/sessionResource"

export function createPersonalMatchesDashboard(email: string) {
  const account = encodeURIComponent(email.trim().toLowerCase())
  return createSessionResource(async signal => {
    const response = await fetch("/api/personal-matches?limit=10&offset=0&includeUpcoming=1", {
      cache: "no-store", signal, headers: { [PERSONAL_PROFILE_ACCOUNT_HEADER]: account },
    })
    if (response.status === 401 || response.status === 403) return null
    if (!response.ok) throw new Error("personal_matches_lookup_failed")
    return await response.json() as PersonalMatchesDashboardPayload
  }, 30_000)
}
