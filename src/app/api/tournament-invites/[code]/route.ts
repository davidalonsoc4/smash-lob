import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const limited = await enforceRequestRateLimit({ request, scope: "rapid_tournament_invite_preview", limit: 30, windowMs: 60_000 })
  if (limited) return limited
  const { code } = await params
  if (!/^[A-Za-z0-9_-]{43}$/.test(code)) return NextResponse.json({ error: "invite_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } })
  const supabase = createSupabaseServiceClient()
  if (!supabase) return NextResponse.json({ error: "invite_lookup_failed" }, { status: 501 })
  const codeHash = createHash("sha256").update(code).digest("hex")
  const { data: invite, error } = await supabase.from("rapid_tournament_invites").select("tournament_id,player_id,expires_at,claimed_at,revoked_at")
    .eq("code_hash", codeHash).gt("expires_at", new Date().toISOString()).is("claimed_at", null).is("revoked_at", null).maybeSingle()
  if (error || !invite) return NextResponse.json({ error: "invite_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } })
  const [tournamentResult, playerResult] = await Promise.all([
    supabase.from("rapid_tournaments").select("id,name,starts_at,status").eq("id", invite.tournament_id).maybeSingle(),
    supabase.from("rapid_tournament_players").select("full_name").eq("id", invite.player_id).maybeSingle(),
  ])
  if (tournamentResult.error || playerResult.error || !tournamentResult.data || !playerResult.data || tournamentResult.data.status === "finished") return NextResponse.json({ error: "invite_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } })
  return NextResponse.json({ tournament: { id: tournamentResult.data.id, name: tournamentResult.data.name, startsAt: tournamentResult.data.starts_at }, playerName: playerResult.data.full_name, expiresAt: invite.expires_at }, { headers: { "Cache-Control": "no-store" } })
}
