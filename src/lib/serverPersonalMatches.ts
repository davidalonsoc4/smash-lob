import "server-only"

import type { AuthenticatedAppUser } from "@/lib/serverAuth"
import {
  type PersonalMatchItem,
  type PersonalMatchParticipant,
  type PersonalMatchPerson,
  type PersonalMatchSet,
  sortPersonalMatchParticipants,
} from "@/lib/personalMatches"

type PersonalMatchPersonRecord = PersonalMatchPerson & {
  userId: string | null
  sourcePlayerId: string | null
}

type MatchRow = {
  id: string
  created_by_user_id: string | null
  played_at: string
  location_name: string | null
  sets: unknown
}

type ParticipantRow = {
  match_id: string
  team: number
  slot: number
  user_id: string | null
  source_player_id: string | null
  display_name: string
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function normalizeSelfName(user: AuthenticatedAppUser["user"]) {
  return (
    user.displayName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email.split("@")[0] ||
    "Jugador"
  )
}

function normalizeSets(value: unknown): PersonalMatchSet[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const a = Number((item as { a?: unknown }).a)
      const b = Number((item as { b?: unknown }).b)
      return Number.isInteger(a) && Number.isInteger(b) ? { a, b } : null
    })
    .filter((item): item is PersonalMatchSet => Boolean(item))
}

export async function loadAccessiblePersonalMatchPeople(
  actor: AuthenticatedAppUser,
): Promise<PersonalMatchPersonRecord[]> {
  const { supabase, user } = actor
  const [membershipResult, spectatorResult] = await Promise.all([
    supabase
      .from("league_memberships")
      .select("league_id")
      .eq("user_id", user.id),
    supabase
      .from("league_spectators")
      .select("league_id")
      .eq("user_id", user.id),
  ])

  if (membershipResult.error || spectatorResult.error) {
    throw new Error("personal_match_people_access_lookup_failed")
  }

  const leagueIds = uniqueStrings([
    ...(membershipResult.data ?? []).map((item) => item.league_id),
    ...(spectatorResult.data ?? []).map((item) => item.league_id),
  ])
  const selfRecord: PersonalMatchPersonRecord = {
    key: `user:${user.id}`,
    displayName: normalizeSelfName(user),
    avatarUrl: user.avatarUrl,
    sourceLeagueNames: [],
    isSelf: true,
    userId: user.id,
    sourcePlayerId: null,
  }

  if (leagueIds.length === 0) {
    return [selfRecord]
  }

  const [playersResult, membershipsResult, leaguesResult] = await Promise.all([
    supabase
      .from("players")
      .select("id,league_id,display_name")
      .in("league_id", leagueIds),
    supabase
      .from("league_memberships")
      .select("league_id,player_id,user_id")
      .in("league_id", leagueIds),
    supabase.from("leagues").select("id,name").in("id", leagueIds),
  ])

  if (playersResult.error || membershipsResult.error || leaguesResult.error) {
    throw new Error("personal_match_people_lookup_failed")
  }

  const userIds = uniqueStrings(
    (membershipsResult.data ?? []).map((membership) => membership.user_id),
  )
  let appUsers: Array<{
    id: string
    display_name: string | null
    avatar_url: string | null
  }> = []

  if (userIds.length > 0) {
    const appUsersResult = await supabase
      .from("app_users")
      .select("id,display_name,avatar_url")
      .in("id", userIds)

    if (appUsersResult.error) {
      throw new Error("personal_match_people_user_lookup_failed")
    }

    appUsers = (appUsersResult.data ?? []) as typeof appUsers
  }

  const membershipByPlayerId = new Map(
    (membershipsResult.data ?? [])
      .filter(
        (membership) =>
          typeof membership.player_id === "string" &&
          typeof membership.user_id === "string",
      )
      .map((membership) => [membership.player_id as string, membership.user_id as string]),
  )
  const appUserById = new Map(
    appUsers.map((appUser) => [appUser.id, appUser]),
  )
  const leagueNameById = new Map(
    (leaguesResult.data ?? []).map((league) => [league.id, league.name]),
  )
  const peopleByKey = new Map<string, PersonalMatchPersonRecord>([
    [selfRecord.key, selfRecord],
  ])

  for (const player of playersResult.data ?? []) {
    if (
      typeof player.id !== "string" ||
      typeof player.league_id !== "string" ||
      typeof player.display_name !== "string"
    ) {
      continue
    }

    const userId = membershipByPlayerId.get(player.id) ?? null
    const key = userId ? `user:${userId}` : `player:${player.id}`
    const appUser = userId ? appUserById.get(userId) : null
    const displayName =
      appUser?.display_name?.trim() || player.display_name.trim() || "Jugador"
    const leagueName = leagueNameById.get(player.league_id)
    const existing = peopleByKey.get(key)

    if (existing) {
      if (leagueName && !existing.sourceLeagueNames.includes(leagueName)) {
        existing.sourceLeagueNames.push(leagueName)
      }
      if (!existing.sourcePlayerId) existing.sourcePlayerId = player.id
      continue
    }

    peopleByKey.set(key, {
      key,
      displayName,
      avatarUrl:
        typeof appUser?.avatar_url === "string" ? appUser.avatar_url : null,
      sourceLeagueNames: leagueName ? [leagueName] : [],
      isSelf: userId === user.id,
      userId,
      sourcePlayerId: player.id,
    })
  }

  return [...peopleByKey.values()].sort((left, right) => {
    if (left.isSelf !== right.isSelf) return left.isSelf ? -1 : 1
    return left.displayName.localeCompare(right.displayName, "es", {
      sensitivity: "base",
    })
  })
}

