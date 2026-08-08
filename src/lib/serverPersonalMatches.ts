import "server-only"

import type { AuthenticatedAppUser } from "@/lib/serverAuth"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"
import {
  findLeagueLocationByScheduleLocation,
  getLeagueLocationCompactText,
  getScheduleLocationFallbackText,
  normalizeLeagueLocations,
} from "@/lib/leagueLocations"
import {
  type PersonalMatchItem,
  type PersonalMatchParticipant,
  type PersonalMatchPerson,
  type PersonalMatchSet,
  type PersonalMatchStatus,
  getPersonalMatchEventAt,
  sortPersonalMatchParticipants,
} from "@/lib/personalMatches"

type PersonalMatchPersonRecord = PersonalMatchPerson & {
  userId: string | null
  sourcePlayerId: string | null
}

type PersonalMatchRow = {
  id: string
  created_by_user_id: string | null
  played_at: string
  location_name: string | null
  sets: unknown
  status: string | null
  result_recorded_at: string | null
}

type ParticipantRow = {
  match_id: string
  team: number
  slot: number
  user_id: string | null
  source_player_id: string | null
  display_name: string
}

type HistoryIndexRow = {
  source: string
  match_id: string
  event_at: string | null
}

function isHistoryIndexRow(row: unknown): row is HistoryIndexRow {
  if (!row || typeof row !== "object") return false

  const candidate = row as Partial<HistoryIndexRow>
  return (
    (candidate.source === "friendly" || candidate.source === "league") &&
    typeof candidate.match_id === "string" &&
    (candidate.event_at === null || typeof candidate.event_at === "string")
  )
}

type LeagueMembershipRow = {
  league_id: string
  player_id: string | null
}

type LeagueRow = {
  id: string
  name: string
  locations: unknown
}

