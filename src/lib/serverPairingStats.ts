import type { AuthenticatedAppUser } from "@/lib/serverAuth"
import { loadRatingsOverview } from "@/lib/serverRatings"

export type PairingStat = { personKey: string; elo: number | null; matches: number; provisional: boolean }

type ParticipantRow = { user_id: string | null; source_player_id: string | null; display_name: string }

function uniq(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))]
}

// Only the Elo (and how many matches back it) of each linked player is returned, never the matches themselves, and only to someone who manages the friendly.
export async function loadPairingStats(actor: AuthenticatedAppUser, matchId: string): Promise<PairingStat[]> {
  const db = actor.supabase
  const participantsResult = await db.from("personal_match_participants").select("user_id,source_player_id,display_name").eq("match_id", matchId)
  if (participantsResult.error) throw new Error("pairing_stats_participants_failed")
  const participants = (participantsResult.data ?? []) as ParticipantRow[]
  const userIds = uniq(participants.map((row) => row.user_id))
  const sourcePlayerIds = uniq(participants.map((row) => row.source_player_id))

  const membershipFilter = [
    userIds.length ? `user_id.in.(${userIds.join(",")})` : "",
    sourcePlayerIds.length ? `player_id.in.(${sourcePlayerIds.join(",")})` : "",
  ].filter(Boolean).join(",")
  const membershipsResult = membershipFilter
    ? await db.from("league_memberships").select("user_id,player_id").or(membershipFilter)
    : { data: [], error: null }
  if (membershipsResult.error) throw new Error("pairing_stats_memberships_failed")
  const memberships = (membershipsResult.data ?? []) as Array<{ user_id: string | null; player_id: string | null }>

  const people = participants.map((row) => {
    const linkedUser = row.user_id ?? memberships.find((item) => item.player_id && item.player_id === row.source_player_id)?.user_id ?? null
    const playerIds = uniq([
      row.source_player_id,
      ...memberships.filter((item) => (linkedUser && item.user_id === linkedUser) || (row.source_player_id && item.player_id === row.source_player_id)).map((item) => item.player_id),
    ])
    const personKey = row.user_id ? `user:${row.user_id}` : row.source_player_id ? `player:${row.source_player_id}` : null
    return { personKey, userId: linkedUser, playerIds }
  })

  const ratings = new Map((await loadRatingsOverview(db)).people.map((rated) => [rated.key, rated]))
  return people.flatMap((person) => {
    if (!person.personKey) return []
    const rated = person.userId ? ratings.get(person.userId) : undefined
    return [{ personKey: person.personKey, matches: rated?.matches ?? 0, elo: rated ? Math.round(rated.rating) : null, provisional: rated?.provisional ?? true }]
  })
}
