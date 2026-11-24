import type { AuthenticatedAppUser } from "@/lib/serverAuth"

export type PairingStat = { personKey: string; winRate: number | null; matches: number }

type SetScore = { a: number; b: number }
type ParticipantRow = { user_id: string | null; source_player_id: string | null; display_name: string }

function uniq(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))]
}

function teamWon(sets: unknown, team: 1 | 2): boolean | null {
  if (!Array.isArray(sets)) return null
  let own = 0
  let other = 0
  for (const raw of sets) {
    const a = Number((raw as SetScore | null)?.a)
    const b = Number((raw as SetScore | null)?.b)
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) continue
    if ((a > b ? 1 : 2) === team) own += 1
    else other += 1
  }
  return own === other ? null : own > other
}

// Only a percentage per linked player is returned, never the matches themselves, and only to someone who manages the friendly.
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

  const allUserIds = uniq(people.map((person) => person.userId))
  const allPlayerIds = uniq(people.flatMap((person) => person.playerIds))
  const tally = new Map<string, { wins: number; matches: number }>()
  const add = (key: string, won: boolean) => {
    const current = tally.get(key) ?? { wins: 0, matches: 0 }
    tally.set(key, { wins: current.wins + (won ? 1 : 0), matches: current.matches + 1 })
  }

  if (allUserIds.length) {
    const rows = await db.from("personal_match_participants").select("match_id,team,user_id").in("user_id", allUserIds).neq("match_id", matchId)
    if (rows.error) throw new Error("pairing_stats_friendlies_failed")
    const matchIds = uniq((rows.data ?? []).map((row) => row.match_id as string))
    const matches = matchIds.length ? await db.from("personal_matches").select("id,sets,status").in("id", matchIds).eq("status", "finished") : { data: [], error: null }
    if (matches.error) throw new Error("pairing_stats_friendlies_failed")
    const setsById = new Map((matches.data ?? []).map((row) => [row.id as string, row.sets]))
    for (const row of rows.data ?? []) {
      if (!setsById.has(row.match_id as string)) continue
      const won = teamWon(setsById.get(row.match_id as string), row.team === 2 ? 2 : 1)
      if (won !== null) add(`user:${row.user_id}`, won)
    }
  }

  if (allPlayerIds.length) {
    const filter = allPlayerIds.flatMap((id) => [`team_a.cs.{${id}}`, `team_b.cs.{${id}}`]).join(",")
    const leagueResult = await db.from("matches").select("team_a,team_b,sets").eq("status", "finished").or(filter)
    if (leagueResult.error) throw new Error("pairing_stats_league_failed")
    for (const row of leagueResult.data ?? []) {
      const teamA = Array.isArray(row.team_a) ? (row.team_a as string[]) : []
      const teamB = Array.isArray(row.team_b) ? (row.team_b as string[]) : []
      for (const person of people) {
        if (!person.personKey) continue
        const team = person.playerIds.some((id) => teamA.includes(id)) ? 1 : person.playerIds.some((id) => teamB.includes(id)) ? 2 : null
        if (!team) continue
        const won = teamWon(row.sets, team)
        if (won !== null) add(person.userId ? `user:${person.userId}` : person.personKey, won)
      }
    }
  }

  return people.flatMap((person) => {
    if (!person.personKey) return []
    const counted = tally.get(person.userId ? `user:${person.userId}` : person.personKey)
    return [{ personKey: person.personKey, matches: counted?.matches ?? 0, winRate: counted && counted.matches > 0 ? Math.round((counted.wins / counted.matches) * 100) : null }]
  })
}
