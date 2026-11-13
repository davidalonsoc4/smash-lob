export type PersonalChatOverviewItem = {
  id: string
  origin: "friendly" | "league"
  leagueName?: string
  leagueId?: string
  seasonId?: string
  seasonStatus?: string
  currentRound?: number
  round?: number
  status: string
  scheduledAt: string | null
  resultRecordedAt: string | null
  locationName: string | null
  readOnly: boolean
  expired: boolean
  partner: string
  rivals: string[]
  unread: number
  lastMessage: {
    sender: string
    body: string
    createdAt: string
  } | null
  realtimeTopic: string | null
}
export type GeneralLeagueChat = {
  leagueId: string
  leagueName: string
  seasonId: string
  seasonName: string
  unread: number
  participants: number
  lastMessage: { sender: string; body: string; createdAt: string } | null
  realtimeTopic: string | null
}

export type ChatListSnapshot = { chats: PersonalChatOverviewItem[]; generalChats: GeneralLeagueChat[] }
export const emptyChatList: ChatListSnapshot = { chats: [], generalChats: [] }
export const CHAT_LIST_ACCOUNT_HEADER = "x-smash-lob-chat-list-account"
const freshnessMs = 30_000

export function createChatListMemory() {
  let entry: { snapshot: ChatListSnapshot; scope: string; loadedAt: number } | null = null
  let expiresAt = 0
  let version = 0

  return {
    read: () => entry,
    version: () => version,
    isFresh: (scope: string) => entry?.scope === scope && Date.now() < expiresAt,
    save(snapshot: ChatListSnapshot, scope: string, loadedAt: number) {
      entry = { snapshot, scope, loadedAt }
      expiresAt = loadedAt + freshnessMs
    },
    invalidate() { expiresAt = 0 },
    drop() { entry = null },
    discard() {
      entry = null
      expiresAt = 0
      version += 1
    },
  }
}
