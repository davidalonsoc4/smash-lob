import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { isPersonalMatchChatSchemaMissingError } from "@/lib/personalMatchChatSchema"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import {
  getMatchChatWriteUntil,
  isMatchChatReadOnly,
  isPersonalMatchChatExpired,
} from "@/lib/matchChatWindow"
import {
  broadcastPersonalMatchChatRefresh,
  getPersonalMatchChatRealtimeTopic,
} from "@/lib/serverChatRealtime"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }
type ChatBody = { body?: unknown }

const reply = (error: string, status: number) =>
  NextResponse.json({ error }, { status })

async function getPersonalChatActor(matchId: string) {
  if (!validateUuid(matchId)) {
    return { denied: reply("invalid_personal_match_id", 400) } as const
  }

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return {
      denied: NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      ),
    } as const
  }

  const { supabase: db, user } = authResult.actor
  const [participantResult, matchResult] = await Promise.all([
    db
      .from("personal_match_participants")
      .select("id,display_name")
      .eq("match_id", matchId)
      .eq("user_id", user.id)
      .maybeSingle(),
    db
      .from("personal_matches")
      .select("id,status,result_recorded_at,played_at")
      .eq("id", matchId)
      .maybeSingle(),
  ])

  if (participantResult.error || matchResult.error) {
    return { denied: reply("personal_match_chat_lookup_failed", 500) } as const
  }
  if (!matchResult.data) {
    return { denied: reply("personal_match_not_found", 404) } as const
  }
  if (!participantResult.data) {
    return { denied: reply("personal_match_chat_forbidden", 403) } as const
  }

  return {
    db,
    user,
    match: {
      id: String(matchResult.data.id),
      status: String(matchResult.data.status),
      resultRecordedAt:
        typeof matchResult.data.result_recorded_at === "string"
          ? matchResult.data.result_recorded_at
          : null,
      playedAt:
        typeof matchResult.data.played_at === "string"
          ? matchResult.data.played_at
          : null,
    },
    senderDisplayName:
      typeof participantResult.data.display_name === "string"
        ? participantResult.data.display_name
        : user.displayName || user.email.split("@")[0],
  } as const
}

async function getParticipants(
  db: Extract<
    Awaited<ReturnType<typeof requireAuthenticatedAppUser>>,
    { ok: true }
  >["actor"]["supabase"],
  matchId: string,
) {
  const participantsResult = await db
    .from("personal_match_participants")
    .select("id,user_id,display_name,team,slot")
    .eq("match_id", matchId)
    .order("team", { ascending: true })
    .order("slot", { ascending: true })

  if (participantsResult.error) {
    throw new Error("personal_match_chat_participants_lookup_failed")
  }

  const userIds = Array.from(
    new Set(
      (participantsResult.data ?? [])
        .map((row) => row.user_id)
        .filter((value): value is string => typeof value === "string"),
    ),
  )
  const avatarsResult = userIds.length
    ? await db.from("app_users").select("id,avatar_url").in("id", userIds)
    : { data: [], error: null }

  if (avatarsResult.error) {
    throw new Error("personal_match_chat_participants_lookup_failed")
  }

  const avatarByUserId = new Map(
    (avatarsResult.data ?? []).map((row) => [
      String(row.id),
      typeof row.avatar_url === "string" ? row.avatar_url : null,
    ]),
  )

  return (participantsResult.data ?? []).map((row) => ({
    participantId: String(row.id),
    userId: typeof row.user_id === "string" ? row.user_id : null,
    displayName:
      typeof row.display_name === "string" ? row.display_name : "Jugador",
    avatarUrl:
      typeof row.user_id === "string"
        ? avatarByUserId.get(row.user_id) ?? null
        : null,
  }))
}

