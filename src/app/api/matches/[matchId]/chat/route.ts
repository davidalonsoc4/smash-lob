import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { insertServerActivityEvent } from "@/lib/serverActivityWrite"
import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ matchId: string }> }
type ChatKind = "text" | "date_proposal" | "location_proposal"
type ChatParticipant = { playerId: string; userId: string | null; displayName: string; handle: string }
type ChatBody = { body?: unknown; kind?: unknown; payload?: unknown }
type ResponseBody = { messageId?: unknown; optionKey?: unknown; response?: unknown }

const reply = (error: string, status: number) => NextResponse.json({ error }, { status })
const dbError = (message: string) => reply(message.includes("match_chat_") ? "match_chat_unavailable" : message, message.includes("match_chat_") ? 503 : 500)
const toRecord = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : ""
const isFinished = (match: { status: string; resultRecordedAt: string | null }) => Boolean(match.status === "finished" || match.resultRecordedAt)

function mentionHandle(displayName: string) {
  const compact = displayName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_]+/g, "")
  return compact.slice(0, 40) || "Jugador"
}

async function participant(matchId: string) {
  if (!validateUuid(matchId)) return { denied: reply("invalid_match_id", 400) }
  const access = await getServerMatchActor(matchId, { requireLeagueAccess: true, requireParticipant: true })
  if (!access.ok) return { denied: reply(access.error, access.status) }
  const { supabase: db, user, match, participantPlayerId: playerId } = access.actor
  return playerId ? { db, user, match, playerId } : { denied: reply("match_chat_forbidden", 403) }
}

async function getParticipants(db: ServerLeagueActor["supabase"], match: { participantIds: string[]; leagueId: string }) {
  const ids = match.participantIds
  const [playersResult, membershipsResult] = await Promise.all([
    db.from("players").select("id,display_name").in("id", ids),
    db.from("league_memberships").select("player_id,user_id").eq("league_id", match.leagueId).in("player_id", ids),
  ])
  if (playersResult.error || membershipsResult.error) throw new Error("match_chat_participants_lookup_failed")
  const userByPlayer = new Map<string, string | null>((membershipsResult.data ?? []).map((row) => [String(row.player_id), typeof row.user_id === "string" ? row.user_id : null]))
  const nameByPlayer = new Map<string, string>((playersResult.data ?? []).map((row) => [String(row.id), String(row.display_name ?? "Jugador")]))
  const usedHandles = new Set<string>()
  return ids.map((playerId) => {
    const displayName = nameByPlayer.get(playerId) ?? "Jugador"
    const baseHandle = mentionHandle(displayName)
    let handle = baseHandle
    let suffix = 2
    while (usedHandles.has(handle.toLocaleLowerCase("es-ES"))) handle = `${baseHandle}${suffix++}`
    usedHandles.add(handle.toLocaleLowerCase("es-ES"))
    return { playerId, userId: userByPlayer.get(playerId) ?? null, displayName, handle } satisfies ChatParticipant
  })
}

function parseStructuredMessage(input: ChatBody) {
  const kind: ChatKind = input.kind === "date_proposal" || input.kind === "location_proposal" ? input.kind : "text"
  if (kind === "text") {
    const body = typeof input.body === "string" ? input.body.trim() : ""
    if (!body || body.length > 2000) return null
    return { kind, body, payload: {} }
  }
  const payload = toRecord(input.payload)
  if (kind === "date_proposal") {
    const rawOptions = Array.isArray(payload.options) ? payload.options : []
    const dates = rawOptions.map((value) => clean(value, 80)).filter((value) => value && !Number.isNaN(Date.parse(value))).slice(0, 4)
    const uniqueDates = Array.from(new Set(dates))
    if (!uniqueDates.length) return null
    return {
      kind,
      body: uniqueDates.length === 1 ? "Ha propuesto una fecha para el partido" : `Ha propuesto ${uniqueDates.length} fechas para el partido`,
      payload: { options: uniqueDates.map((startsAt, index) => ({ key: `date-${index + 1}`, startsAt })) },
    }
  }
  const name = clean(payload.name, 120)
  const locationId = clean(payload.locationId, 120) || null
  if (!name) return null
  return { kind, body: `Ha propuesto jugar en ${name}`, payload: { key: "location", name, locationId } }
}

function mentionedParticipants(text: string, participants: ChatParticipant[], senderUserId: string) {
  const tokens = new Set(Array.from(text.matchAll(/@([A-Za-z0-9_]+)/g), (match) => match[1].toLocaleLowerCase("es-ES")))
  return participants.filter((item) => item.userId && item.userId !== senderUserId && tokens.has(item.handle.toLocaleLowerCase("es-ES")))
}

