import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"
import {
  buildMatchChatCoordination,
  type MatchChatCoordination,
} from "@/lib/matchChatCoordination"

export async function getServerMatchChatCoordination({
  db,
  match,
}: {
  db: ServerLeagueActor["supabase"]
  match: {
    id: string
    leagueId: string
    participantIds: string[]
    status: string
  }
}): Promise<MatchChatCoordination> {
  const [membershipsResult, messagesResult] = await Promise.all([
    db
      .from("league_memberships")
      .select("player_id,user_id")
      .eq("league_id", match.leagueId)
      .in("player_id", match.participantIds),
    db
      .from("match_chat_messages")
      .select("id,kind,payload")
      .eq("match_id", match.id)
      .in("kind", ["date_proposal", "location_proposal"])
      .order("created_at", { ascending: true }),
  ])

  if (membershipsResult.error || messagesResult.error) {
    throw new Error("match_chat_coordination_lookup_failed")
  }

  const userByPlayer = new Map<string, string | null>(
    (membershipsResult.data ?? []).map((row) => [
      String(row.player_id),
      typeof row.user_id === "string" ? row.user_id : null,
    ]),
  )
  const participants = match.participantIds.map((playerId) => ({
    userId: userByPlayer.get(playerId) ?? null,
  }))
  const messageIds = (messagesResult.data ?? []).map((message) => String(message.id))
  const responsesResult = messageIds.length
    ? await db
        .from("match_chat_proposal_responses")
        .select("message_id,user_id,option_key,response")
        .in("message_id", messageIds)
    : { data: [], error: null }

  if (responsesResult.error) {
    throw new Error("match_chat_coordination_responses_failed")
  }

  const responsesByMessage = new Map<
    string,
    Array<{ userId: string; optionKey: string; response: string }>
  >()
  for (const row of responsesResult.data ?? []) {
    const messageId = String(row.message_id)
    const current = responsesByMessage.get(messageId) ?? []
    current.push({
      userId: String(row.user_id),
      optionKey: String(row.option_key),
      response: String(row.response),
    })
    responsesByMessage.set(messageId, current)
  }

  return buildMatchChatCoordination({
    matchStatus: match.status,
    participants,
    messages: (messagesResult.data ?? []).map((message) => ({
      id: String(message.id),
      kind: String(message.kind),
      payload: message.payload,
      responses: responsesByMessage.get(String(message.id)) ?? [],
    })),
  })
}
