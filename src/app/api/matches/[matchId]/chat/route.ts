import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { validateUuid } from "@/lib/serverRequest"
export const runtime = "nodejs"; export const dynamic = "force-dynamic"
type Ctx = { params: Promise<{ matchId: string }> }
const reply = (error: string, status: number) => NextResponse.json({ error }, { status })
const dbError = (message: string) => reply(message.includes("match_chat_messages") || message.includes("match_chat_reads") ? "match_chat_unavailable" : message, message.includes("match_chat_") ? 503 : 500)
async function participant(matchId: string) {
  if (!validateUuid(matchId)) return { denied: reply("invalid_match_id", 400) }
  const access = await getServerMatchActor(matchId, { requireLeagueAccess: true, requireParticipant: true })
  if (!access.ok) return { denied: reply(access.error, access.status) }
  const { supabase: db, user, match, participantPlayerId: playerId } = access.actor
  return playerId ? { db, user, match, playerId } : { denied: reply("match_chat_forbidden", 403) }
}
export async function GET(_: Request, { params }: Ctx) {
  const { matchId } = await params; const gate = await participant(matchId)
  if ("denied" in gate) return gate.denied
  const { db, user, match } = gate
  const { data, error } = await db.from("match_chat_messages").select("id,sender_user_id,sender_display_name,body,created_at").eq("match_id", matchId).order("created_at", { ascending: false }).limit(60)
  if (error) return dbError(error.message)
  await db.from("match_chat_reads").upsert({ match_id: matchId, user_id: user.id, last_read_at: new Date().toISOString() }, { onConflict: "match_id,user_id" })
  return NextResponse.json({ messages: [...(data ?? [])].reverse(), currentUserId: user.id, round: match.round })
}
export async function POST(request: Request, { params }: Ctx) {
  const { matchId } = await params; const gate = await participant(matchId)
  if ("denied" in gate) return gate.denied
  const { db, user, match, playerId } = gate; const body = String((await request.json().catch(() => ({})))?.body ?? "").trim()
  if (!body || body.length > 2000) return reply("match_chat_invalid_body", 400)
  const { count } = await db.from("match_chat_messages").select("id", { count: "exact", head: true }).eq("sender_user_id", user.id).gte("created_at", new Date(Date.now() - 10_000).toISOString())
  if ((count ?? 0) >= 8) return reply("match_chat_rate_limited", 429)
  const { data, error } = await db.from("match_chat_messages").insert({ match_id: matchId, league_id: match.leagueId, season_id: match.seasonId, sender_user_id: user.id, sender_player_id: playerId, sender_display_name: user.displayName || user.email.split("@")[0], body }).select("id,sender_user_id,sender_display_name,body,created_at").single()
  return error ? dbError(error.message) : NextResponse.json({ message: data }, { status: 201 })
}