export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params
  const gate = await getPersonalChatActor(id)
  if ("denied" in gate) return gate.denied

  const { db, user, match } = gate

  try {
    try {
      await db.rpc("cleanup_expired_personal_match_chat")
    } catch {
      // La limpieza es best-effort; el chat sigue disponible si el job falla.
    }

    const participants = await getParticipants(db, match.id)
    const linkedUserIds = participants.flatMap((item) =>
      item.userId ? [item.userId] : [],
    )
    const [messagesResult, readsResult] = await Promise.all([
      db
        .from("personal_match_chat_messages")
        .select("id,sender_user_id,sender_display_name,body,created_at")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false })
        .limit(60),
      linkedUserIds.length
        ? db
            .from("personal_match_chat_reads")
            .select("user_id,last_read_at")
            .eq("match_id", match.id)
            .in("user_id", linkedUserIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    const chatSchemaError = messagesResult.error || readsResult.error
    if (chatSchemaError && isPersonalMatchChatSchemaMissingError(chatSchemaError)) {
      return reply("personal_match_chat_schema_missing", 503)
    }
    if (messagesResult.error || readsResult.error) {
      return reply("personal_match_chat_lookup_failed", 500)
    }

    const ordered = [...(messagesResult.data ?? [])].reverse()
    const readByUser = new Map<string, string>(
      (readsResult.data ?? []).map((row) => [
        String(row.user_id),
        String(row.last_read_at),
      ]),
    )
    const latestIncoming = [...ordered]
      .reverse()
      .find((message) => String(message.sender_user_id) !== user.id)
    const markRead = new URL(request.url).searchParams.get("markRead") !== "0"

    if (
      markRead &&
      latestIncoming &&
      (!readByUser.get(user.id) ||
        Date.parse(readByUser.get(user.id) as string) <
          Date.parse(String(latestIncoming.created_at)))
    ) {
      const lastReadAt = new Date().toISOString()
      const write = await db.from("personal_match_chat_reads").upsert(
        {
          match_id: match.id,
          user_id: user.id,
          last_read_at: lastReadAt,
        },
        { onConflict: "match_id,user_id" },
      )
      if (!write.error) {
        readByUser.set(user.id, lastReadAt)
        await broadcastPersonalMatchChatRefresh(match.id)
      }
    }

    const expired = isPersonalMatchChatExpired({
      status: match.status,
      resultRecordedAt: match.resultRecordedAt,
    })
    const writeUntil = getMatchChatWriteUntil({
      status: match.status,
      resultRecordedAt: match.resultRecordedAt,
    })

    return NextResponse.json({
      messages: ordered,
      participants: participants.map((item) => ({
        ...item,
        lastReadAt: item.userId ? readByUser.get(item.userId) ?? null : null,
      })),
      currentUserId: user.id,
      readOnly: isMatchChatReadOnly({
        status: match.status,
        resultRecordedAt: match.resultRecordedAt,
      }),
      expired,
      writeUntil: writeUntil?.toISOString() ?? null,
      realtimeTopic: getPersonalMatchChatRealtimeTopic(match.id),
    })
  } catch {
    return reply("personal_match_chat_lookup_failed", 500)
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "personal_match_chat_message",
    limit: 30,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const { id } = await params
  const gate = await getPersonalChatActor(id)
  if ("denied" in gate) return gate.denied

  const { db, user, match, senderDisplayName } = gate
  if (
    isMatchChatReadOnly({
      status: match.status,
      resultRecordedAt: match.resultRecordedAt,
    })
  ) {
    return reply("personal_match_chat_read_only", 409)
  }

  const body = (await parseJsonBody<ChatBody>(request)) ?? {}
  const text = typeof body.body === "string" ? body.body.trim() : ""
  if (!text || text.length > 2000) {
    return reply("personal_match_chat_invalid_body", 400)
  }

  const { count, error: countError } = await db
    .from("personal_match_chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_user_id", user.id)
    .gte("created_at", new Date(Date.now() - 10_000).toISOString())

  if (countError) {
    if (isPersonalMatchChatSchemaMissingError(countError)) {
      return reply("personal_match_chat_schema_missing", 503)
    }
    return reply("personal_match_chat_lookup_failed", 500)
  }
  if ((count ?? 0) >= 8) {
    return reply("personal_match_chat_rate_limited", 429)
  }

  const { data, error } = await db
    .from("personal_match_chat_messages")
    .insert({
      match_id: match.id,
      sender_user_id: user.id,
      sender_display_name: senderDisplayName,
      body: text,
    })
    .select("id,sender_user_id,sender_display_name,body,created_at")
    .single()

  if (error) {
    if (isPersonalMatchChatSchemaMissingError(error)) {
      return reply("personal_match_chat_schema_missing", 503)
    }
    return reply("personal_match_chat_write_failed", 500)
  }

  await broadcastPersonalMatchChatRefresh(match.id)
  return NextResponse.json({ message: data }, { status: 201 })
}
