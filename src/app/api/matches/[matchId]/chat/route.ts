import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { insertServerActivityEvent } from "@/lib/serverActivityWrite"
import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"
import { broadcastMatchChatRefresh, getMatchChatRealtimeTopic } from "@/lib/serverChatRealtime"
import { buildMatchChatCoordination } from "@/lib/matchChatCoordination"
import { getScheduleLocationDisplayText } from "@/lib/leagueLocations"
import { getServerMatchChatCoordination } from "@/lib/serverMatchChatCoordination"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ matchId: string }> }
type ChatKind = "text" | "date_proposal" | "location_proposal"
type ChatParticipant = { playerId: string; userId: string | null; displayName: string; handle: string; avatarUrl: string | null }
type ChatBody = { body?: unknown; kind?: unknown; payload?: unknown; clientId?: unknown }
type ResponseBody = { messageId?: unknown; optionKey?: unknown; response?: unknown }
type ProposalResponse = { userId: string; playerId: string | null; displayName: string; optionKey: string; response: string; updatedAt: string }

const reply = (error: string, status: number) => NextResponse.json({ error }, { status })
const dbError = (message: string) => reply(message.includes("match_chat_") ? "match_chat_unavailable" : message, message.includes("match_chat_") ? 503 : 500)
const toRecord = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : ""
const isFinished = (match: { status: string; resultRecordedAt: string | null }) => Boolean(match.status === "finished" || match.resultRecordedAt)

function mentionHandle(displayName: string) { const compact = displayName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_]+/g, ""); return compact.slice(0, 40) || "Jugador" }

async function participant(matchId: string, requireMutableSeason = false) {
  if (!validateUuid(matchId)) return { denied: reply("invalid_match_id", 400) }
  const access = await getServerMatchActor(matchId, { requireLeagueAccess: true, requireParticipant: true, requireMutableSeason })
  if (!access.ok) return { denied: reply(access.error, access.status) }
  const { supabase: db, user, match, participantPlayerId: playerId } = access.actor
  return playerId ? { db, user, match, playerId } : { denied: reply("match_chat_forbidden", 403) }
}

async function getParticipants(db: ServerLeagueActor["supabase"], match: { participantIds: string[]; leagueId: string }) {
  const ids = match.participantIds
  const [playersResult, membershipsResult] = await Promise.all([db.from("players").select("id,display_name").in("id", ids), db.from("league_memberships").select("player_id,user_id").eq("league_id", match.leagueId).in("player_id", ids)])
  if (playersResult.error || membershipsResult.error) throw new Error("match_chat_participants_lookup_failed")
  const userByPlayer = new Map<string, string | null>((membershipsResult.data ?? []).map((row) => [String(row.player_id), typeof row.user_id === "string" ? row.user_id : null]))
  const userIds = Array.from(new Set(Array.from(userByPlayer.values()).filter((value): value is string => Boolean(value))))
  const avatarsResult = userIds.length ? await db.from("app_users").select("id,avatar_url").in("id", userIds) : { data: [], error: null }
  if (avatarsResult.error) throw new Error("match_chat_participants_lookup_failed")
  const avatarByUser = new Map<string, string | null>((avatarsResult.data ?? []).map((row) => [String(row.id), typeof row.avatar_url === "string" ? row.avatar_url : null]))
  const nameByPlayer = new Map<string, string>((playersResult.data ?? []).map((row) => [String(row.id), String(row.display_name ?? "Jugador")]))
  const usedHandles = new Set<string>()
  return ids.map((playerId) => { const displayName = nameByPlayer.get(playerId) ?? "Jugador", userId = userByPlayer.get(playerId) ?? null, baseHandle = mentionHandle(displayName); let handle = baseHandle, suffix = 2; while (usedHandles.has(handle.toLocaleLowerCase("es-ES"))) handle = `${baseHandle}${suffix++}`; usedHandles.add(handle.toLocaleLowerCase("es-ES")); return { playerId, userId, displayName, handle, avatarUrl: userId ? avatarByUser.get(userId) ?? null : null } satisfies ChatParticipant })
}

