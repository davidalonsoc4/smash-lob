import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { validateUuid } from "@/lib/serverRequest"
import { joinSeasonWaitlist, leaveSeasonWaitlist } from "@/lib/serverSeasonWaitlist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const { id: leagueId, seasonId } = await params
  if (!validateUuid(leagueId) || !validateUuid(seasonId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  const access = await getServerLeagueActor(leagueId, { requireMember: true })
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const isAdmin = access.actor.membership?.role === "creator" || access.actor.membership?.role === "admin" || access.actor.user.isSuperuser
  let query = access.actor.supabase.from("season_waitlist").select("id,user_id,status,created_at,promoted_at").eq("league_id", leagueId).eq("season_id", seasonId).eq("status", "waiting").order("created_at", { ascending: true }).order("id", { ascending: true })
  if (!isAdmin) query = query.eq("user_id", access.actor.user.id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: "waitlist_lookup_failed" }, { status: 500 })
  const position = data?.findIndex((row: { user_id: string }) => row.user_id === access.actor.user.id)
  return NextResponse.json({ items: isAdmin ? data ?? [] : data ?? [], position: position === undefined || position < 0 ? null : position + 1 })
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const { id: leagueId, seasonId } = await params
  if (!validateUuid(leagueId) || !validateUuid(seasonId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  const access = await getServerLeagueActor(leagueId, { requireMember: true })
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  try {
    const entry = await joinSeasonWaitlist({ supabase: access.actor.supabase, leagueId, seasonId, userId: access.actor.user.id })
    return NextResponse.json({ ok: true, entry })
  } catch {
    return NextResponse.json({ error: "waitlist_join_failed" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const { id: leagueId, seasonId } = await params
  if (!validateUuid(leagueId) || !validateUuid(seasonId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  const access = await getServerLeagueActor(leagueId, { requireMember: true })
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  try {
    await leaveSeasonWaitlist({ supabase: access.actor.supabase, seasonId, userId: access.actor.user.id })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "waitlist_leave_failed" }, { status: 500 })
  }
}
