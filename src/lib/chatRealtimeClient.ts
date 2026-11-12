import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export const CHAT_REALTIME_EVENT = "refresh"
export { CHAT_UNREAD_LOCAL_REFRESH_EVENT } from "@/lib/appRefreshEvents"

type SubscriptionEntry = {
  channel: RealtimeChannel
  listeners: Set<(leagueDataChanged?: boolean) => void>
}

const subscriptions = new Map<string, SubscriptionEntry>()

export function subscribeChatRealtime(topic: string | null | undefined, listener: (leagueDataChanged?: boolean) => void): () => void {
  if (!topic) return () => undefined
  let entry = subscriptions.get(topic)
  if (!entry) {
    const listeners = new Set<(leagueDataChanged?: boolean) => void>()
    const channel = supabase
      .channel(topic, { config: { private: false } })
      .on<{ leagueDataChanged?: boolean }>("broadcast", { event: CHAT_REALTIME_EVENT }, ({ payload }) => {
        for (const current of listeners) current(payload?.leagueDataChanged === true)
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") for (const current of listeners) current()
      })
    entry = { channel, listeners }
    subscriptions.set(topic, entry)
  }

  entry.listeners.add(listener)
  return () => {
    const current = subscriptions.get(topic)
    if (!current) return
    current.listeners.delete(listener)
    if (current.listeners.size > 0) return
    subscriptions.delete(topic)
    void supabase.removeChannel(current.channel)
  }
}