type PlayerRow = {
  id: string
  league_id: string
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

function normalizePersonalStatus(value: unknown, sets: PersonalMatchSet[]): PersonalMatchStatus {
  if (value === "scheduled") return "scheduled"
  if (value === "finished") return "finished"
  return sets.length > 0 ? "finished" : "scheduled"
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
    supabase.from("leagues").select("id,name,locations").in("id", leagueIds),
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

function mapPersonalMatch(
  row: PersonalMatchRow,
  participantRows: ParticipantRow[],
  currentUserId: string,
): PersonalMatchItem {
  const sets = normalizeSets(row.sets)
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
  const status = normalizePersonalStatus(row.status, sets)

  return {
    id: row.id,
    origin: "friendly",
    status,
    scheduledAt: row.played_at,
    resultRecordedAt: row.result_recorded_at,
    locationName: row.location_name,
    sets,
    participants,
    canManage: row.created_by_user_id === currentUserId,
    canDelete: row.created_by_user_id === currentUserId,
    leagueId: null,
    leagueName: null,
    seasonId: null,
    round: null,
  }
}

async function loadLeagueMemberships(actor: AuthenticatedAppUser) {
  const result = await actor.supabase
    .from("league_memberships")
    .select("league_id,player_id")
    .eq("user_id", actor.user.id)

  if (result.error) throw new Error("personal_matches_memberships_lookup_failed")

  return (result.data ?? []).filter(
    (row): row is LeagueMembershipRow =>
      typeof row.league_id === "string" &&
      (typeof row.player_id === "string" || row.player_id === null),
  )
}

async function loadPersonalRows(
  actor: AuthenticatedAppUser,
  ids: string[],
) {
  if (ids.length === 0) return [] as PersonalMatchItem[]

  const [matchesResult, participantsResult] = await Promise.all([
    actor.supabase
      .from("personal_matches")
      .select("id,created_by_user_id,played_at,location_name,sets,status,result_recorded_at")
      .in("id", ids),
    actor.supabase
      .from("personal_match_participants")
      .select("match_id,team,slot,user_id,source_player_id,display_name")
      .in("match_id", ids),
  ])

  if (matchesResult.error || participantsResult.error) {
    throw new Error("personal_matches_lookup_failed")
  }

  const rows = (matchesResult.data ?? []) as PersonalMatchRow[]
  const participantRows = (participantsResult.data ?? []) as ParticipantRow[]
  const mappedById = new Map(
    rows.map((row) => [row.id, mapPersonalMatch(row, participantRows, actor.user.id)]),
  )

  return ids.flatMap((id) => {
    const item = mappedById.get(id)
    return item ? [item] : []
  })
}

async function loadLeagueRows(
  actor: AuthenticatedAppUser,
  ids: string[],
  memberships: LeagueMembershipRow[],
) {
  if (ids.length === 0) return [] as PersonalMatchItem[]

  const matchesResult = await actor.supabase
    .from("matches")
    .select(matchSelect)
    .in("id", ids)

  if (matchesResult.error) throw new Error("personal_matches_league_lookup_failed")

  const mappedMatches = (matchesResult.data ?? []).map((row) =>
    mapSupabaseMatch(row as Record<string, unknown>),
  )
  const leagueIds = uniqueStrings(mappedMatches.map((match) => match.leagueId))
  const participantIds = uniqueStrings(
    mappedMatches.flatMap((match) => [...match.teamA, ...match.teamB]),
  )

  const [leaguesResult, playersResult] = await Promise.all([
    leagueIds.length > 0
      ? actor.supabase.from("leagues").select("id,name,locations").in("id", leagueIds)
      : Promise.resolve({ data: [] as LeagueRow[], error: null }),
    participantIds.length > 0
      ? actor.supabase
          .from("players")
          .select("id,league_id,display_name")
          .in("id", participantIds)
      : Promise.resolve({ data: [] as PlayerRow[], error: null }),
  ])

  if (leaguesResult.error || playersResult.error) {
    throw new Error("personal_matches_league_people_lookup_failed")
  }

  const leagueRows = (leaguesResult.data ?? []) as LeagueRow[]
  const leagueNameById = new Map(
    leagueRows.map((league) => [league.id, league.name]),
  )
  const leagueLocationsById = new Map(
    leagueRows.map((league) => [league.id, normalizeLeagueLocations(league.locations)]),
  )
  const playerById = new Map(
    ((playersResult.data ?? []) as PlayerRow[]).map((player) => [player.id, player]),
  )
  const ownPlayerIds = new Set(
    memberships.flatMap((membership) =>
      membership.player_id ? [membership.player_id] : [],
    ),
  )
  const itemById = new Map<string, PersonalMatchItem>()

  for (const match of mappedMatches) {
    const participants: PersonalMatchParticipant[] = [
      ...match.teamA.map((playerId, index) => ({
        team: 1 as const,
        slot: index === 0 ? (1 as const) : (2 as const),
        displayName: playerById.get(playerId)?.display_name ?? "Jugador",
        isCurrentUser: ownPlayerIds.has(playerId),
      })),
      ...match.teamB.map((playerId, index) => ({
        team: 2 as const,
        slot: index === 0 ? (1 as const) : (2 as const),
        displayName: playerById.get(playerId)?.display_name ?? "Jugador",
        isCurrentUser: ownPlayerIds.has(playerId),
      })),
    ]

    const leagueLocations = leagueLocationsById.get(match.leagueId) ?? []
    const matchedLocation = findLeagueLocationByScheduleLocation({
      locations: leagueLocations,
      scheduleLocation: match.location,
    })
    const locationName = matchedLocation
      ? getLeagueLocationCompactText(matchedLocation)
      : getScheduleLocationFallbackText(match.location)

    itemById.set(match.id, {
      id: match.id,
      origin: "league",
      status: match.status === "finished" ? "finished" : "scheduled",
      scheduledAt: match.scheduledAt,
      resultRecordedAt: match.resultRecordedAt,
      locationName,
      sets: match.sets,
      participants: sortPersonalMatchParticipants(participants),
      canManage: false,
      canDelete: false,
      leagueId: match.leagueId,
      leagueName: leagueNameById.get(match.leagueId) ?? "Liga",
      seasonId: match.seasonId,
      round: match.round,
    })
  }

  return ids.flatMap((id) => {
    const item = itemById.get(id)
    return item ? [item] : []
  })
}

async function loadHistoryIndex(
  actor: AuthenticatedAppUser,
  offset: number,
  limit: number,
) {
  const result = await actor.supabase.rpc("server_list_user_match_history", {
    p_user_id: actor.user.id,
    p_limit: limit,
    p_offset: offset,
  })

  if (result.error) throw new Error("personal_matches_history_index_failed")

  return ((result.data ?? []) as unknown[]).filter(isHistoryIndexRow)
}

async function loadUpcomingIndex(actor: AuthenticatedAppUser) {
  const result = await actor.supabase.rpc("server_next_user_matches", {
    p_user_id: actor.user.id,
  })

  if (result.error) throw new Error("personal_matches_upcoming_index_failed")

  return ((result.data ?? []) as unknown[]).filter(isHistoryIndexRow)
}

export async function loadPersonalMatchesDashboard(
  actor: AuthenticatedAppUser,
  options: { offset: number; limit: number; includeUpcoming: boolean },
) {
  const safeOffset = Math.max(0, Math.floor(options.offset))
  const safeLimit = Math.min(50, Math.max(1, Math.floor(options.limit)))
  const [indexRows, memberships, upcomingRows] = await Promise.all([
    loadHistoryIndex(actor, safeOffset, safeLimit + 1),
    loadLeagueMemberships(actor),
    options.includeUpcoming ? loadUpcomingIndex(actor) : Promise.resolve([]),
  ])

  const pageRows = indexRows.slice(0, safeLimit)
  const hasMore = indexRows.length > safeLimit
  const friendlyIds = pageRows
    .filter((row) => row.source === "friendly")
    .map((row) => row.match_id)
  const leagueIds = pageRows
    .filter((row) => row.source === "league")
    .map((row) => row.match_id)
  const upcomingFriendlyIds = upcomingRows
    .filter((row) => row.source === "friendly")
    .map((row) => row.match_id)
  const upcomingLeagueIds = upcomingRows
    .filter((row) => row.source === "league")
    .map((row) => row.match_id)

  const [friendlyItems, leagueItems, upcomingFriendlyItems, upcomingLeagueItems] =
    await Promise.all([
      loadPersonalRows(actor, friendlyIds),
      loadLeagueRows(actor, leagueIds, memberships),
      loadPersonalRows(actor, upcomingFriendlyIds),
      loadLeagueRows(actor, upcomingLeagueIds, memberships),
    ])

  const byKey = new Map<string, PersonalMatchItem>()
  for (const item of [...friendlyItems, ...leagueItems]) {
    byKey.set(`${item.origin}:${item.id}`, item)
  }
  const items = pageRows.flatMap((row) => {
    const item = byKey.get(`${row.source}:${row.match_id}`)
    return item ? [item] : []
  })

  return {
    items,
    hasMore,
    nextOffset: hasMore ? safeOffset + safeLimit : null,
    upcoming: {
      league: upcomingLeagueItems[0] ?? null,
      friendly: upcomingFriendlyItems[0] ?? null,
    },
  }
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

  const items = await loadPersonalRows(actor, [matchId])
  return items[0] ?? null
}

export async function loadManageablePersonalMatch(
  actor: AuthenticatedAppUser,
  matchId: string,
) {
  const { data, error } = await actor.supabase
    .from("personal_matches")
    .select("id,created_by_user_id,played_at,location_name,sets,status,result_recorded_at")
    .eq("id", matchId)
    .maybeSingle()

  if (error) throw new Error("personal_match_lookup_failed")
  if (!data) return null
  if (data.created_by_user_id !== actor.user.id) return "forbidden" as const
  return data as PersonalMatchRow
}

export function sortDashboardItems(items: PersonalMatchItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(getPersonalMatchEventAt(left) ?? "") || 0
    const rightTime = Date.parse(getPersonalMatchEventAt(right) ?? "") || 0
    return rightTime - leftTime
  })
}
