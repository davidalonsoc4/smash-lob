const cache = new Map<string, { cachedAt: number; payload: unknown }>()
const key = (matchId: string, account: string) => JSON.stringify([account, matchId])

export function clearMatchChatMemory() {
  cache.clear()
}

export function readMatchChatCache(matchId: string, account: string) {
  const entry = cache.get(key(matchId, account))
  if (entry && Date.now() - entry.cachedAt < 30_000) return entry.payload
  return null
}

export function writeMatchChatCache(matchId: string, account: string, payload: unknown) {
  const cacheKey = key(matchId, account)
  cache.delete(cacheKey)
  cache.set(cacheKey, { cachedAt: Date.now(), payload })
  const oldest = cache.keys().next().value
  if (cache.size > 8 && oldest) cache.delete(oldest)
}

export function clearMatchChatCache(matchId: string, account: string) {
  cache.delete(key(matchId, account))
}
