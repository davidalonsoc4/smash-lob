import { fetchLeagueAnnouncements } from "@/lib/announcements"
import { subscribeChatRealtime } from "@/lib/chatRealtimeClient"
import { CHAT_LIST_ACCOUNT_HEADER } from "@/lib/chatListMemory"
import { createSessionResource } from "@/lib/sessionResource"

export type LeagueChatItem = {
  id: string
  round: number
  status: string
  coordinationStatus: "coordinating" | "awaiting_booking" | null
  scheduledAt: string | null
  readOnly: boolean
  partner: string
  rivals: string[]
  unread: number
  lastMessage: { sender: string; body: string; createdAt: string } | null
}

type LeagueChats = { chats: LeagueChatItem[]; totalUnread: number; realtimeTopic: string | null }
type ChatPreview = {
  unread: number
  readOnly: boolean
  realtimeTopic: string | null
  participantCount?: number
  participants?: { userId: string }[]
  messages?: { sender_display_name: string; body: string; created_at: string }[]
}

function createScopedResources<T, Args extends string[]>(load: (signal: AbortSignal, ...args: Args) => Promise<T | null>) {
  const resources = new Map<string, ReturnType<typeof createSessionResource<T>>>()
  return {
    get(scope: string, ...args: Args) {
      const key = JSON.stringify([scope, ...args])
      const cached = resources.get(key)
      if (cached) return cached
      const resource = createSessionResource(signal => load(signal, ...args), 30_000)
      resources.set(key, resource)
      return resource
    },
    invalidate() { resources.forEach(resource => resource.invalidate()) },
    discard() { resources.forEach(resource => resource.discard()) },
    cancel() { resources.forEach(resource => resource.cancel()) },
  }
}

export function createLeagueScreenData(account: string) {
  const headers = { [CHAT_LIST_ACCOUNT_HEADER]: encodeURIComponent(account.trim().toLowerCase()) }
  async function read<T>(path: string, signal: AbortSignal): Promise<T | null> {
    const response = await fetch(path, { cache: "no-store", headers, signal })
    if ([401, 403, 404].includes(response.status)) return null
    if (!response.ok) throw new Error("league_screen_data_failed")
    return response.json() as Promise<T>
  }
  const chats = createScopedResources(async (signal, leagueId: string, seasonId: string) => {
    const query = new URLSearchParams({ leagueId, seasonId })
    const data = await read<LeagueChats>(`/api/chats?${query}`, signal)
    return data && { ...data, chats: Array.isArray(data.chats) ? data.chats : [] }
  })
  const preview = createScopedResources((signal, seasonId: string) =>
    read<ChatPreview>(`/api/league-season-chats/${encodeURIComponent(seasonId)}?summary=1`, signal))
  const announcements = createScopedResources((signal, leagueId: string) =>
    fetchLeagueAnnouncements(leagueId, { homeOnly: true, headers, signal }))
  type PreviewResource = ReturnType<typeof preview.get>
  let watchedPreview: { resource: PreviewResource; topic: string; unsubscribe: () => void } | null = null
  function stopPreview() {
    watchedPreview?.unsubscribe()
    watchedPreview = null
  }
  function watchPreview(resource: PreviewResource, topic: string | null | undefined) {
    if (watchedPreview?.resource === resource && watchedPreview.topic === topic) return
    stopPreview()
    if (topic) watchedPreview = { resource, topic, unsubscribe: subscribeChatRealtime(topic, () => {
      if (!document.hidden) resource.invalidate()
    }) }
  }
  const entrances = new Set<string>()
  return { chats, preview, announcements, watchPreview, stopPreview, entrances: { has: (key: string) => entrances.has(key), add: (key: string) => { entrances.add(key) } } }
}
