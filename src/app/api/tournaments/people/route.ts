import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { getRapidTournamentSelectablePeople } from "@/lib/serverRapidTournamentPeople"
import { getServerLeagueViewer } from "@/lib/serverLeagueAccess"
import { getTournamentLeagueRoster } from "@/lib/serverTournamentLeagueRoster"
import { validateUuid } from "@/lib/serverRequest"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const isMissingPlayerAccountColumn = (error: { code?: string; message?: string } | null) => Boolean(error && (error.code === "42703" || error.code === "PGRST204") && /user_id/i.test(error.message ?? ""))
export async function GET(request: Request) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_people", limit: 60, windowMs: 60_000 })
  if (limited) return limited
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: { "Cache-Control": "no-store" } })
  const url = new URL(request.url)
  const leagueId = validateUuid(url.searchParams.get("leagueId"))
  const seasonId = validateUuid(url.searchParams.get("seasonId"))
  if (leagueId || seasonId) {
    if (!leagueId || !seasonId) return NextResponse.json({ error: "invalid_tournament_source" }, { status: 400 })
    const access = await getServerLeagueViewer(leagueId, { requireAdmin: true }); if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const roster = await getTournamentLeagueRoster(access.actor.supabase, leagueId, seasonId); if (roster.error) return NextResponse.json({ error: roster.error }, { status: roster.error === "tournament_source_not_found" ? 404 : 500 })
    const league = await access.actor.supabase.from("leagues").select("name").eq("id", leagueId).maybeSingle()
    return NextResponse.json({ players: roster.players ?? [], leagueName: league.data?.name ?? "" }, { headers: { "Cache-Control": "no-store" } })
  }
  const schema = await auth.actor.supabase.from("rapid_tournament_players").select("user_id").limit(1)
  if (isMissingPlayerAccountColumn(schema.error)) return NextResponse.json({ people: [], accountLinkingAvailable: false }, { headers: { "Cache-Control": "no-store" } })
  if (schema.error) return NextResponse.json({ error: "tournament_people_lookup_failed" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  const result = await getRapidTournamentSelectablePeople(auth.actor.supabase, auth.actor.user.id)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500, headers: { "Cache-Control": "no-store" } })
  return NextResponse.json({ people: result.people ?? [], accountLinkingAvailable: true }, { headers: { "Cache-Control": "no-store" } })
}
