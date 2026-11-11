export type GlobalChatTiming = {
  id: string; origin: "league" | "friendly"; round?: number; currentRound?: number; seasonStatus?: string
  status: string; scheduledAt: string | null; resultRecordedAt: string | null; readOnly: boolean
  lastMessage: { createdAt: string } | null
}
export function getGlobalChatPhase(chat: Omit<GlobalChatTiming, "id" | "lastMessage" | "resultRecordedAt">, now: number) {
  if (chat.status === "finished" || chat.readOnly || chat.seasonStatus === "finished") return "finished"
  const farRound = chat.origin === "league" && (chat.round ?? 1) > (chat.currentRound ?? 1) + 2
  if (chat.seasonStatus === "upcoming" || farRound || Date.parse(chat.scheduledAt ?? "") > now + 7 * 86400000) return "upcoming"
  return "active"
}

export function groupGlobalChats<T extends GlobalChatTiming>(chats: T[], now: number) {
  const groups = { active: [] as T[], upcoming: [] as T[], finished: [] as T[] }
  const date = (value: string | null | undefined) => Date.parse(value ?? "") || 0
  for (const chat of chats) groups[getGlobalChatPhase(chat, now)].push(chat)
  const proximity = (chat: T) => date(chat.scheduledAt) ? Math.max(0,date(chat.scheduledAt)-now) : Math.max(0,(chat.round??1)-(chat.currentRound??1))*7*86400000
  const nearby = (a:T,b:T) => proximity(a)-proximity(b) || date(b.lastMessage?.createdAt)-date(a.lastMessage?.createdAt) || a.id.localeCompare(b.id)
  groups.active.sort(nearby); groups.upcoming.sort(nearby)
  groups.finished.sort((a,b)=>date(b.lastMessage?.createdAt??b.resultRecordedAt??b.scheduledAt)-date(a.lastMessage?.createdAt??a.resultRecordedAt??a.scheduledAt))
  return groups
}
