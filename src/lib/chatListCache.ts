const storageKey = "smash-lob:chat-list:v1"
const maxAge = 15 * 60_000

export function readChatListCache<T>(account: string): T | undefined {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    const entry = JSON.parse(raw)
    if (entry.account === account && Date.now() - entry.savedAt < maxAge) return entry.data
    localStorage.removeItem(storageKey)
  } catch {
    // The list remains available over the network when browser storage is unavailable.
  }
}

export function writeChatListCache<T>(account: string, data: T) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ account, savedAt: Date.now(), data }))
  } catch {
    // Storage is only a performance optimization.
  }
}

export function clearChatListCache() {
  try { localStorage.removeItem(storageKey) } catch { /* storage is optional */ }
}