function parseStructuredMessage(input: ChatBody) {
  const kind: ChatKind = input.kind === "date_proposal" || input.kind === "location_proposal" ? input.kind : "text", clientId = clean(input.clientId, 80)
  if (kind === "text") {
    const body = typeof input.body === "string" ? input.body.trim() : ""
    if (!body || body.length > 2000) return null
    const payload = toRecord(input.payload), replySource = toRecord(payload.replyTo), replyMessageId = clean(replySource.messageId, 80), replySender = clean(replySource.senderDisplayName, 120), replyBody = clean(replySource.body, 240)
    const replyTo = validateUuid(replyMessageId) && replySender && replyBody ? { messageId: replyMessageId, senderDisplayName: replySender, body: replyBody } : null
    return { kind, body, payload: { ...(clientId ? { clientId } : {}), ...(replyTo ? { replyTo } : {}) } }
  }
  const payload = toRecord(input.payload)
  if (kind === "date_proposal") { const dates = (Array.isArray(payload.options) ? payload.options : []).map((value) => clean(value, 80)).filter((value) => value && !Number.isNaN(Date.parse(value))).slice(0, 5), uniqueDates = Array.from(new Set(dates)); return uniqueDates.length ? { kind, body: uniqueDates.length === 1 ? "Ha propuesto una fecha para el partido" : `Ha propuesto ${uniqueDates.length} fechas para el partido`, payload: { ...(clientId ? { clientId } : {}), options: uniqueDates.map((startsAt, index) => ({ key: `date-${index + 1}`, startsAt })) } } : null }
  const name = clean(payload.name, 120), locationId = clean(payload.locationId, 120) || null
  return name ? { kind, body: `Ha propuesto jugar en ${name}`, payload: { ...(clientId ? { clientId } : {}), key: "location", name, locationId } } : null
}

function mentionedParticipants(text: string, participants: ChatParticipant[], senderUserId: string) { const tokens = new Set(Array.from(text.matchAll(/@([A-Za-z0-9_]+)/g), (match) => match[1].toLocaleLowerCase("es-ES"))); return participants.filter((item) => item.userId && item.userId !== senderUserId && tokens.has(item.handle.toLocaleLowerCase("es-ES"))) }

