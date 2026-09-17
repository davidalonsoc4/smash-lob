import "server-only"

import {
  calculateBallCustodianAssignment,
  getOpeningRoundBallAllocation,
} from "@/lib/ballCustodianAssignment"
import { getScheduleLocationFallbackText } from "@/lib/leagueLocations"
import { shouldSuppressSeasonMatchNotifications } from "@/lib/preseasonSecrets"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"

type SupabaseClient = NonNullable<ReturnType<typeof createSupabaseServiceClient>>

export type OrganizationBallsSetting = {
  league_id: string
  season_id: string
  organization_balls_assigned: boolean | null
  balls_assignment_priority: string[] | null
  balls_assignment_mode?: string | null
  balls_assignment_custodian_ids?: string[] | null
  opening_round_enabled: boolean | null
  opening_round_at: string | null
  scheduled_start_at?: string | null
  preseason_secret_days_before?: number | null
}

type AssignmentMatch = {
  id: string
  league_id: string
  season_id: string
  round: number
  status: string
  team_a: string[] | null
  team_b: string[] | null
  scheduled_at: string | null
  date_label: string | null
  location: string | null
}

type ActivityRow = {
  match_id: string | null
  type: string
  metadata: Record<string, unknown> | null
}

type PlayerRow = {
  id: string
  display_name: string | null
}

type LeagueRow = {
  id: string
  created_by_user_id: string | null
}

type SeasonStatusRow = {
  id: string
  status: "upcoming" | "active" | "finished"
}

type CreatorMembershipRow = {
  league_id: string
  user_id: string
  player_id: string | null
}

const pageSize = 1000

function toPlayerIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : []
}

async function fetchOrganizationSeasonMatches(
  supabase: SupabaseClient,
  seasonIds: string[],
) {
  const rows: AssignmentMatch[] = []
  const batches: string[][] = []

  for (let index = 0; index < seasonIds.length; index += 100) {
    batches.push(seasonIds.slice(index, index + 100))
  }

  for (const batch of batches) {
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from("matches")
        .select("id,league_id,season_id,round,status,team_a,team_b,scheduled_at,date_label,location")
        .in("season_id", batch)
        .range(offset, offset + pageSize - 1)

      if (error) throw error
      const page = (data ?? []) as AssignmentMatch[]
      rows.push(...page)
      if (page.length < pageSize) break
    }
  }

  return rows
}

async function fetchCustodianActivityRows(
  supabase: SupabaseClient,
  seasonIds: string[],
) {
  const rows: ActivityRow[] = []
  const batches: string[][] = []

  for (let index = 0; index < seasonIds.length; index += 100) {
    batches.push(seasonIds.slice(index, index + 100))
  }

  for (const batch of batches) {
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from("activity_events")
        .select("match_id,type,metadata,created_at")
        .in("season_id", batch)
        .in("type", ["match_ball_custodian_assigned", "match_ball_custodian_reminder"])
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (error) throw error
      const page = (data ?? []) as ActivityRow[]
      rows.push(...page)
      if (page.length < pageSize) break
    }
  }

  return rows
}

async function insertCustodianActivityEvent({
  supabase,
  match,
  type,
  custodianPlayerId,
  now,
}: {
  supabase: SupabaseClient
  match: AssignmentMatch
  type: "match_ball_custodian_assigned" | "match_ball_custodian_reminder"
  custodianPlayerId: string
  now: Date
}) {
  const locationText = getScheduleLocationFallbackText(match.location)
  const isReminder = type === "match_ball_custodian_reminder"
  const title = isReminder ? "Recuerda llevar las bolas" : "Te encargas de las bolas"
  const description = isReminder
    ? `Tu partido de la Jornada ${match.round} es dentro de las próximas dos horas. No olvides llevar los botes de bolas${locationText ? ` a ${locationText}` : ""}.`
    : `Te corresponde llevar los botes de bolas al partido de la Jornada ${match.round}.`

  const { data, error } = await supabase
    .from("activity_events")
    .insert({
      league_id: match.league_id,
      season_id: match.season_id,
      match_id: match.id,
      actor_user_id: null,
      actor_email: "system@smash-lob.local",
      actor_display_name: "Smash & Lob",
      type,
      title,
      description,
      metadata: {
        round: match.round,
        dateLabel: match.date_label,
        scheduledAt: match.scheduled_at,
        location: match.location,
        locationText,
        custodianPlayerId,
        targetPlayerIds: [custodianPlayerId],
        reminderMinutes: isReminder ? 120 : null,
        automatic: true,
        generatedAt: now.toISOString(),
      },
    })
    .select("id")
    .single()

  if (error) throw error
  return String(data.id)
}

