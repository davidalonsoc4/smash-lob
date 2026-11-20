import { NextResponse } from "next/server"
import { CHAT_LIST_ACCOUNT_HEADER } from "@/lib/chatListMemory"
import { shouldAnnounceRead } from "@/lib/chatReadReceipts"
import { getLeagueChatMediaKindFromPath, isLeagueChatMediaPathForSeason } from "@/lib/leagueChatMedia"
import { LEAGUE_CHAT_MEDIA_BUCKET } from "@/lib/leagueChatMedia"
import { canAnnounceInLeagueChat, canPublishLeagueChatMedia, leagueChatMediaExists } from "@/lib/serverLeagueChatMedia"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { notifyLeagueChatAnnouncement } from "@/lib/serverLeagueChatAnnouncement"
import { sendLeagueSystemText } from "@/lib/serverLeagueChatSystemMessage"
import { LEAGUE_CHAT_MESSAGE_FIELDS, shapeLeagueChatMessages, type LeagueChatMessageRow } from "@/lib/serverLeagueChatMessages"
import { getLeagueSeasonChatActor } from "@/lib/serverLeagueSeasonChatAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { broadcastLeagueSeasonChatRefresh, broadcastLeagueSeasonReadReceipt, getLeagueSeasonChatRealtimeTopic } from "@/lib/serverChatRealtime"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ seasonId: string }> }
const messageFields = LEAGUE_CHAT_MESSAGE_FIELDS
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