export async function GET(request: Request, { params }: Ctx) {
  const { matchId } = await params, markRead = new URL(request.url).searchParams.get("markRead") !== "0"
  const gate = await participant(matchId)
  if ("denied" in gate) return gate.denied
  const { db, user, match } = gate
  try {
    const participants = await getParticipants(db, match)
    const seasonResult = user.isSuperuser ? { data: { status: "active" }, error: null } : await db.from("seasons").select("status").eq("id", match.seasonId).eq("league_id", match.leagueId).maybeSingle()
    if (seasonResult.error) return reply("season_lookup_failed", 500)
    const seasonReadOnly = !user.isSuperuser && seasonResult.data?.status === "finished"
    const { data, error } = await db.from("match_chat_messages").select("id,sender_user_id,sender_display_name,body,kind,payload,created_at").eq("match_id", matchId).order("created_at", { ascending: false }).limit(60)
    if (error) return dbError(error.message)
    const ordered = [...(data ?? [])].reverse(), proposalIds = ordered.filter((message) => message.kind !== "text").map((message) => String(message.id)), linkedUserIds = participants.flatMap((item) => item.userId ? [item.userId] : [])
    const [responsesResult, readsResult] = await Promise.all([proposalIds.length ? db.from("match_chat_proposal_responses").select("message_id,user_id,option_key,response,updated_at").in("message_id", proposalIds) : Promise.resolve({ data: [], error: null }), linkedUserIds.length ? db.from("match_chat_reads").select("user_id,last_read_at").eq("match_id", matchId).in("user_id", linkedUserIds) : Promise.resolve({ data: [], error: null })])
    if (responsesResult.error || readsResult.error) return dbError((responsesResult.error ?? readsResult.error)?.message ?? "match_chat_lookup_failed")
    const participantByUser = new Map(participants.filter((item) => item.userId).map((item) => [item.userId as string, item])), responsesByMessage = new Map<string, ProposalResponse[]>()
    for (const row of responsesResult.data ?? []) { const messageId = String(row.message_id), participant = participantByUser.get(String(row.user_id)), list = responsesByMessage.get(messageId) ?? []; list.push({ userId: String(row.user_id), playerId: participant?.playerId ?? null, displayName: participant?.displayName ?? "Jugador", optionKey: String(row.option_key), response: String(row.response), updatedAt: String(row.updated_at) }); responsesByMessage.set(messageId, list) }
    const messages = ordered.map((message) => ({ ...message, responses: responsesByMessage.get(String(message.id)) ?? [] })), readByUser = new Map<string, string>((readsResult.data ?? []).map((row) => [String(row.user_id), String(row.last_read_at)])), latestIncoming = [...ordered].reverse().find((message) => String(message.sender_user_id) !== user.id)
    if (markRead && latestIncoming && (!readByUser.get(user.id) || Date.parse(readByUser.get(user.id) as string) < Date.parse(String(latestIncoming.created_at)))) { const lastReadAt = new Date().toISOString(), write = await db.from("match_chat_reads").upsert({ match_id: matchId, user_id: user.id, last_read_at: lastReadAt }, { onConflict: "match_id,user_id" }); if (!write.error) { readByUser.set(user.id, lastReadAt); await broadcastMatchChatRefresh({ matchId, leagueId: match.leagueId, seasonId: match.seasonId, includeOverview: false }).catch(() => null) } }
    const participantsWithReads = participants.map((item) => ({ ...item, lastReadAt: item.userId ? readByUser.get(item.userId) ?? null : null })), coordination = buildMatchChatCoordination({ matchStatus: match.status, participants: participantsWithReads, messages })
    const reservationSummary = match.status === "scheduled" && match.scheduledAt && match.courtBooking.isReserved ? { scheduledAt: match.scheduledAt, locationText: getScheduleLocationDisplayText(match.location) ?? "Pista reservada" } : null
    return NextResponse.json({ messages, participants: participantsWithReads, currentUserId: user.id, round: match.round, readOnly: isFinished(match) || seasonReadOnly, coordination, reservationSummary, realtimeTopic: getMatchChatRealtimeTopic(matchId) })
  } catch (error) { return dbError(error instanceof Error ? error.message : "match_chat_lookup_failed") }
}