export async function runBallCustodianNotificationAutomation({
  supabase,
  settings,
  reminderMatches,
  now,
}: {
  supabase: SupabaseClient
  settings: OrganizationBallsSetting[]
  reminderMatches: AssignmentMatch[]
  now: Date
}) {
  const organizationSettings = settings.filter(
    (setting) => setting.organization_balls_assigned === true,
  )

  if (organizationSettings.length === 0) {
    return { eventIds: [] as string[], custodianByMatchId: {} as Record<string, string> }
  }

  const seasonIds = Array.from(new Set(organizationSettings.map((setting) => setting.season_id)))
  const leagueIds = Array.from(new Set(organizationSettings.map((setting) => setting.league_id)))
  const [seasonMatches, leaguesResult, seasonsResult] = await Promise.all([
    fetchOrganizationSeasonMatches(supabase, seasonIds),
    supabase.from("leagues").select("id,created_by_user_id").in("id", leagueIds),
    supabase.from("seasons").select("id,status").in("id", seasonIds),
  ])

  if (leaguesResult.error) throw leaguesResult.error
  if (seasonsResult.error) throw seasonsResult.error
  const leagues = (leaguesResult.data ?? []) as LeagueRow[]
  const seasonStatusById = new Map(
    ((seasonsResult.data ?? []) as SeasonStatusRow[]).map((season) => [season.id, season.status]),
  )
  const creatorUserIdByLeagueId = new Map(leagues.map((league) => [league.id, league.created_by_user_id]))
  const creatorUserIds = Array.from(
    new Set(leagues.map((league) => league.created_by_user_id).filter((id): id is string => Boolean(id))),
  )
  let creatorPlayerIdByLeagueId = new Map<string, string>()

  if (creatorUserIds.length > 0) {
    const creatorMemberships: CreatorMembershipRow[] = []
    for (let index = 0; index < leagueIds.length; index += 100) {
      const leagueBatch = leagueIds.slice(index, index + 100)
      const userBatch = leagueBatch
        .map((leagueId) => creatorUserIdByLeagueId.get(leagueId))
        .filter((userId): userId is string => Boolean(userId))
      if (userBatch.length === 0) continue
      const { data, error } = await supabase
        .from("league_memberships")
        .select("league_id,user_id,player_id")
        .in("league_id", leagueBatch)
        .in("user_id", userBatch)

      if (error) throw error
      creatorMemberships.push(...((data ?? []) as CreatorMembershipRow[]))
    }

    creatorPlayerIdByLeagueId = new Map(
      creatorMemberships
        .filter((membership) =>
          Boolean(membership.player_id) &&
          creatorUserIdByLeagueId.get(membership.league_id) === membership.user_id,
        )
        .map((membership) => [membership.league_id, membership.player_id as string]),
    )
  }

  const priorityPlayerIds = organizationSettings.flatMap((setting) =>
    Array.isArray(setting.balls_assignment_priority) ? setting.balls_assignment_priority : [],
  )
  const explicitlySelectedPlayerIds = organizationSettings.flatMap((setting) =>
    Array.isArray(setting.balls_assignment_custodian_ids) ? setting.balls_assignment_custodian_ids : [],
  )
  const fixturePlayerIds = seasonMatches.flatMap((match) => [
    ...toPlayerIds(match.team_a),
    ...toPlayerIds(match.team_b),
  ])
  const candidatePlayerIds = Array.from(
    new Set([...priorityPlayerIds, ...explicitlySelectedPlayerIds, ...fixturePlayerIds, ...creatorPlayerIdByLeagueId.values()]),
  )
  const candidatePlayers: PlayerRow[] = []

  if (candidatePlayerIds.length > 0) {
    for (let index = 0; index < candidatePlayerIds.length; index += 500) {
      const { data, error } = await supabase
        .from("players")
        .select("id,display_name")
        .in("id", candidatePlayerIds.slice(index, index + 500))

      if (error) throw error
      candidatePlayers.push(...((data ?? []) as PlayerRow[]))
    }
  }

  const playerById = new Map(candidatePlayers.map((player) => [player.id, player]))
  const matchesBySeasonId = new Map<string, AssignmentMatch[]>()
  seasonMatches.forEach((match) => {
    const rows = matchesBySeasonId.get(match.season_id) ?? []
    rows.push(match)
    matchesBySeasonId.set(match.season_id, rows)
  })

  const custodianByMatchId: Record<string, string> = {}

  for (const setting of organizationSettings) {
    const seasonStatus = seasonStatusById.get(setting.season_id)
    if (
      seasonStatus &&
      shouldSuppressSeasonMatchNotifications({
        status: seasonStatus,
        scheduledStartAt: setting.scheduled_start_at,
        secretDaysBefore: setting.preseason_secret_days_before,
        now: now.getTime(),
      })
    ) {
      continue
    }
    const matches = matchesBySeasonId.get(setting.season_id) ?? []
    const creatorPlayerId = creatorPlayerIdByLeagueId.get(setting.league_id) ?? null
    const seasonPlayerIds = new Set<string>([
      ...(Array.isArray(setting.balls_assignment_priority) ? setting.balls_assignment_priority : []),
      ...(Array.isArray(setting.balls_assignment_custodian_ids) ? setting.balls_assignment_custodian_ids : []),
    ])
    matches.forEach((match) => {
      toPlayerIds(match.team_a).forEach((playerId) => seasonPlayerIds.add(playerId))
      toPlayerIds(match.team_b).forEach((playerId) => seasonPlayerIds.add(playerId))
    })

    const assignmentMatches = matches.map((match) => ({
        id: match.id,
        round: match.round,
        teamA: toPlayerIds(match.team_a),
        teamB: toPlayerIds(match.team_b),
      }))
    const openingRoundBallAllocation = getOpeningRoundBallAllocation(
      assignmentMatches,
      setting.opening_round_enabled && setting.opening_round_at ? creatorPlayerId : null,
    )
    const assignment = calculateBallCustodianAssignment({
      matches: assignmentMatches,
      seasonPlayerIds: Array.from(seasonPlayerIds),
      priorityPlayerIds: setting.balls_assignment_mode === "selected" ? [] : setting.balls_assignment_priority ?? [],
      eligiblePlayerIds:
        setting.balls_assignment_mode === "selected"
          ? setting.balls_assignment_custodian_ids ?? []
          : undefined,
      playerNames: Object.fromEntries(
        Array.from(seasonPlayerIds).map((playerId) => [playerId, playerById.get(playerId)?.display_name ?? playerId]),
      ),
      ...openingRoundBallAllocation,
    })

    Object.assign(custodianByMatchId, assignment.byMatchId)
  }

  const activityRows = await fetchCustodianActivityRows(supabase, seasonIds)
  const latestAssignedPlayerByMatchId = new Map<string, string>()
  const reminderKeys = new Set<string>()

  activityRows.forEach((row) => {
    if (!row.match_id) return
    const metadata = row.metadata ?? {}

    if (row.type === "match_ball_custodian_assigned" && !latestAssignedPlayerByMatchId.has(row.match_id)) {
      const playerId = typeof metadata.custodianPlayerId === "string" ? metadata.custodianPlayerId : ""
      if (playerId) latestAssignedPlayerByMatchId.set(row.match_id, playerId)
    }

    if (
      row.type === "match_ball_custodian_reminder" &&
      typeof metadata.scheduledAt === "string" &&
      Number(metadata.reminderMinutes) === 120
    ) {
      reminderKeys.add(`${row.match_id}|${metadata.scheduledAt}`)
    }
  })

  const eventIds: string[] = []

  for (const match of seasonMatches) {
    if (match.status !== "scheduled" || !match.scheduled_at || Date.parse(match.scheduled_at) <= now.getTime()) continue
    const custodianPlayerId = custodianByMatchId[match.id]
    if (!custodianPlayerId || latestAssignedPlayerByMatchId.get(match.id) === custodianPlayerId) continue
    eventIds.push(await insertCustodianActivityEvent({
      supabase,
      match,
      type: "match_ball_custodian_assigned",
      custodianPlayerId,
      now,
    }))
  }

  for (const match of reminderMatches) {
    if (!match.scheduled_at) continue
    const scheduledTime = Date.parse(match.scheduled_at)
    if (!Number.isFinite(scheduledTime) || scheduledTime <= now.getTime() || scheduledTime > now.getTime() + 2 * 60 * 60 * 1000) continue
    const custodianPlayerId = custodianByMatchId[match.id]
    const reminderKey = `${match.id}|${match.scheduled_at}`
    if (!custodianPlayerId || reminderKeys.has(reminderKey)) continue
    eventIds.push(await insertCustodianActivityEvent({
      supabase,
      match,
      type: "match_ball_custodian_reminder",
      custodianPlayerId,
      now,
    }))
    reminderKeys.add(reminderKey)
  }

  return { eventIds, custodianByMatchId }
}

export async function safelyRunBallCustodianNotificationAutomation(
  input: Parameters<typeof runBallCustodianNotificationAutomation>[0],
) {
  try {
    return await runBallCustodianNotificationAutomation(input)
  } catch {
    return null
  }
}

export function getUpcomingReminderTargets(
  match: Pick<AssignmentMatch, "team_a" | "team_b" | "id">,
  custodianByMatchId: Record<string, string>,
) {
  const participantIds = Array.from(
    new Set([...toPlayerIds(match.team_a), ...toPlayerIds(match.team_b)]),
  )
  const custodianPlayerId = custodianByMatchId[match.id]

  if (!custodianPlayerId) return { participantIds }

  const targetPlayerIds = participantIds.filter((playerId) => playerId !== custodianPlayerId)
  return { participantIds: targetPlayerIds, targetPlayerIds }
}