export async function GET(request: Request, context: Context) {
  const { seasonId } = await context.params
  const access = await getLeagueSeasonChatActor(seasonId)
  if (!access.ok) return fail(access.error, access.status)
  const { supabase, user } = access.actor
  const account = request.headers.get(CHAT_LIST_ACCOUNT_HEADER)
  if (account !== null && account !== encodeURIComponent(user.email)) return fail("session_changed", 403)
  const searchParams = new URL(request.url).searchParams
  const lastReadAt = access.participant.last_read_at
  const summary = { season: access.season, readOnly: access.season.status !== "active" && access.season.status !== "upcoming", realtimeTopic: getLeagueSeasonChatRealtimeTopic(seasonId) }
  const messageId = searchParams.get("messageId")
  if (messageId !== null) {
    if (!validateUuid(messageId)) return fail("invalid_message_id", 400)
    const result = await supabase.from("league_season_chat_messages").select(messageFields)
      .eq("season_id", seasonId).eq("id", messageId).maybeSingle()
    if (result.error) return fail("league_chat_messages_failed", 500)
    if (!result.data) return fail("league_chat_message_not_found", 404)
    const [shaped] = (await shapeLeagueChatMessages(access.actor, seasonId, [result.data as LeagueChatMessageRow])) ?? []
    if (!shaped) return fail("league_chat_messages_failed", 500)
    return NextResponse.json({ message: shaped }, { headers: { "Cache-Control": "private, no-store" } })
  }
  if (searchParams.get("summary") === "1") {
    let unreadQuery = supabase.from("league_season_chat_messages").select("id", { count: "exact", head: true })
      .eq("season_id", seasonId).neq("sender_user_id", user.id).is("deleted_at", null)
    if (lastReadAt) unreadQuery = unreadQuery.gt("created_at", lastReadAt)
    const [latest, participants, unread] = await Promise.all([
      supabase.from("league_season_chat_messages").select("sender_display_name,body,created_at,media_kind,is_announcement")
        .eq("season_id", seasonId).is("deleted_at", null).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1),
      supabase.from("league_season_chat_participants").select("user_id", { count: "exact", head: true }).eq("season_id", seasonId),
      unreadQuery,
    ])
    if (latest.error || participants.error || unread.error) return fail("league_chat_messages_failed", 500)
    // A photo or video without text shows its kind in the chat list.
    const preview = (latest.data ?? []).map(({ media_kind, is_announcement, ...row }) => {
      const text = row.body || (media_kind === "video" ? "Vídeo" : media_kind === "image" ? "Foto" : "")
      return { ...row, body: is_announcement ? `Novedad: ${text}` : text }
    })
    return NextResponse.json({ ...summary, messages: preview, participantCount: participants.count ?? 0, unread: unread.count ?? 0 }, { headers: { "Cache-Control": "private, no-store" } })
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
  // Roles only decorate the participant list; a failure here must not break the chat.
  const roles = memberIds.length
    ? await supabase.from("league_memberships").select("user_id,role").eq("league_id", access.season.league_id).in("user_id", memberIds)
    : { data: [], error: null }
  const roleByUser = new Map((roles.error ? [] : roles.data ?? []).map((item) => [item.user_id as string, item.role as string]))
  const participants = memberRows.map((member) => {
    const profile = profileById.get(member.user_id)
    const role = roleByUser.get(member.user_id)
    return { userId: member.user_id, playerId: member.player_id ?? null, role: role === "creator" || role === "admin" ? role : null, displayName: profile?.display_name || "Jugador", avatarUrl: profile?.avatar_url ?? null, lastReadAt: member.last_read_at }
  })
  const pageSize = searchParams.get("preview") === "1" ? 20 : 200
  const before = searchParams.get("before")
  if (before && !validateUuid(before)) return fail("invalid_message_cursor", 400)
  let query = supabase.from("league_season_chat_messages")
    .select(messageFields)
    .eq("season_id", seasonId)
  if (before) {
    const cursor = await supabase.from("league_season_chat_messages").select("created_at").eq("season_id", seasonId).eq("id", before).maybeSingle()
    if (cursor.error) return fail("league_chat_messages_failed", 500)
    if (!cursor.data) return fail("invalid_message_cursor", 400)
    query = query.or(`created_at.lt.${cursor.data.created_at},and(created_at.eq.${cursor.data.created_at},id.lt.${before})`)
  }
  const result = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(pageSize + 1)
  if (result.error) return fail("league_chat_messages_failed", 500)
  const rows = result.data ?? []
  const hasMore = rows.length > pageSize
  const messages = await shapeLeagueChatMessages(access.actor, seasonId, rows.slice(0, pageSize).reverse() as LeagueChatMessageRow[])
  if (!messages) return fail("league_chat_media_failed", 500)
  const canPublishMedia = await canPublishLeagueChatMedia(access.actor, access.season.league_id)
  if (canPublishMedia === null) return fail("league_chat_access_failed", 500)
  const canAnnounce = await canAnnounceInLeagueChat(access.actor, access.season.league_id)
  if (canAnnounce === null) return fail("league_chat_access_failed", 500)
  const unread = messages.filter((message) => !message.deleted_at && message.sender_user_id !== user.id && (!lastReadAt || message.created_at > lastReadAt)).length
  if (pageSize === 200 && !before && searchParams.get("markRead") !== "0") {
    const lastRead = messages.at(-1)?.created_at
    if (lastRead && (!lastReadAt || lastRead > lastReadAt)) {
      const read = await supabase.from("league_season_chat_participants")
        .update({ last_read_at: lastRead }).eq("season_id", seasonId).eq("user_id", user.id)
      if (read.error) return fail("league_chat_read_failed", 500)
      // Read receipts only exist inside the thread, so announce the read there (not on the overview topic,
      // which every member listens to and answers with a full chat-list request), and only every few
      // readers. Members who did not read the previous message are offline, not "pending": counting them
      // would stop the last active reader from announcing, so the final receipts would never be broadcast.
      const previousCreatedAt = messages.at(-2)?.created_at
      const pendingReaders = previousCreatedAt
        ? memberRows.filter((member) => member.user_id !== user.id && member.last_read_at && member.last_read_at >= previousCreatedAt && member.last_read_at < lastRead).length
        : 0
      if (shouldAnnounceRead(pendingReaders)) await broadcastLeagueSeasonReadReceipt(seasonId)
    }
  }
  return NextResponse.json({ ...summary, messages, participants, me: user.id, unread, hasMore, canPublishMedia, canAnnounce }, { headers: { "Cache-Control": "private, no-store" } })
}

