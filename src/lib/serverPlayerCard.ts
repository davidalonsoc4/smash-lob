import "server-only"

import type { AuthenticatedAppUser } from "@/lib/serverAuth"
import { normalizeDominantHand, normalizePreferredPlayerSide, type DominantHand, type PreferredPlayerSide } from "@/lib/accountProfile"
import type { PlayerRating, RatingMatch } from "@/lib/rating"
import { loadRatingsOverview } from "@/lib/serverRatings"

export type PlayerCardRecord = { matches: number; wins: number }
export type PlayerCard = {
  userId: string
  displayName: string
  avatarUrl: string | null
  preferredSide: PreferredPlayerSide | null
  dominantHand: DominantHand | null
  isSelf: boolean
  together: PlayerCardRecord
  against: PlayerCardRecord
  /** Only while the rating system is hidden: the superuser sees it, nobody else. */
  rating: PlayerRating | null
  labels: Record<string, string>
}

function winnerTeam(match: RatingMatch) {
  const a = match.sets.filter((set) => set.a > set.b).length
  const b = match.sets.filter((set) => set.b > set.a).length
  return a === b ? null : a > b ? "A" : "B"
}

// Global card of a person. It never shows league data: only who they are, how you have played with and against them,
// and (for now, to the superuser) their level. Visible to the person, to anyone who shared a friendly with them
// and to people who share a league with them.
export async function loadPlayerCard(actor: AuthenticatedAppUser, userId: string): Promise<PlayerCard | "forbidden" | null> {
  const db = actor.supabase
  const me = actor.user.id
  const isSelf = me === userId
  const userResult = await db.from("app_users").select("id,display_name,avatar_url,preferred_side,dominant_hand").eq("id", userId).maybeSingle()
  if (userResult.error) throw new Error("player_card_user_failed")
  if (!userResult.data) return null

  if (!isSelf && !actor.user.isSuperuser) {
    const [participants, memberships] = await Promise.all([
      db.from("personal_match_participants").select("match_id,user_id").in("user_id", [me, userId]),
      db.from("league_memberships").select("league_id,user_id").in("user_id", [me, userId]),
    ])
    if (participants.error || memberships.error) throw new Error("player_card_access_failed")
    const seen = new Map<string, Set<string>>()
    for (const row of participants.data ?? []) seen.set(String(row.match_id), (seen.get(String(row.match_id)) ?? new Set()).add(String(row.user_id)))
    const leagues = new Map<string, Set<string>>()
    for (const row of memberships.data ?? []) leagues.set(String(row.league_id), (leagues.get(String(row.league_id)) ?? new Set()).add(String(row.user_id)))
    const shared = [...seen.values(), ...leagues.values()].some((people) => people.has(me) && people.has(userId))
    if (!shared) return "forbidden"
  }

  const overview = await loadRatingsOverview(db)
  const together: PlayerCardRecord = { matches: 0, wins: 0 }
  const against: PlayerCardRecord = { matches: 0, wins: 0 }
  if (!isSelf) {
    for (const match of overview.matches) {
      const inA = (key: string) => match.teamA.includes(key)
      const inB = (key: string) => match.teamB.includes(key)
      const winner = winnerTeam(match)
      if (!winner) continue
      if ((inA(me) && inA(userId)) || (inB(me) && inB(userId))) {
        together.matches += 1
        if ((winner === "A") === inA(me)) together.wins += 1
      } else if ((inA(me) && inB(userId)) || (inB(me) && inA(userId))) {
        against.matches += 1
        if ((winner === "A") === inA(me)) against.wins += 1
      }
    }
  }

  const user = userResult.data
  return {
    userId,
    displayName: String(user.display_name ?? "Jugador"),
    avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null,
    preferredSide: normalizePreferredPlayerSide(user.preferred_side),
    dominantHand: normalizeDominantHand(user.dominant_hand),
    isSelf,
    together,
    against,
    rating: actor.user.isSuperuser ? overview.people.find((person) => person.key === userId) ?? null : null,
    labels: overview.labels,
  }
}