export async function POST(request: Request, { params }: Ctx) {
  const { matchId } = await params
  const gate = await participant(matchId, true)
  if ("denied" in gate) return gate.denied
  const { db, user, match, playerId } = gate
  if (isFinished(match)) return reply("match_chat_read_only", 409)
  const parsed = parseStructuredMessage((await parseJsonBody<ChatBody>(request)) ?? {})
  if (!parsed) return reply("match_chat_invalid_body", 400)
  const { count } = await db.from("match_chat_messages").select("id", { count: "exact", head: true }).eq("sender_user_id", user.id).gte("created_at", new Date(Date.now() - 10_000).toISOString())
  if ((count ?? 0) >= 8) return reply("match_chat_rate_limited", 429)
  const senderDisplayName = user.displayName || user.email.split("@")[0]
  let participants: ChatParticipant[] = []
  try { participants = await getParticipants(db, match) } catch { return reply("match_chat_participants_lookup_failed", 500) }
  const mentions = parsed.kind === "text" ? mentionedParticipants(parsed.body, participants, user.id) : [], beforeCoordination = parsed.kind === "text" ? null : await getServerMatchChatCoordination({ db, match }).catch(() => null)
  const { data, error } = await db.from("match_chat_messages").insert({ match_id: matchId, league_id: match.leagueId, season_id: match.seasonId, sender_user_id: user.id, sender_player_id: playerId, sender_display_name: senderDisplayName, body: parsed.body, kind: parsed.kind, payload: parsed.payload }).select("id,sender_user_id,sender_display_name,body,kind,payload,created_at").single()
  if (error) return dbError(error.message)
  const afterCoordination = beforeCoordination ? await getServerMatchChatCoordination({ db, match }).catch(() => null) : null, statusChanged = Boolean(beforeCoordination && afterCoordination && beforeCoordination.status !== afterCoordination.status)
  await insertServerActivityEvent({ supabase: db, leagueId: match.leagueId, seasonId: match.seasonId, matchId, actorUserId: user.id, actorEmail: user.email, actorDisplayName: senderDisplayName, type: "match_chat_message", title: "Nuevo mensaje en el chat", metadata: { round: match.round, participantIds: match.participantIds, messagePreview: parsed.body, mentionedUserIds: mentions.map((item) => item.userId), mentionedPlayerIds: mentions.map((item) => item.playerId), chatEventKind: statusChanged ? "coordination_status" : "message", coordinationStatus: statusChanged ? afterCoordination?.status : null } }).catch(() => null)
  await broadcastMatchChatRefresh({ matchId, leagueId: match.leagueId, seasonId: match.seasonId })
  return NextResponse.json({ message: { ...data, responses: [] } }, { status: 201 })
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { matchId } = await params
  const gate = await participant(matchId, true)
  if ("denied" in gate) return gate.denied
  const { db, user, match } = gate
  if (isFinished(match)) return reply("match_chat_read_only", 409)
  const body = (await parseJsonBody<ResponseBody>(request)) ?? {}, messageId = clean(body.messageId, 80), optionKey = clean(body.optionKey, 80), response = body.response === "available" || body.response === "unavailable" ? body.response : null
  if (!validateUuid(messageId) || !optionKey || !response) return reply("match_chat_invalid_response", 400)
  const { data: message, error: messageError } = await db.from("match_chat_messages").select("id,kind,payload").eq("id", messageId).eq("match_id", matchId).maybeSingle()
  if (messageError) return dbError(messageError.message)
  if (!message || message.kind === "text") return reply("match_chat_proposal_not_found", 404)
  const payload = toRecord(message.payload), validKeys = message.kind === "date_proposal" ? (Array.isArray(payload.options) ? payload.options.map((item) => clean(toRecord(item).key, 80)) : []) : [clean(payload.key, 80)]
  if (!validKeys.includes(optionKey)) return reply("match_chat_invalid_option", 400)
  const beforeCoordination = await getServerMatchChatCoordination({ db, match }).catch(() => null), beforeVotesResult = await db.from("match_chat_proposal_responses").select("user_id").eq("message_id", messageId).eq("option_key", optionKey), beforeVotes = new Set((beforeVotesResult.data ?? []).map((item) => String(item.user_id))).size
  const { error } = await db.from("match_chat_proposal_responses").upsert({ message_id: messageId, user_id: user.id, option_key: optionKey, response, updated_at: new Date().toISOString() }, { onConflict: "message_id,user_id,option_key" })
  if (error) return dbError(error.message)
  const afterCoordination = await getServerMatchChatCoordination({ db, match }).catch(() => null), afterVotesResult = await db.from("match_chat_proposal_responses").select("user_id").eq("message_id", messageId).eq("option_key", optionKey), afterVotes = new Set((afterVotesResult.data ?? []).map((item) => String(item.user_id))).size, statusChanged = Boolean(beforeCoordination && afterCoordination && beforeCoordination.status !== afterCoordination.status), reachedFourVotes = beforeVotes < 4 && afterVotes >= 4
  if (statusChanged || reachedFourVotes) { const actorDisplayName = user.displayName || user.email.split("@")[0]; await insertServerActivityEvent({ supabase: db, leagueId: match.leagueId, seasonId: match.seasonId, matchId, actorUserId: user.id, actorEmail: user.email, actorDisplayName, type: "match_chat_message", title: statusChanged ? "Estado de coordinación actualizado" : "Propuesta con 4 votos", metadata: { round: match.round, participantIds: match.participantIds, messagePreview: "", chatEventKind: statusChanged ? "coordination_status" : "proposal_four_votes", coordinationStatus: afterCoordination?.status ?? null, proposalKind: message.kind, reachedFourVotes } }).catch(() => null) }
  await broadcastMatchChatRefresh({ matchId, leagueId: match.leagueId, seasonId: match.seasonId, includeOverview: false })
  return NextResponse.json({ ok: true })
}
