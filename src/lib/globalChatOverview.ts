export type GlobalChatTiming = {
  id: string; origin: "league" | "friendly"; round?: number; currentRound?: number; seasonStatus?: string
  status: string; scheduledAt: string | null; resultRecordedAt: string | null; readOnly: boolean
  lastMessage: { createdAt: string } | null
}
export function groupGlobalChats<T extends GlobalChatTiming>(chats: T[], now: number) {
  const groups = { active: [] as T[], upcoming: [] as T[], finished: [] as T[] }
  const date = (value: string | null | undefined) => Date.parse(value ?? "") || 0
  for (const chat of chats) {
    if (chat.status === "finished" || chat.readOnly || chat.seasonStatus === "finished") groups.finished.push(chat)
    else if (chat.seasonStatus === "upcoming" || chat.origin === "league" && (chat.round ?? 1) > (chat.currentRound ?? 1) + 2 || date(chat.scheduledAt) > now + 7*86400000) groups.upcoming.push(chat)
    else groups.active.push(chat)
  }
  const proximity = (chat: T) => date(chat.scheduledAt) ? Math.max(0,date(chat.scheduledAt)-now) : Math.max(0,(chat.round??1)-(chat.currentRound??1))*7*86400000
  const nearby = (a:T,b:T) => proximity(a)-proximity(b) || date(b.lastMessage?.createdAt)-date(a.lastMessage?.createdAt) || a.id.localeCompare(b.id)
  groups.active.sort(nearby); groups.upcoming.sort(nearby)
  groups.finished.sort((a,b)=>date(b.lastMessage?.createdAt??b.resultRecordedAt??b.scheduledAt)-date(a.lastMessage?.createdAt??a.resultRecordedAt??a.scheduledAt))
  return groups
}
