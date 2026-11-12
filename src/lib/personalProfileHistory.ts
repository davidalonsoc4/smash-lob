import { createSessionResource } from "@/lib/sessionResource"
import { PERSONAL_PROFILE_ACCOUNT_HEADER, type PersonalMatchItem, type PersonalMatchesDashboardPayload } from "@/lib/personalMatches"

async function loadAllFinishedMatches(account: string, signal: AbortSignal) {
  const items: PersonalMatchItem[] = []
  let offset = 0

  for (let page = 0; page < 200; page += 1) {
    const response = await fetch(
      `/api/personal-matches?limit=50&offset=${offset}&includeUpcoming=0&includeAvatars=1`,
      { cache: "no-store", signal, headers: { [PERSONAL_PROFILE_ACCOUNT_HEADER]: account } },
    )
    if (response.status === 401 || response.status === 403) return null
    if (!response.ok) throw new Error("personal_profile_lookup_failed")
    const payload = (await response.json()) as PersonalMatchesDashboardPayload

    items.push(...payload.items.filter((match) => match.status === "finished"))
    if (!payload.hasMore || payload.nextOffset === null) return items
    offset = payload.nextOffset
  }

  throw new Error("personal_profile_history_too_large")
}

export function createPersonalProfileHistory(email: string) {
  const account = encodeURIComponent(email.trim().toLowerCase())
  return createSessionResource(signal => loadAllFinishedMatches(account, signal))
}
