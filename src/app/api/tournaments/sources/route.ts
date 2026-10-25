import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const limited = await enforceRequestRateLimit({ request, scope: "tournament_sources", limit: 60, windowMs: 60_000 })
  if (limited) return limited
  const auth = await requireAuthenticatedAppUser()
  const headers = { "Cache-Control": "no-store" }
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers })
  const { supabase, user } = auth.actor
  const memberships = user.isSuperuser ? { data: [], error: null } : await supabase.from("league_memberships")
    .select("league_id").eq("user_id", user.id).in("role", ["creator", "admin"])
  if (memberships.error) return NextResponse.json({ error: "tournament_source_lookup_failed" }, { status: 500, headers })
  const ids = [...new Set((memberships.data ?? []).map(item => item.league_id))]
  if (!user.isSuperuser && !ids.length) return NextResponse.json({ sources: [] }, { headers })
  let leaguesQuery = supabase.from("leagues").select("id,name").order("name")
  let seasonsQuery = supabase.from("seasons").select("id,league_id,name").order("name")
  if (!user.isSuperuser) { leaguesQuery = leaguesQuery.in("id", ids); seasonsQuery = seasonsQuery.in("league_id", ids) }
  const [leagues, seasons] = await Promise.all([leaguesQuery, seasonsQuery])
  if (leagues.error || seasons.error) return NextResponse.json({ error: "tournament_source_lookup_failed" }, { status: 500, headers })
  const leagueNames = new Map((leagues.data ?? []).map(league => [league.id, league.name]))
  const sources = (seasons.data ?? []).filter(season => leagueNames.has(season.league_id)).map(season => ({
    leagueId: season.league_id, leagueName: leagueNames.get(season.league_id), seasonId: season.id, seasonName: season.name,
  }))
  return NextResponse.json({ sources }, { headers })
}