export async function POST(request: Request, context: Context) {
  const { seasonId } = await context.params
  const access = await getLeagueSeasonChatActor(seasonId)
  if (!access.ok) return fail(access.error, access.status)
  const input = await parseJsonBody<{ body?: unknown; mediaPath?: unknown; replyToId?: unknown; announcement?: unknown; asLeague?: unknown; posterPath?: unknown; mediaWidth?: unknown; mediaHeight?: unknown; mediaDurationMs?: unknown; poll?: unknown }>(request)
  const body = typeof input?.body === "string" ? input.body.trim() : ""
  const pollInput = input?.poll && typeof input.poll === "object" ? (input.poll as { options?: unknown }) : null
  const pollOptions = pollInput && Array.isArray(pollInput.options) ? pollInput.options.filter((option): option is string => typeof option === "string") : null
  const hasMedia = input?.mediaPath !== undefined && input.mediaPath !== null
  // A photo or video may go without text; a text message may not.
  if (pollInput && (!pollOptions || pollOptions.length !== (pollInput.options as unknown[]).length || !body || body.length > 300 || hasMedia)) return fail("invalid_poll", 400)
  if ((!body && !hasMedia) || body.length > 2000) return fail("invalid_message", 400)
  const replyToId = input?.replyToId === undefined || input.replyToId === null ? null : validateUuid(input.replyToId)
  if (input?.replyToId !== undefined && input.replyToId !== null && !replyToId) return fail("invalid_reply", 400)
  const { supabase, user } = access.actor
  const isAnnouncement = input?.announcement === true
  if (pollOptions) {
    // Polls are created by the same people who can post announcements; cap them so a slip cannot flood the chat.
    const allowedToPoll = await canAnnounceInLeagueChat(access.actor, access.season.league_id)
    if (allowedToPoll === null) return fail("league_chat_access_failed", 500)
    if (!allowedToPoll) return fail("league_chat_poll_forbidden", 403)
    const recentPolls = await supabase.from("league_season_chat_messages").select("id", { count: "exact", head: true })
      .eq("season_id", seasonId).eq("sender_user_id", user.id).eq("has_poll", true)
      .gte("created_at", new Date(Date.now() - 3_600_000).toISOString())
    if (recentPolls.error) return fail("league_chat_write_failed", 500)
    if ((recentPolls.count ?? 0) >= 10) return fail("league_chat_rate_limited", 429)
  }
  if (isAnnouncement) {
    const allowed = await canAnnounceInLeagueChat(access.actor, access.season.league_id)
    if (allowed === null) return fail("league_chat_access_failed", 500)
    if (!allowed) return fail("league_chat_announcement_forbidden", 403)
    // Every Novedad pushes a notification to the whole chat, so cap how many can go out per hour.
    const recentAnnouncements = await supabase.from("league_season_chat_messages").select("id", { count: "exact", head: true })
      .eq("season_id", seasonId).eq("sender_user_id", user.id).eq("is_announcement", true)
      .gte("created_at", new Date(Date.now() - 3_600_000).toISOString())
    if (recentAnnouncements.error) return fail("league_chat_write_failed", 500)
    if ((recentAnnouncements.count ?? 0) >= 5) return fail("league_chat_rate_limited", 429)
  }
  if (input?.asLeague === true) {
    // Signed by the league itself, by the creator or an administrator: text only, a Novedad or a normal message.
    if (hasMedia || pollOptions || replyToId) return fail("invalid_message", 400)
    if (!isAnnouncement) {
      const allowedAsLeague = await canAnnounceInLeagueChat(access.actor, access.season.league_id)
      if (allowedAsLeague === null) return fail("league_chat_access_failed", 500)
      if (!allowedAsLeague) return fail("league_chat_announcement_forbidden", 403)
    }
    const sentAsLeague = await sendLeagueSystemText({ supabase, leagueId: access.season.league_id, seasonId, body, announcement: isAnnouncement })
    if (!sentAsLeague.ok) return fail(sentAsLeague.error, sentAsLeague.status)
    await broadcastLeagueSeasonChatRefresh(access.season.league_id, seasonId)
    if (isAnnouncement) await notifyLeagueChatAnnouncement({ supabase, user, leagueId: access.season.league_id, seasonId, messageId: sentAsLeague.row.id, body })
    else await notifyChatMessage({ access, seasonId, messageId: sentAsLeague.row.id, preview: body })
    const [shaped] = (await shapeLeagueChatMessages(access.actor, seasonId, [sentAsLeague.row as LeagueChatMessageRow])) ?? []
    return NextResponse.json({ message: shaped ?? null }, { status: 201 })
  }
  // Per user (not per IP: a whole club may share one Wi-Fi). Far above normal chatting; it only stops loops and abuse.
  const recentMessages = await supabase.from("league_season_chat_messages").select("id", { count: "exact", head: true })
    .eq("season_id", seasonId).eq("sender_user_id", user.id)
    .gte("created_at", new Date(Date.now() - 60_000).toISOString())
  if (recentMessages.error) return fail("league_chat_write_failed", 500)
  if ((recentMessages.count ?? 0) >= 30) return fail("league_chat_rate_limited", 429)
  const mediaPath = input?.mediaPath
  if (mediaPath !== undefined && mediaPath !== null) {
    if (!isLeagueChatMediaPathForSeason(mediaPath, seasonId)) return fail("invalid_media", 400)
    const allowed = await canPublishLeagueChatMedia(access.actor, access.season.league_id)
    if (allowed === null) return fail("league_chat_access_failed", 500)
    if (!allowed) return fail("league_chat_media_forbidden", 403)
    if (!(await leagueChatMediaExists(access.actor, mediaPath as string))) return fail("invalid_media", 400)
  }
  // Thumbnail and measures are optional and only describe the media: reject anything out of range.
  const posterPath = input?.posterPath === undefined || input.posterPath === null ? null : input.posterPath
  if (posterPath !== null) {
    if (typeof mediaPath !== "string" || !isLeagueChatMediaPathForSeason(posterPath, seasonId)) return fail("invalid_media", 400)
    if (!(await leagueChatMediaExists(access.actor, posterPath as string))) return fail("invalid_media", 400)
  }
  const measure = (value: unknown, max: number, min = 1) => (typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : null)
  const mediaWidth = measure(input?.mediaWidth, 20000)
  const mediaHeight = measure(input?.mediaHeight, 20000)
  const mediaDurationMs = measure(input?.mediaDurationMs, 3_600_000, 0)
  const recent = await supabase.from("league_season_chat_messages").select("id", { count: "exact", head: true })
    .eq("sender_user_id", user.id).gte("created_at", new Date(Date.now() - 10_000).toISOString())
  if (recent.error) return fail("league_chat_write_failed", 500)
  if ((recent.count ?? 0) >= 8) return fail("league_chat_rate_limited", 429)
  const sender = user.displayName || user.email.split("@")[0]
  const result = pollOptions
    ? await supabase.rpc("send_league_season_chat_poll", {
        p_season_id: seasonId, p_user_id: user.id, p_sender_display_name: sender, p_question: body, p_options: pollOptions,
      })
    : typeof mediaPath === "string"
    ? await supabase.rpc("send_league_season_chat_media_message", {
        p_season_id: seasonId, p_user_id: user.id, p_sender_display_name: sender, p_body: body,
        p_media_kind: getLeagueChatMediaKindFromPath(mediaPath), p_media_path: mediaPath, p_reply_to_id: replyToId,
        p_is_announcement: isAnnouncement,
        p_poster_path: posterPath, p_width: mediaWidth, p_height: mediaHeight, p_duration_ms: mediaDurationMs,
      })
    : await supabase.rpc("send_league_season_chat_message", {
        p_season_id: seasonId, p_user_id: user.id, p_sender_display_name: sender, p_body: body, p_reply_to_id: replyToId,
        p_is_announcement: isAnnouncement,
      })
  if (result.error) {
    if (result.error.message.includes("season_chat_read_only")) return fail("league_chat_read_only", 409)
    if (result.error.message.includes("season_chat_poll_forbidden")) return fail("league_chat_poll_forbidden", 403)
    if (result.error.message.includes("season_chat_invalid_poll")) return fail("invalid_poll", 400)
    if (result.error.message.includes("season_chat_announcement_forbidden")) return fail("league_chat_announcement_forbidden", 403)
    if (result.error.message.includes("season_chat_media_forbidden")) return fail("league_chat_media_forbidden", 403)
    if (result.error.message.includes("season_chat_invalid_reply")) return fail("invalid_reply", 400)
    if (result.error.message.includes("season_chat_invalid")) return fail("invalid_media", 400)
    if (result.error.message.includes("season_chat_forbidden")) return fail("league_chat_not_found", 404)
    return fail("league_chat_write_failed", 500)
  }
  await broadcastLeagueSeasonChatRefresh(access.season.league_id, seasonId)
  const sentRow = result.data as LeagueChatMessageRow
  if (isAnnouncement) await notifyLeagueChatAnnouncement({ supabase, user, leagueId: access.season.league_id, seasonId, messageId: sentRow.id, body })
  else await notifyChatMessage({ access, seasonId, messageId: sentRow.id, preview: sentRow.has_poll ? `Encuesta: ${body}` : body || (sentRow.media_kind === "video" ? "Vídeo" : sentRow.media_kind === "image" ? "Foto" : "") })
  const [message] = (await shapeLeagueChatMessages(access.actor, seasonId, [result.data as LeagueChatMessageRow])) ?? []
  return NextResponse.json({ message: message ?? null }, { status: 201 })
}