export function publicPersonalMatchPeople(people: PersonalMatchPersonRecord[]) {
  return people.map((person) => ({
    key: person.key,
    displayName: person.displayName,
    avatarUrl: person.avatarUrl,
    sourceLeagueNames: person.sourceLeagueNames,
    isSelf: person.isSelf,
  }))
}

export function resolvePersonalMatchPerson(
  people: PersonalMatchPersonRecord[],
  key: string,
) {
  return people.find((person) => person.key === key) ?? null
}

function mapMatch(
  row: MatchRow,
  participantRows: ParticipantRow[],
  currentUserId: string,
): PersonalMatchItem {
  const participants = sortPersonalMatchParticipants(
    participantRows
      .filter((participant) => participant.match_id === row.id)
      .map(
        (participant): PersonalMatchParticipant => ({
          team: participant.team === 2 ? 2 : 1,
          slot: participant.slot === 2 ? 2 : 1,
          displayName: participant.display_name,
          isCurrentUser: participant.user_id === currentUserId,
        }),
      ),
  )

  return {
    id: row.id,
    playedAt: row.played_at,
    locationName: row.location_name,
    sets: normalizeSets(row.sets),
    participants,
    canDelete: row.created_by_user_id === currentUserId,
  }
}

export async function loadPersonalMatches(actor: AuthenticatedAppUser) {
  const { supabase, user } = actor
  const matchIds: string[] = []
  const pageSize = 1000

  for (let offset = 0; ; offset += pageSize) {
    const participantResult = await supabase
      .from("personal_match_participants")
      .select("match_id")
      .eq("user_id", user.id)
      .order("match_id", { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (participantResult.error) {
      throw new Error("personal_matches_participation_lookup_failed")
    }

    const rows = participantResult.data ?? []
    matchIds.push(
      ...rows.flatMap((participant) =>
        typeof participant.match_id === "string" ? [participant.match_id] : [],
      ),
    )

    if (rows.length < pageSize) break
  }

  const uniqueMatchIds = uniqueStrings(matchIds)
  if (uniqueMatchIds.length === 0) return []

  const matchRows: MatchRow[] = []
  const participantRows: ParticipantRow[] = []
  const chunkSize = 200

  for (let offset = 0; offset < uniqueMatchIds.length; offset += chunkSize) {
    const chunk = uniqueMatchIds.slice(offset, offset + chunkSize)
    const [matchesResult, participantsResult] = await Promise.all([
      supabase
        .from("personal_matches")
        .select("id,created_by_user_id,played_at,location_name,sets")
        .in("id", chunk),
      supabase
        .from("personal_match_participants")
        .select("match_id,team,slot,user_id,source_player_id,display_name")
        .in("match_id", chunk),
    ])

    if (matchesResult.error || participantsResult.error) {
      throw new Error("personal_matches_lookup_failed")
    }

    matchRows.push(...((matchesResult.data ?? []) as MatchRow[]))
    participantRows.push(...((participantsResult.data ?? []) as ParticipantRow[]))
  }

  return matchRows
    .sort(
      (left, right) =>
        Date.parse(right.played_at) - Date.parse(left.played_at),
    )
    .map((row) => mapMatch(row, participantRows, user.id))
}

export async function loadPersonalMatch(
  actor: AuthenticatedAppUser,
  matchId: string,
) {
  const { supabase, user } = actor
  const accessResult = await supabase
    .from("personal_match_participants")
    .select("match_id")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (accessResult.error) {
    throw new Error("personal_match_access_lookup_failed")
  }
  if (!accessResult.data) return null

  const [matchResult, participantsResult] = await Promise.all([
    supabase
      .from("personal_matches")
      .select("id,created_by_user_id,played_at,location_name,sets")
      .eq("id", matchId)
      .maybeSingle(),
    supabase
      .from("personal_match_participants")
      .select("match_id,team,slot,user_id,source_player_id,display_name")
      .eq("match_id", matchId),
  ])

  if (matchResult.error || participantsResult.error) {
    throw new Error("personal_match_lookup_failed")
  }
  if (!matchResult.data) return null

  return mapMatch(
    matchResult.data as MatchRow,
    (participantsResult.data ?? []) as ParticipantRow[],
    user.id,
  )
}
