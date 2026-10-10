import "server-only"
import type { DominantHand, PreferredPlayerSide } from "@/lib/accountProfile"

/** Presentation-only fixtures for unlinked players; never persisted. */
export function getPlayerPreviewTraits(playerId: string, linkedUserId?: string | null) {
  const empty = { preferredSide: null, dominantHand: null }
  if (linkedUserId) return empty
  try {
    const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").hostname
    const databaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname
    const variant = (process.env.NEXT_PUBLIC_APP_VARIANT ?? "").toLowerCase()
    if (["prod", "production"].includes(variant)) return empty
    if (!["localhost", "127.0.0.1", "[::1]", "pre.smashandlob.com"].includes(appHost)) return empty
    if (databaseHost !== "miadjotkucgluwbrgeih.supabase.co") return empty
  } catch {
    return empty
  }
  let hash = 2166136261
  for (const character of playerId) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0
  const sides: PreferredPlayerSide[] = ["drive", "reves", "versatile"]
  const hands: DominantHand[] = ["right", "left"]
  return { preferredSide: sides[hash % sides.length], dominantHand: hands[Math.floor(hash / 3) % hands.length] }
}
