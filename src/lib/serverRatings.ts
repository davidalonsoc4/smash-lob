import "server-only"

import type { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { computeRatings, type PlayerRating, type RatingMatch, type RatingSet } from "@/lib/rating"

type Supabase = NonNullable<ReturnType<typeof createSupabaseServiceClient>>

export type RatedPerson = PlayerRating & { displayName: string; email: string | null; avatarUrl: string | null }
export type RatingsOverview = { people: RatedPerson[]; labels: Record<string, string>; matchCount: number; excludedMatchCount: number; matches: RatingMatch[] }

const asSets = (value: unknown): RatingSet[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const set = item as { a?: unknown; b?: unknown }
        return typeof set?.a === "number" && typeof set?.b === "number" ? [{ a: set.a, b: set.b }] : []
      })
    : []

const normalizeName = (name: string) => name.trim().toLocaleLowerCase("es-ES").normalize("NFD").replace(/[̀-ͯ]/g, "")

// Every finished league match and friendly, with one key per person: the account id when the player has an account,
// otherwise a stand-in key ("ext:...") that takes part in the calculation but is never shown as a rated person.
export async function loadRatingsOverview(supabase: Supabase): Promise<RatingsOverview> {
  const [leagueResult, membershipsResult, playersResult, friendliesResult, participantsResult, usersResult] = await Promise.all([
    supabase.from("matches").select("id,team_a,team_b,sets,result_recorded_at,scheduled_at,ranking_counts").eq("status", "finished"),
    supabase.from("league_memberships").select("player_id,user_id"),
    supabase.from("players").select("id,display_name"),
    supabase.from("personal_matches").select("id,sets,result_recorded_at,played_at").eq("status", "finished"),
    supabase.from("personal_match_participants").select("match_id,team,slot,user_id,source_player_id,display_name"),
    supabase.from("app_users").select("id,display_name,email,avatar_url"),
  ])
  const failed = [leagueResult, membershipsResult, playersResult, friendliesResult, participantsResult, usersResult].some((result) => result.error)
  if (failed) throw new Error("ratings_lookup_failed")

  const userByPlayer = new Map<string, string>()
  for (const membership of membershipsResult.data ?? []) if (membership.player_id && membership.user_id) userByPlayer.set(String(membership.player_id), String(membership.user_id))
  const playerNames = new Map((playersResult.data ?? []).map((player) => [String(player.id), String(player.display_name ?? "Jugador")]))
  const labels: Record<string, string> = {}
  const keyForPlayer = (playerId: string) => {
    const userId = userByPlayer.get(playerId)
    if (userId) return userId
    const key = `ext:player:${playerId}`
    labels[key] = `${playerNames.get(playerId) ?? "Jugador"} (sin cuenta)`
    return key
  }

  const matches: RatingMatch[] = []
  let excluded = 0
  for (const row of leagueResult.data ?? []) {
    if (row.ranking_counts === false) { excluded += 1; continue }
    matches.push({
      id: String(row.id),
      at: String(row.result_recorded_at ?? row.scheduled_at ?? ""),
      kind: "league",
      teamA: ((row.team_a ?? []) as string[]).map(String).map(keyForPlayer),
      teamB: ((row.team_b ?? []) as string[]).map(String).map(keyForPlayer),
      sets: asSets(row.sets),
    })
  }

  const participantsByMatch = new Map<string, NonNullable<typeof participantsResult.data>>()
  for (const participant of participantsResult.data ?? []) {
    const list = participantsByMatch.get(String(participant.match_id)) ?? []
    list.push(participant)
    participantsByMatch.set(String(participant.match_id), list)
  }
  for (const row of friendliesResult.data ?? []) {
    const people = (participantsByMatch.get(String(row.id)) ?? []).sort((left, right) => left.slot - right.slot)
    const keyFor = (participant: (typeof people)[number]) => {
      if (participant.user_id) return String(participant.user_id)
      const fromPlayer = participant.source_player_id ? userByPlayer.get(String(participant.source_player_id)) : undefined
      if (fromPlayer) return fromPlayer
      const key = `ext:name:${normalizeName(String(participant.display_name ?? ""))}`
      labels[key] = `${participant.display_name ?? "Jugador"} (sin cuenta)`
      return key
    }
    matches.push({
      id: String(row.id),
      at: String(row.result_recorded_at ?? row.played_at ?? ""),
      kind: "friendly",
      teamA: people.filter((participant) => participant.team === 1).map(keyFor),
      teamB: people.filter((participant) => participant.team === 2).map(keyFor),
      sets: asSets(row.sets),
    })
  }

  const users = new Map((usersResult.data ?? []).map((user) => [String(user.id), user]))
  for (const [id, user] of users) labels[id] = String(user.display_name ?? user.email ?? "Jugador")

  const ratings = computeRatings(matches)
  const people = [...ratings.values()]
    .filter((player) => users.has(player.key))
    .map((player) => {
      const user = users.get(player.key)!
      return { ...player, displayName: labels[player.key], email: user.email ? String(user.email) : null, avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null }
    })
    .sort((left, right) => right.rating - left.rating)
  return { people, labels, matchCount: matches.length, excludedMatchCount: excluded, matches }
}
