import { PERSONAL_PROFILE_ACCOUNT_HEADER, type PersonalMatchItem, type PersonalMatchesDashboardPayload } from "@/lib/personalMatches"

const freshnessMs = 60_000

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

type History = { items: PersonalMatchItem[] | null; failed: boolean }

export function createPersonalProfileHistory(email: string) {
  const account = encodeURIComponent(email.trim().toLowerCase())
  let snapshot: History = { items: null, failed: false }
  let expiresAt = 0
  let pending: AbortController | null = null
  const listeners = new Set<() => void>()

  function publish(next: History) {
    snapshot = next
    listeners.forEach(listener => listener())
  }

  function cancel() {
    pending?.abort()
    pending = null
  }

  function refresh() {
    if (pending || Date.now() < expiresAt) return
    const controller = new AbortController()
    pending = controller
    void loadAllFinishedMatches(account, controller.signal).then(items => {
      if (pending !== controller) return
      expiresAt = items ? Date.now() + freshnessMs : 0
      publish({ items, failed: !items })
    }, () => {
      if (pending === controller && !snapshot.items) publish({ items: null, failed: true })
    }).finally(() => {
      if (pending === controller) pending = null
    })
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    refresh,
    cancel,
    invalidate() {
      expiresAt = 0
      cancel()
      if (listeners.size) refresh()
    },
  }
}
