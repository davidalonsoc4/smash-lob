import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_invite_preview", limit: 30, windowMs: 60_000 }); if (limited) return limited
  const { code } = await params; if (!/^[A-Za-z0-9_-]{43}$/.test(code)) return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
  const supabase = createSupabaseServiceClient(); if (!supabase) return NextResponse.json({ error: "invite_lookup_failed" }, { status: 501 })
  const codeHash = createHash("sha256").update(code).digest("hex")
  const shared = await supabase.from("rapid_tournament_join_invites").select("tournament_id,expires_at,revoked_at").eq("code_hash", codeHash).gt("expires_at", new Date().toISOString()).is("revoked_at", null).maybeSingle()
  if (shared.error) return NextResponse.json({ error: "invite_lookup_failed" }, { status: 500 })
  let tournamentId: string, expiresAt: string, players: Array<{ id: string; name: string }>
  if (shared.data) {
    tournamentId = shared.data.tournament_id; expiresAt = shared.data.expires_at
    const result = await supabase.from("rapid_tournament_players").select("id,full_name").eq("tournament_id", tournamentId).is("user_id", null).order("slot")
    if (result.error || !result.data?.length) return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
    players = result.data.map((player) => ({ id: player.id, name: player.full_name }))
  } else {
    const legacy = await supabase.from("rapid_tournament_invites").select("tournament_id,player_id,expires_at,claimed_at,revoked_at").eq("code_hash", codeHash).gt("expires_at", new Date().toISOString()).is("claimed_at", null).is("revoked_at", null).maybeSingle()
    if (legacy.error || !legacy.data) return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
    tournamentId = legacy.data.tournament_id; expiresAt = legacy.data.expires_at
    const player = await supabase.from("rapid_tournament_players").select("id,full_name").eq("id", legacy.data.player_id).maybeSingle()
    if (player.error || !player.data) return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
    players = [{ id: player.data.id, name: player.data.full_name }]
  }
  const tournament = await supabase.from("rapid_tournaments").select("id,name,starts_at,status").eq("id", tournamentId).maybeSingle()
  if (tournament.error || !tournament.data || tournament.data.status === "finished") return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
  return NextResponse.json({ tournament: { id: tournament.data.id, name: tournament.data.name, startsAt: tournament.data.starts_at }, players, expiresAt }, { headers: { "Cache-Control": "no-store" } })
}
