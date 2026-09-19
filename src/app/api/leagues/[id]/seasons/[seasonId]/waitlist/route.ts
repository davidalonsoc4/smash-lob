import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { assertSeasonWaitlistEligible, joinSeasonWaitlist, leaveSeasonWaitlist } from "@/lib/serverSeasonWaitlist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ReorderBody = { orderedUserIds?: unknown }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const { id: leagueId, seasonId } = await params
  if (!validateUuid(leagueId) || !validateUuid(seasonId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  const access = await getServerLeagueActor(leagueId, { requireMember: true })
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const isAdmin = access.actor.membership?.role === "creator" || access.actor.membership?.role === "admin" || access.actor.user.isSuperuser
  let query = access.actor.supabase.from("season_waitlist").select("id,user_id,status,created_at,promoted_at,confirmation_expires_at,position").eq("league_id", leagueId).eq("season_id", seasonId).in("status", isAdmin ? ["waiting", "promoted"] : ["waiting", "promoted"]).order("position", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true }).order("id", { ascending: true })
  if (!isAdmin) query = query.eq("user_id", access.actor.user.id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: "waitlist_lookup_failed" }, { status: 500 })
  const waiting = (data ?? []).filter((row: { status: string }) => row.status === "waiting")
  const position = waiting.findIndex((row: { user_id: string }) => row.user_id === access.actor.user.id)
  const userIds = (data ?? []).map((row: { user_id: string }) => row.user_id)
  const { data: users } = userIds.length
    ? await access.actor.supabase.from("app_users").select("id,display_name").in("id", userIds)
    : { data: [] }
  const names = new Map((users ?? []).map((user: { id: string; display_name: string | null }) => [user.id, user.display_name ?? "Jugador"]))
  return NextResponse.json({ items: (data ?? []).map((row: { user_id: string }) => ({ ...row, display_name: names.get(row.user_id) ?? "Jugador" })), position: position < 0 ? null : position + 1 })
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const { id: leagueId, seasonId } = await params
  if (!validateUuid(leagueId) || !validateUuid(seasonId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  const access = await getServerLeagueActor(leagueId, { requireMember: true })
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  try {
    await assertSeasonWaitlistEligible({ supabase: access.actor.supabase, leagueId, seasonId, userId: access.actor.user.id })
    const entry = await joinSeasonWaitlist({ supabase: access.actor.supabase, leagueId, seasonId, userId: access.actor.user.id })
    return NextResponse.json({ ok: true, entry })
  } catch (error) {
    const code = error instanceof Error ? error.message : "waitlist_join_failed"
    return NextResponse.json({ error: code }, { status: code === "waitlist_not_full" || code === "already_registered" || code === "waitlist_not_available" ? 409 : 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const { id: leagueId, seasonId } = await params
  if (!validateUuid(leagueId) || !validateUuid(seasonId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const body = await parseJsonBody<ReorderBody>(request)
  const orderedUserIds = Array.isArray(body?.orderedUserIds) ? body.orderedUserIds.filter((value): value is string => typeof value === "string" && Boolean(validateUuid(value))) : []
  if (!orderedUserIds.length || new Set(orderedUserIds).size !== orderedUserIds.length) return NextResponse.json({ error: "invalid_order" }, { status: 400 })
  const { data: current, error: lookupError } = await access.actor.supabase.from("season_waitlist").select("id,user_id").eq("league_id", leagueId).eq("season_id", seasonId).eq("status", "waiting")
  if (lookupError) return NextResponse.json({ error: "waitlist_lookup_failed" }, { status: 500 })
  const currentIds = new Set((current ?? []).map((row: { user_id: string }) => row.user_id))
  if (currentIds.size !== orderedUserIds.length || orderedUserIds.some((id) => !currentIds.has(id))) return NextResponse.json({ error: "invalid_order" }, { status: 400 })
  const { error: reorderError } = await access.actor.supabase.rpc("reorder_season_waitlist", { p_league_id: leagueId, p_season_id: seasonId, p_user_ids: orderedUserIds })
  if (reorderError) return NextResponse.json({ error: "waitlist_reorder_failed" }, { status: 500 })
  return NextResponse.json({ ok: true })
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