/**
 * A normal message notifies the other participants exactly like the chat of a match: one "chat" notification per
 * conversation, it follows each person's "Chat" preference and the league's settings, and it stays silent when the
 * conversation is open on screen. The message is already saved if this fails.
 */
async function notifyChatMessage({ access, seasonId, messageId, preview }: {
  access: Extract<Awaited<ReturnType<typeof getLeagueSeasonChatActor>>, { ok: true }>
  seasonId: string
  messageId: string
  preview: string
}) {
  const { supabase, user } = access.actor
  try {
    const [participants, league] = await Promise.all([
      supabase.from("league_season_chat_participants").select("user_id,player_id").eq("season_id", seasonId),
      supabase.from("leagues").select("name").eq("id", access.season.league_id).maybeSingle(),
    ])
    const rows = participants.data ?? []
    await recordServerActorActivity({
      supabase, user, membership: null,
      leagueId: access.season.league_id,
      seasonId,
      type: "league_chat_message",
      title: `Chat · ${league.data?.name ?? "Liga"}`,
      description: null,
      metadata: {
        messageId,
        messagePreview: preview.slice(0, 200),
        targetUserIds: rows.map((row) => row.user_id),
        targetPlayerIds: rows.flatMap((row) => (row.player_id ? [row.player_id] : [])),
      },
    })
  } catch {
    // Delivery problems must not lose the message itself.
  }
}

