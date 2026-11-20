import { NextResponse } from "next/server"
import { isLeagueChatReactionKey } from "@/lib/leagueChatReactions"
import { getLeagueSeasonChatActor } from "@/lib/serverLeagueSeasonChatAccess"
import { LEAGUE_CHAT_MESSAGE_FIELDS, shapeLeagueChatMessages, type LeagueChatMessageRow } from "@/lib/serverLeagueChatMessages"
import { broadcastLeagueSeasonChatRefresh } from "@/lib/serverChatRealtime"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ seasonId: string }> }
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

/** React to a message of the season chat, change the reaction, or withdraw it (`reaction: null`, or the same one again). */
export async function POST(request: Request, context: Context) {
  const rateLimited = await enforceRequestRateLimit({ request, scope: "league_chat_reaction", limit: 60, windowMs: 60_000 })
  if (rateLimited) return rateLimited
  const { seasonId } = await context.params
  const access = await getLeagueSeasonChatActor(seasonId)
  if (!access.ok) return fail(access.error, access.status)
  const input = await parseJsonBody<{ messageId?: unknown; reaction?: unknown }>(request)
  const messageId = validateUuid(input?.messageId)
  const reaction = input?.reaction === null ? null : isLeagueChatReactionKey(input?.reaction) ? input.reaction : undefined
  if (!messageId || reaction === undefined) return fail("invalid_reaction", 400)

  const { supabase, user } = access.actor
  const result = await supabase.rpc("react_league_season_chat_message", {
    p_season_id: seasonId, p_user_id: user.id, p_message_id: messageId, p_reaction: reaction,
  })
  if (result.error) {
    if (result.error.message.includes("season_chat_read_only")) return fail("league_chat_read_only", 409)
    if (result.error.message.includes("season_chat_forbidden")) return fail("league_chat_not_found", 404)
    if (result.error.message.includes("season_chat_message_not_found")) return fail("league_chat_message_not_found", 404)
    return fail("league_chat_write_failed", 500)
  }

  const row = await supabase.from("league_season_chat_messages").select(LEAGUE_CHAT_MESSAGE_FIELDS)
    .eq("season_id", seasonId).eq("id", messageId).maybeSingle()
  if (row.error || !row.data) return fail("league_chat_messages_failed", 500)
  const [message] = (await shapeLeagueChatMessages(access.actor, seasonId, [row.data as LeagueChatMessageRow])) ?? []
  if (!message) return fail("league_chat_messages_failed", 500)
  // Everyone sees the new reactions: the same targeted refresh used when a message is edited or a poll is voted.
  await broadcastLeagueSeasonChatRefresh(access.season.league_id, seasonId, messageId)
  return NextResponse.json({ message }, { headers: { "Cache-Control": "private, no-store" } })
}
