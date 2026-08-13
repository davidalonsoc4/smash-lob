import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })
type ChatMessageRow = { match_id: string; sender_user_id: string; sender_display_name: string; body: string; created_at: string }
type MatchRow = { id: unknown; round: unknown; status: unknown; team_a: unknown; team_b: unknown; scheduled_at: unknown; date_label: unknown; result_recorded_at: unknown }
const playerIds = (value: unknown) => (Array.isArray(value) ? value : []).filter((id): id is string => typeof id === "string")

export async function GET(request: Request) {
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return fail(auth.error, auth.status)
  const searchParams = new URL(request.url).searchParams
  const leagueId = searchParams.get("leagueId") ?? ""
  const seasonId = searchParams.get("seasonId") ?? ""
  if (!validateUuid(leagueId)) return fail("invalid_league_id", 400)
  if (!validateUuid(seasonId)) return fail("invalid_season_id", 400)
  const { supabase: db, user } = auth.actor
  const { data: membership, error: membershipError } = await db.from("league_memberships").select("player_id").eq("league_id", leagueId).eq("user_id", user.id).maybeSingle()
  if (membershipError) return fail("chat_membership_lookup_failed", 500)
  const playerId = typeof membership?.player_id === "string" ? membership.player_id : null
  if (!playerId) return NextResponse.json({ chats: [], totalUnread: 0 })
  const { data: matches, error: matchError } = await db.from("matches").select("id,round,status,team_a,team_b,scheduled_at,date_label,result_recorded_at").eq("league_id", leagueId).eq("season_id", seasonId).order("round", { ascending: false })
  if (matchError) return fail("chat_matches_lookup_failed", 500)
  const matchRows = ((matches ?? []) as MatchRow[]).filter((match) => { const teamA = playerIds(match.team_a); const teamB = playerIds(match.team_b); return teamA.includes(playerId) || teamB.includes(playerId) })
  const matchIds = matchRows.map((match) => String(match.id))
  if (!matchIds.length) return NextResponse.json({ chats: [], totalUnread: 0 })
  const allPlayerIds = Array.from(new Set(matchRows.flatMap((match) => [...playerIds(match.team_a), ...playerIds(match.team_b)])))
  const [messagesResult, readsResult, playersResult] = await Promise.all([
    db.from("match_chat_messages").select("match_id,sender_user_id,sender_display_name,body,created_at").in("match_id", matchIds).order("created_at", { ascending: false }).limit(1200),
    db.from("match_chat_reads").select("match_id,last_read_at").eq("user_id", user.id).in("match_id", matchIds),
    allPlayerIds.length ? db.from("players").select("id,display_name").in("id", allPlayerIds) : Promise.resolve({ data: [], error: null }),
  ])
  if (messagesResult.error || readsResult.error || playersResult.error) return fail("chat_overview_lookup_failed", 500)
  const readByMatch = new Map((readsResult.data ?? []).map((row) => [String(row.match_id), String(row.last_read_at)]))
  const playerNames = new Map((playersResult.data ?? []).map((row) => [String(row.id), String(row.display_name ?? "Jugador")]))
  const messagesByMatch = new Map<string, ChatMessageRow[]>()
  for (const raw of messagesResult.data ?? []) { const message = raw as ChatMessageRow; const list = messagesByMatch.get(message.match_id) ?? []; list.push(message); messagesByMatch.set(message.match_id, list) }
  const name = (id: string) => playerNames.get(id) ?? "Jugador"
  const chats = matchRows.map((match) => {
    const id = String(match.id); const teamA = playerIds(match.team_a); const teamB = playerIds(match.team_b); const ownTeam = teamA.includes(playerId) ? teamA : teamB; const rivalTeam = teamA.includes(playerId) ? teamB : teamA; const partnerId = ownTeam.find((id) => id !== playerId) ?? null
    const messages = messagesByMatch.get(id) ?? []; const last = messages[0] ?? null; const lastRead = readByMatch.get(id) ?? null
    const unread = messages.filter((message) => message.sender_user_id !== user.id && (!lastRead || Date.parse(message.created_at) > Date.parse(lastRead))).length
    return { id, round: Number(match.round), status: String(match.status), scheduledAt: typeof match.scheduled_at === "string" ? match.scheduled_at : null, dateLabel: typeof match.date_label === "string" ? match.date_label : null, readOnly: match.status === "finished" || Boolean(match.result_recorded_at), partner: partnerId ? name(partnerId) : "Pareja", rivals: rivalTeam.map(name), unread, lastMessage: last ? { sender: last.sender_display_name, body: last.body, createdAt: last.created_at } : null }
  }).sort((a, b) => ((Date.parse(b.lastMessage?.createdAt ?? "") || 0) - (Date.parse(a.lastMessage?.createdAt ?? "") || 0)) || ((Date.parse(b.scheduledAt ?? "") || 0) - (Date.parse(a.scheduledAt ?? "") || 0)) || (b.round - a.round))
  return NextResponse.json({ chats, totalUnread: chats.reduce((sum, chat) => sum + chat.unread, 0) })
}