export async function GET(_: Request, { params }: Ctx) {
  const { matchId } = await params
  const gate = await participant(matchId)
  if ("denied" in gate) return gate.denied
  const { db, user, match } = gate
  try {
    const participants = await getParticipants(db, match)
    const { data, error } = await db.from("match_chat_messages").select("id,sender_user_id,sender_display_name,body,kind,payload,created_at").eq("match_id", matchId).order("created_at", { ascending: false }).limit(60)
    if (error) return dbError(error.message)
    const ordered = [...(data ?? [])].reverse()
    const proposalIds = ordered.filter((message) => message.kind !== "text").map((message) => String(message.id))
    const responsesResult = proposalIds.length ? await db.from("match_chat_proposal_responses").select("message_id,user_id,option_key,response,updated_at").in("message_id", proposalIds) : { data: [], error: null }
    if (responsesResult.error) return dbError(responsesResult.error.message)
    const participantByUser = new Map(participants.filter((item) => item.userId).map((item) => [item.userId as string, item]))
    const responsesByMessage = new Map<string, Array<Record<string, unknown>>>()
    for (const row of responsesResult.data ?? []) {
      const messageId = String(row.message_id)
      const participant = participantByUser.get(String(row.user_id))
      const list = responsesByMessage.get(messageId) ?? []
      list.push({ userId: String(row.user_id), playerId: participant?.playerId ?? null, displayName: participant?.displayName ?? "Jugador", optionKey: String(row.option_key), response: String(row.response), updatedAt: String(row.updated_at) })
      responsesByMessage.set(messageId, list)
    }
    await db.from("match_chat_reads").upsert({ match_id: matchId, user_id: user.id, last_read_at: new Date().toISOString() }, { onConflict: "match_id,user_id" })
    return NextResponse.json({ messages: ordered.map((message) => ({ ...message, responses: responsesByMessage.get(String(message.id)) ?? [] })), participants, currentUserId: user.id, round: match.round, readOnly: isFinished(match) })
  } catch (error) {
    return dbError(error instanceof Error ? error.message : "match_chat_lookup_failed")
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const { matchId } = await params
  const gate = await participant(matchId)
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
  const mentions = parsed.kind === "text" ? mentionedParticipants(parsed.body, participants, user.id) : []
  const { data, error } = await db.from("match_chat_messages").insert({ match_id: matchId, league_id: match.leagueId, season_id: match.seasonId, sender_user_id: user.id, sender_player_id: playerId, sender_display_name: senderDisplayName, body: parsed.body, kind: parsed.kind, payload: parsed.payload }).select("id,sender_user_id,sender_display_name,body,kind,payload,created_at").single()
  if (error) return dbError(error.message)
  await insertServerActivityEvent({ supabase: db, leagueId: match.leagueId, seasonId: match.seasonId, matchId, actorUserId: user.id, actorEmail: user.email, actorDisplayName: senderDisplayName, type: "match_chat_message", title: "Nuevo mensaje en el chat", metadata: { round: match.round, participantIds: match.participantIds, messagePreview: parsed.body, mentionedUserIds: mentions.map((item) => item.userId), mentionedPlayerIds: mentions.map((item) => item.playerId) } }).catch(() => null)
  return NextResponse.json({ message: { ...data, responses: [] } }, { status: 201 })
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { matchId } = await params
  const gate = await participant(matchId)
  if ("denied" in gate) return gate.denied
  const { db, user, match } = gate
  if (isFinished(match)) return reply("match_chat_read_only", 409)
  const body = (await parseJsonBody<ResponseBody>(request)) ?? {}
  const messageId = clean(body.messageId, 80)
  const optionKey = clean(body.optionKey, 80)
  const response = body.response === "available" || body.response === "unavailable" ? body.response : null
  if (!validateUuid(messageId) || !optionKey || !response) return reply("match_chat_invalid_response", 400)
  const { data: message, error: messageError } = await db.from("match_chat_messages").select("id,kind,payload").eq("id", messageId).eq("match_id", matchId).maybeSingle()
  if (messageError) return dbError(messageError.message)
  if (!message || message.kind === "text") return reply("match_chat_proposal_not_found", 404)
  const payload = toRecord(message.payload)
  const validKeys = message.kind === "date_proposal" ? (Array.isArray(payload.options) ? payload.options.map((item) => clean(toRecord(item).key, 80)) : []) : [clean(payload.key, 80)]
  if (!validKeys.includes(optionKey)) return reply("match_chat_invalid_option", 400)
  const { error } = await db.from("match_chat_proposal_responses").upsert({ message_id: messageId, user_id: user.id, option_key: optionKey, response, updated_at: new Date().toISOString() }, { onConflict: "message_id,user_id,option_key" })
  if (error) return dbError(error.message)
  return NextResponse.json({ ok: true })
}
