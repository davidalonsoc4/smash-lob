import { NextResponse } from "next/server"
import { getLeagueSeasonChatActor } from "@/lib/serverLeagueSeasonChatAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { broadcastLeagueSeasonChatRefresh, getLeagueSeasonChatRealtimeTopic } from "@/lib/serverChatRealtime"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ seasonId: string }> }
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

export async function GET(request: Request, context: Context) {
  const { seasonId } = await context.params
  const access = await getLeagueSeasonChatActor(seasonId)
  if (!access.ok) return fail(access.error, access.status)
  const { supabase, user } = access.actor
  const searchParams = new URL(request.url).searchParams
  const lastReadAt = access.participant.last_read_at
  const summary = { season: access.season, readOnly: access.season.status !== "active", realtimeTopic: getLeagueSeasonChatRealtimeTopic(seasonId) }
  if (searchParams.get("summary") === "1") {
    let unreadQuery = supabase.from("league_season_chat_messages").select("id", { count: "exact", head: true })
      .eq("season_id", seasonId).neq("sender_user_id", user.id)
    if (lastReadAt) unreadQuery = unreadQuery.gt("created_at", lastReadAt)
    const [latest, participants, unread] = await Promise.all([
      supabase.from("league_season_chat_messages").select("sender_display_name,body,created_at")
        .eq("season_id", seasonId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1),
      supabase.from("league_season_chat_participants").select("user_id", { count: "exact", head: true }).eq("season_id", seasonId),
      unreadQuery,
    ])
    if (latest.error || participants.error || unread.error) return fail("league_chat_messages_failed", 500)
    return NextResponse.json({ ...summary, messages: latest.data ?? [], participantCount: participants.count ?? 0, unread: unread.count ?? 0 }, { headers: { "Cache-Control": "private, no-store" } })
  }
  const members = await supabase.from("league_season_chat_participants")
    .select("user_id,player_id,last_read_at").eq("season_id", seasonId)
  if (members.error) return fail("league_chat_participants_failed", 500)
  const memberRows = members.data ?? []
  const memberIds = memberRows.map((member) => member.user_id)
  const profiles = memberIds.length
    ? await supabase.from("app_users").select("id,display_name,avatar_url").in("id", memberIds)
    : { data: [], error: null }
  if (profiles.error) return fail("league_chat_participants_failed", 500)
  const profileById = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]))
  const participants = memberRows.map((member) => {
    const profile = profileById.get(member.user_id)
    return { userId: member.user_id, displayName: profile?.display_name || "Jugador", avatarUrl: profile?.avatar_url ?? null, lastReadAt: member.last_read_at }
  })
  const before = searchParams.get("before")
  if (before && !validateUuid(before)) return fail("invalid_message_cursor", 400)
  let query = supabase.from("league_season_chat_messages")
    .select("id,sender_user_id,sender_display_name,body,created_at")
    .eq("season_id", seasonId)
  if (before) {
    const cursor = await supabase.from("league_season_chat_messages").select("created_at").eq("season_id", seasonId).eq("id", before).maybeSingle()
    if (cursor.error) return fail("league_chat_messages_failed", 500)
    if (!cursor.data) return fail("invalid_message_cursor", 400)
    query = query.or(`created_at.lt.${cursor.data.created_at},and(created_at.eq.${cursor.data.created_at},id.lt.${before})`)
  }
  const result = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(201)
  if (result.error) return fail("league_chat_messages_failed", 500)
  const rows = result.data ?? []
  const hasMore = rows.length > 200
  const messages = rows.slice(0, 200).reverse()
  const unread = messages.filter((message) => message.sender_user_id !== user.id && (!lastReadAt || message.created_at > lastReadAt)).length
  if (!before && searchParams.get("markRead") !== "0") {
    const lastRead = messages.at(-1)?.created_at
    if (lastRead && (!lastReadAt || lastRead > lastReadAt)) {
      const read = await supabase.from("league_season_chat_participants")
        .update({ last_read_at: lastRead }).eq("season_id", seasonId).eq("user_id", user.id)
      if (read.error) return fail("league_chat_read_failed", 500)
      await broadcastLeagueSeasonChatRefresh(access.season.league_id, seasonId)
    }
  }
  return NextResponse.json({ ...summary, messages, participants, me: user.id, unread, hasMore }, { headers: { "Cache-Control": "private, no-store" } })
}

export async function POST(request: Request, context: Context) {
  const { seasonId } = await context.params
  const access = await getLeagueSeasonChatActor(seasonId)
  if (!access.ok) return fail(access.error, access.status)
  const input = await parseJsonBody<{ body?: unknown }>(request)
  const body = typeof input?.body === "string" ? input.body.trim() : ""
  if (!body || body.length > 2000) return fail("invalid_message", 400)
  const { supabase, user } = access.actor
  const recent = await supabase.from("league_season_chat_messages").select("id", { count: "exact", head: true })
    .eq("sender_user_id", user.id).gte("created_at", new Date(Date.now() - 10_000).toISOString())
  if (recent.error) return fail("league_chat_write_failed", 500)
  if ((recent.count ?? 0) >= 8) return fail("league_chat_rate_limited", 429)
  const result = await supabase.rpc("send_league_season_chat_message", {
    p_season_id: seasonId, p_user_id: user.id,
    p_sender_display_name: user.displayName || user.email.split("@")[0], p_body: body,
  })
  if (result.error) {
    if (result.error.message.includes("season_chat_read_only")) return fail("league_chat_read_only", 409)
    if (result.error.message.includes("season_chat_forbidden")) return fail("league_chat_not_found", 404)
    return fail("league_chat_write_failed", 500)
  }
  await broadcastLeagueSeasonChatRefresh(access.season.league_id, seasonId)
  return NextResponse.json({ message: result.data }, { status: 201 })
}
