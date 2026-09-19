import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { validateUuid } from "@/lib/serverRequest"
import { joinSelfRegistrationSeason } from "@/lib/serverSelfRegistration"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const { id: leagueId, seasonId } = await params
  if (!validateUuid(leagueId) || !validateUuid(seasonId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  const access = await getServerLeagueActor(leagueId, { requireMember: true })
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const { data: entry, error: lookupError } = await access.actor.supabase
    .from("season_waitlist")
    .select("id,status,confirmation_expires_at")
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .eq("user_id", access.actor.user.id)
    .maybeSingle()
  if (lookupError || !entry || entry.status !== "promoted") return NextResponse.json({ error: "waitlist_not_promoted" }, { status: 409 })
  if (entry.confirmation_expires_at && new Date(entry.confirmation_expires_at).getTime() < Date.now()) {
    await access.actor.supabase.from("season_waitlist").update({ status: "cancelled" }).eq("id", entry.id)
    return NextResponse.json({ error: "waitlist_confirmation_expired" }, { status: 409 })
  }
  const { data: seasonState } = await access.actor.supabase
    .from("seasons")
    .select("status")
    .eq("id", seasonId)
    .eq("league_id", leagueId)
    .maybeSingle()
  const { data: registrationState } = await access.actor.supabase
    .from("season_settings")
    .select("registration_open")
    .eq("season_id", seasonId)
    .maybeSingle()
  if (seasonState?.status !== "upcoming" || registrationState?.registration_open !== true) {
    return NextResponse.json({ error: "waitlist_registration_closed" }, { status: 409 })
  }
  try {
    const result = await joinSelfRegistrationSeason({ actor: access.actor, leagueId, seasonId })
    await access.actor.supabase.from("season_waitlist").update({ status: "cancelled" }).eq("id", entry.id)
    return NextResponse.json({ ok: true, ...result })
  } catch {
    return NextResponse.json({ error: "waitlist_confirmation_failed" }, { status: 409 })
  }
}
