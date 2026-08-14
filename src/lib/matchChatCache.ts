const MATCH_CHAT_CACHE_PREFIX = "smash-lob-match-chat-cache-v1:"
const MATCH_CHAT_CACHE_MAX_AGE_MS = 30 * 60 * 1000

type MatchChatCacheEnvelope = {
  cachedAt: number
  payload: unknown
}

function getCacheKey(matchId: string) {
  return `${MATCH_CHAT_CACHE_PREFIX}${matchId}`
}

export function readMatchChatCache(matchId: string) {
  if (typeof window === "undefined" || !matchId) return null

  try {
    const raw = window.sessionStorage.getItem(getCacheKey(matchId))
    if (!raw) return null
    const envelope = JSON.parse(raw) as Partial<MatchChatCacheEnvelope>
    if (
      typeof envelope.cachedAt !== "number" ||
      Date.now() - envelope.cachedAt > MATCH_CHAT_CACHE_MAX_AGE_MS ||
      typeof envelope.payload !== "object" ||
      envelope.payload === null
    ) {
      window.sessionStorage.removeItem(getCacheKey(matchId))
      return null
    }
    return envelope.payload
  } catch {
    return null
  }
}

export function writeMatchChatCache(matchId: string, payload: unknown) {
  if (typeof window === "undefined" || !matchId) return

  try {
    const envelope: MatchChatCacheEnvelope = { cachedAt: Date.now(), payload }
    window.sessionStorage.setItem(getCacheKey(matchId), JSON.stringify(envelope))
  } catch {
    // La caché es solo una optimización visual; el chat sigue funcionando sin ella.
  }
}
