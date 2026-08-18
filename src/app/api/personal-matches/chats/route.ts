import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import {
  isMatchChatReadOnly,
  isPersonalMatchChatExpired,
} from "@/lib/matchChatWindow"
import { isPersonalMatchChatSchemaMissingError } from "@/lib/personalMatchChatSchema"
import { getPersonalMatchChatRealtimeTopic } from "@/lib/serverChatRealtime"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status })

type ParticipantRow = {
  match_id: string
  user_id: string | null
  display_name: string
  team: number
  slot: number
}

type PersonalMatchRow = {
  id: string
  status: string | null
  played_at: string | null
  result_recorded_at: string | null
  location_name: string | null
}

type MessageRow = {
  match_id: string
  sender_user_id: string
  sender_display_name: string
  body: string
  created_at: string
}

export async function GET() {
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return fail(auth.error, auth.status)

  const { supabase: db, user } = auth.actor

  try {
    await db.rpc("cleanup_expired_personal_match_chat")
  } catch {
    // La limpieza es best-effort; la bandeja sigue cargando si el job falla.
  }

  const ownParticipantsResult = await db
    .from("personal_match_participants")
    .select("match_id,user_id,display_name,team,slot")
    .eq("user_id", user.id)

  if (ownParticipantsResult.error) {
    return fail("personal_match_chats_lookup_failed", 500)
  }

  const ownParticipants = (ownParticipantsResult.data ?? []) as ParticipantRow[]
  const matchIds = [...new Set(ownParticipants.map((row) => row.match_id).filter(Boolean))]
  if (matchIds.length === 0) {
    return NextResponse.json({ chats: [], totalUnread: 0 })
  }

  const [matchesResult, participantsResult, messagesResult, readsResult] =
    await Promise.all([
      db
        .from("personal_matches")
        .select("id,status,played_at,result_recorded_at,location_name")
        .in("id", matchIds),
      db
        .from("personal_match_participants")
        .select("match_id,user_id,display_name,team,slot")
        .in("match_id", matchIds)
        .order("team", { ascending: true })
        .order("slot", { ascending: true }),
      db
        .from("personal_match_chat_messages")
        .select("match_id,sender_user_id,sender_display_name,body,created_at")
        .in("match_id", matchIds)
        .order("created_at", { ascending: false })
        .limit(1200),
      db
        .from("personal_match_chat_reads")
        .select("match_id,last_read_at")
        .eq("user_id", user.id)
        .in("match_id", matchIds),
    ])

  const chatSchemaError = messagesResult.error || readsResult.error
  if (chatSchemaError && isPersonalMatchChatSchemaMissingError(chatSchemaError)) {
    return fail("personal_match_chat_schema_missing", 503)
  }
  if (
    matchesResult.error ||
    participantsResult.error ||
    messagesResult.error ||
    readsResult.error
  ) {
    return fail("personal_match_chats_lookup_failed", 500)
  }

  const participantsByMatch = new Map<string, ParticipantRow[]>()
  for (const row of (participantsResult.data ?? []) as ParticipantRow[]) {
    const list = participantsByMatch.get(row.match_id) ?? []
    list.push(row)
    participantsByMatch.set(row.match_id, list)
  }

  const messagesByMatch = new Map<string, MessageRow[]>()
  for (const row of (messagesResult.data ?? []) as MessageRow[]) {
    const list = messagesByMatch.get(row.match_id) ?? []
    list.push(row)
    messagesByMatch.set(row.match_id, list)
  }

  const readByMatch = new Map(
    (readsResult.data ?? []).map((row) => [
      String(row.match_id),
      typeof row.last_read_at === "string" ? row.last_read_at : null,
    ]),
  )

  const ownByMatch = new Map(ownParticipants.map((row) => [row.match_id, row]))

  const chats = ((matchesResult.data ?? []) as PersonalMatchRow[])
    .map((match) => {
      const participants = participantsByMatch.get(match.id) ?? []
      const own = ownByMatch.get(match.id) ?? null
      const partner = own
        ? participants.find(
            (participant) =>
              participant.team === own.team &&
              participant.user_id !== user.id,
          ) ?? null
        : null
      const rivals = own
        ? participants.filter((participant) => participant.team !== own.team)
        : participants.filter((participant) => participant.user_id !== user.id)
      const messages = messagesByMatch.get(match.id) ?? []
      const latest = messages[0] ?? null
      const lastReadAt = readByMatch.get(match.id) ?? null
      const unread = messages.filter(
        (message) =>
          message.sender_user_id !== user.id &&
          (!lastReadAt || Date.parse(message.created_at) > Date.parse(lastReadAt)),
      ).length
      const status = match.status === "finished" ? "finished" : "scheduled"
      const resultRecordedAt =
        typeof match.result_recorded_at === "string"
          ? match.result_recorded_at
          : null
      const expired = isPersonalMatchChatExpired({ status, resultRecordedAt })

      return {
        id: match.id,
        status,
        scheduledAt:
          typeof match.played_at === "string" ? match.played_at : null,
        resultRecordedAt,
        locationName:
          typeof match.location_name === "string" ? match.location_name : null,
        readOnly: isMatchChatReadOnly({ status, resultRecordedAt }),
        expired,
        partner: partner?.display_name ?? "Pareja",
        rivals: rivals.map((participant) => participant.display_name),
        unread,
        lastMessage: latest
          ? {
              sender:
                latest.sender_user_id === user.id
                  ? "Yo"
                  : latest.sender_display_name,
              body: latest.body,
              createdAt: latest.created_at,
            }
          : null,
        realtimeTopic: getPersonalMatchChatRealtimeTopic(match.id),
      }
    })
    .sort((left, right) => {
      const leftRecent = Date.parse(
        left.lastMessage?.createdAt ?? left.resultRecordedAt ?? left.scheduledAt ?? "",
      ) || 0
      const rightRecent = Date.parse(
        right.lastMessage?.createdAt ?? right.resultRecordedAt ?? right.scheduledAt ?? "",
      ) || 0
      return rightRecent - leftRecent
    })

  return NextResponse.json({
    chats,
    totalUnread: chats.reduce((total, chat) => total + chat.unread, 0),
  })
}