export async function PATCH(request: Request, context: Context) {
  const { seasonId } = await context.params
  const access = await getLeagueSeasonChatActor(seasonId)
  if (!access.ok) return fail(access.error, access.status)
  const { supabase, user } = access.actor
  if (request.headers.get(CHAT_LIST_ACCOUNT_HEADER) !== encodeURIComponent(user.email)) return fail("session_changed", 403)
  if (access.season.status !== "active" && access.season.status !== "upcoming") return fail("league_chat_read_only", 409)
  const input = await parseJsonBody<{ messageId?: unknown; body?: unknown }>(request)
  if (typeof input?.messageId !== "string" || !validateUuid(input.messageId)) return fail("invalid_message_id", 400)
  const body = typeof input.body === "string" ? input.body.trim() : input.body
  if (body !== null && (typeof body !== "string" || body.length > 2000)) return fail("invalid_message", 400)
  if (body === "") {
    // An empty text is only valid for a photo or video; a text message must keep its text.
    const target = await supabase.from("league_season_chat_messages").select("media_path")
      .eq("season_id", seasonId).eq("id", input.messageId).eq("sender_user_id", user.id).maybeSingle()
    if (target.error) return fail("league_chat_messages_failed", 500)
    if (!target.data?.media_path) return fail("invalid_message", 400)
  }
  const result = await supabase.rpc("change_league_season_chat_message", {
    p_season_id: seasonId, p_user_id: user.id, p_message_id: input.messageId, p_body: body,
  })
  if (result.error) {
    if (result.error.message.includes("season_chat_read_only")) return fail("league_chat_read_only", 409)
    if (result.error.message.includes("season_chat_forbidden")) return fail("league_chat_not_found", 404)
    if (result.error.message.includes("season_chat_message_not_found")) return fail("league_chat_message_not_found", 404)
    if (result.error.message.includes("season_chat_change_expired")) return fail("league_chat_change_expired", 409)
    if (result.error.message.includes("season_chat_poll_not_editable")) return fail("league_chat_poll_not_editable", 409)
    if (result.error.code === "23514") return fail("invalid_message", 400)
    return fail("league_chat_write_failed", 500)
  }
  const changed = result.data as LeagueChatMessageRow
  // A deleted message must not keep its photo or video in storage.
  if (changed.deleted_at && changed.media_path) {
    await supabase.storage.from(LEAGUE_CHAT_MEDIA_BUCKET).remove([changed.media_path, ...(changed.media_poster_path ? [changed.media_poster_path] : [])]).catch(() => null)
  }
  await broadcastLeagueSeasonChatRefresh(access.season.league_id, seasonId, input.messageId)
  const [message] = (await shapeLeagueChatMessages(access.actor, seasonId, [changed])) ?? []
  return NextResponse.json({ message: message ?? null }, { headers: { "Cache-Control": "private, no-store" } })
}
