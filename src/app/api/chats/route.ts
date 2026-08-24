import { NextResponse } from "next/server"
import { buildMatchChatCoordination } from "@/lib/matchChatCoordination"
import { isMatchChatReadOnly } from "@/lib/matchChatWindow"
import { getEffectiveRevealedThroughRound } from "@/lib/progressiveCalendar"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { getChatOverviewRealtimeTopic } from "@/lib/serverChatRealtime"
import { validateUuid } from "@/lib/serverRequest"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

type ChatMessageRow = {
  id: string
  match_id: string
  sender_user_id: string
  sender_display_name: string
  body: string
  kind: string
  payload: unknown
  created_at: string
}

type MatchRow = Record<string, unknown> & {
  id: unknown
  round: unknown
  status: unknown
  team_a: unknown
  team_b: unknown
  scheduled_at: unknown
  date_label: unknown
  result_recorded_at: unknown
}

const playerIds = (value: unknown) =>
  (Array.isArray(value) ? value : []).filter((id): id is string => typeof id === "string")

export async function GET(request: Request) {
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return fail(auth.error, auth.status)

  const searchParams = new URL(request.url).searchParams
  const leagueId = searchParams.get("leagueId") ?? ""
  const seasonId = searchParams.get("seasonId") ?? ""
  if (!validateUuid(leagueId)) return fail("invalid_league_id", 400)
  if (!validateUuid(seasonId)) return fail("invalid_season_id", 400)

  const { supabase: db, user } = auth.actor
  const [membershipResult, seasonResult, settingsResult, matchesResult] = await Promise.all([
    db
      .from("league_memberships")
      .select("player_id,role,experience_mode")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .maybeSingle(),
    db.from("seasons").select("status,total_rounds").eq("id", seasonId).eq("league_id", leagueId).maybeSingle(),
    db
      .from("season_settings")
      .select("calendar_visibility_mode,revealed_through_round,round_window_mode,season_starts_at,round_window_days,opening_round_enabled,opening_round_at")
      .eq("season_id", seasonId)
      .eq("league_id", leagueId)
      .maybeSingle(),
    db.from("matches").select(matchSelect).eq("league_id", leagueId).eq("season_id", seasonId).order("round", { ascending: true }),
  ])

  if (membershipResult.error) return fail("chat_membership_lookup_failed", 500)
  if (seasonResult.error || settingsResult.error || matchesResult.error) {
    return fail("chat_matches_lookup_failed", 500)
  }

  const membership = membershipResult.data
  const playerId = typeof membership?.player_id === "string" ? membership.player_id : null
  if (!playerId) {
    return NextResponse.json({ chats: [], totalUnread: 0, realtimeTopic: null })
  }

  const experienceMode =
    membership?.experience_mode === "player" || membership?.experience_mode === "player_experience"
      ? membership.experience_mode
      : "admin"
  const membershipIsAdmin = membership?.role === "creator" || membership?.role === "admin"
  const competitionAdmin = user.isSuperuser
    ? experienceMode === "admin"
    : membershipIsAdmin && experienceMode === "admin"
  const seasonStatus =
    seasonResult.data?.status === "finished"
      ? "finished"
      : seasonResult.data?.status === "active"
        ? "active"
        : "upcoming"

  if (!competitionAdmin && seasonStatus === "upcoming") {
    return NextResponse.json({
      chats: [],
      totalUnread: 0,
      realtimeTopic: getChatOverviewRealtimeTopic(leagueId, seasonId),
    })
  }

  const allMatchRows = (matchesResult.data ?? []) as MatchRow[]
  let visibleMatchRows = allMatchRows
  if (
    !competitionAdmin &&
    settingsResult.data?.calendar_visibility_mode === "progressive"
  ) {
    const revealedThrough = getEffectiveRevealedThroughRound({
      seasonStatus,
      totalRounds: Number(seasonResult.data?.total_rounds) || 0,
      settings: {
        calendarVisibilityMode: "progressive",
        revealedThroughRound:
          typeof settingsResult.data.revealed_through_round === "number"
            ? settingsResult.data.revealed_through_round
            : 0,
        roundWindowMode:
          settingsResult.data.round_window_mode === "fixed-days" ? "fixed-days" : "none",
        seasonStartsAt:
          typeof settingsResult.data.season_starts_at === "string"
            ? settingsResult.data.season_starts_at
            : null,
        roundWindowDays:
          typeof settingsResult.data.round_window_days === "number"
            ? settingsResult.data.round_window_days
            : null,
        openingRoundEnabled: settingsResult.data.opening_round_enabled === true,
        openingRoundAt:
          typeof settingsResult.data.opening_round_at === "string"
            ? settingsResult.data.opening_round_at
            : null,
      },
      matches: allMatchRows.map((match) => mapSupabaseMatch(match)),
    })
    visibleMatchRows = allMatchRows.filter((match) => Number(match.round) <= revealedThrough)
  }

  const matchRows = visibleMatchRows.filter((match) => {
    const teamA = playerIds(match.team_a)
    const teamB = playerIds(match.team_b)
    return teamA.includes(playerId) || teamB.includes(playerId)
  })
  const matchIds = matchRows.map((match) => String(match.id))
  if (!matchIds.length) {
    return NextResponse.json({
      chats: [],
      totalUnread: 0,
      realtimeTopic: getChatOverviewRealtimeTopic(leagueId, seasonId),
    })
  }

  const allPlayerIds = Array.from(
    new Set(matchRows.flatMap((match) => [...playerIds(match.team_a), ...playerIds(match.team_b)])),
  )
  const [messagesResult, readsResult, playersResult, membershipsResult] = await Promise.all([
    db
      .from("match_chat_messages")
      .select("id,match_id,sender_user_id,sender_display_name,body,kind,payload,created_at")
      .in("match_id", matchIds)
      .order("created_at", { ascending: false })
      .limit(1200),
    db.from("match_chat_reads").select("match_id,last_read_at").eq("user_id", user.id).in("match_id", matchIds),
    allPlayerIds.length
      ? db.from("players").select("id,display_name").in("id", allPlayerIds)
      : Promise.resolve({ data: [], error: null }),
    allPlayerIds.length
      ? db.from("league_memberships").select("player_id,user_id").eq("league_id", leagueId).in("player_id", allPlayerIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (messagesResult.error || readsResult.error || playersResult.error || membershipsResult.error) {
    return fail("chat_overview_lookup_failed", 500)
  }

  const proposalIds = (messagesResult.data ?? [])
    .filter((row) => row.kind === "date_proposal" || row.kind === "location_proposal")
    .map((row) => String(row.id))
  const responsesResult = proposalIds.length
    ? await db
        .from("match_chat_proposal_responses")
        .select("message_id,user_id,option_key,response")
        .in("message_id", proposalIds)
    : { data: [], error: null }
  if (responsesResult.error) return fail("chat_overview_coordination_lookup_failed", 500)

  const readByMatch = new Map(
    (readsResult.data ?? []).map((row) => [String(row.match_id), String(row.last_read_at)]),
  )
  const playerNames = new Map(
    (playersResult.data ?? []).map((row) => [String(row.id), String(row.display_name ?? "Jugador")]),
  )
  const userByPlayer = new Map(
    (membershipsResult.data ?? []).map((row) => [
      String(row.player_id),
      typeof row.user_id === "string" ? row.user_id : null,
    ]),
  )
  const messagesByMatch = new Map<string, ChatMessageRow[]>()
  const responsesByMessage = new Map<
    string,
    Array<{ userId: string; optionKey: string; response: string }>
  >()
  for (const raw of messagesResult.data ?? []) {
    const message = raw as ChatMessageRow
    const list = messagesByMatch.get(message.match_id) ?? []
    list.push(message)
    messagesByMatch.set(message.match_id, list)
  }
  for (const row of responsesResult.data ?? []) {
    const id = String(row.message_id)
    const list = responsesByMessage.get(id) ?? []
    list.push({
      userId: String(row.user_id),
      optionKey: String(row.option_key),
      response: String(row.response),
    })
    responsesByMessage.set(id, list)
  }

  const name = (id: string) => playerNames.get(id) ?? "Jugador"
  const chats = matchRows
    .map((match) => {
      const id = String(match.id)
      const teamA = playerIds(match.team_a)
      const teamB = playerIds(match.team_b)
      const ownTeam = teamA.includes(playerId) ? teamA : teamB
      const rivalTeam = teamA.includes(playerId) ? teamB : teamA
      const partnerId = ownTeam.find((candidate) => candidate !== playerId) ?? null
      const messages = messagesByMatch.get(id) ?? []
      const last = messages[0] ?? null
      const lastRead = readByMatch.get(id) ?? null
      const unread = messages.filter(
        (message) =>
          message.sender_user_id !== user.id &&
          (!lastRead || Date.parse(message.created_at) > Date.parse(lastRead)),
      ).length
      const coordination =
        String(match.status) === "scheduling"
          ? buildMatchChatCoordination({
              matchStatus: String(match.status),
              participants: [...teamA, ...teamB].map((participantId) => ({
                userId: userByPlayer.get(participantId) ?? null,
              })),
              messages: messages
                .filter(
                  (message) =>
                    message.kind === "date_proposal" || message.kind === "location_proposal",
                )
                .map((message) => ({
                  id: message.id,
                  kind: message.kind,
                  payload: message.payload,
                  responses: responsesByMessage.get(message.id) ?? [],
                })),
            })
          : null
      const coordinationStatus =
        coordination?.status === "coordinating" || coordination?.status === "awaiting_booking"
          ? coordination.status
          : null
      return {
        id,
        round: Number(match.round),
        status: String(match.status),
        coordinationStatus,
        scheduledAt: typeof match.scheduled_at === "string" ? match.scheduled_at : null,
        dateLabel: typeof match.date_label === "string" ? match.date_label : null,
        readOnly: isMatchChatReadOnly({
          status: String(match.status),
          resultRecordedAt:
            typeof match.result_recorded_at === "string" ? match.result_recorded_at : null,
        }),
        partner: partnerId ? name(partnerId) : "Pareja",
        rivals: rivalTeam.map(name),
        unread,
        lastMessage: last
          ? {
              sender: last.sender_user_id === user.id ? "Yo" : last.sender_display_name,
              body: last.body,
              createdAt: last.created_at,
            }
          : null,
      }
    })
    .sort((a, b) => {
      const at = Date.parse(a.lastMessage?.createdAt ?? "") || 0
      const bt = Date.parse(b.lastMessage?.createdAt ?? "") || 0
      if (at || bt) return at && bt ? bt - at || a.round - b.round : at ? -1 : 1
      return a.round - b.round
    })

  return NextResponse.json({
    chats,
    totalUnread: chats.reduce((sum, chat) => sum + chat.unread, 0),
    realtimeTopic: getChatOverviewRealtimeTopic(leagueId, seasonId),
  })
}
