import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { validateInviteCode } from "@/lib/serverRequest"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { applyPrivateNoStore } from "@/lib/serverResponse"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

async function resolveInvite(code: string) {
  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return { ok: false as const, status: 501, error: "missing_service_role" }
  }

  const { data: invite, error: inviteError } = await supabase
    .from("spectator_invites")
    .select("id,league_id,code,is_active,created_at")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle()

  if (inviteError) {
    return { ok: false as const, status: 500, error: "spectator_invite_lookup_failed" }
  }

  if (!invite) {
    return { ok: false as const, status: 404, error: "invite_not_found" }
  }

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id,name,description,logo_url,active_season_id")
    .eq("id", invite.league_id)
    .single()

  if (leagueError) {
    return { ok: false as const, status: 500, error: "spectator_league_lookup_failed" }
  }

  const { data: seasons, error: seasonsError } = await supabase
    .from("seasons")
    .select("id,name,status")
    .eq("league_id", league.id)
    .order("name", { ascending: false })

  if (seasonsError) {
    return { ok: false as const, status: 500, error: "spectator_seasons_lookup_failed" }
  }

  const visibleSeason =
    (seasons ?? []).find((season) => season.id === league.active_season_id) ??
    (seasons ?? []).find((season) => season.status === "active") ??
    (seasons ?? []).find((season) => season.status === "upcoming") ??
    (seasons ?? [])[0] ??
    null

  return {
    ok: true as const,
    supabase,
    invite,
    league,
    visibleSeason,
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params
  const code = validateInviteCode(decodeURIComponent(rawCode ?? ""))

  if (!code) {
    return applyPrivateNoStore(
      NextResponse.json({ error: "invalid_code" }, { status: 400 }),
    )
  }

  const result = await resolveInvite(code)

  if (!result.ok) {
    return applyPrivateNoStore(
      NextResponse.json(
        { error: result.error },
        { status: result.status },
      ),
    )
  }

  return applyPrivateNoStore(
    NextResponse.json({
      invite: {
        code: result.invite.code,
        leagueId: result.league.id,
        leagueName: result.league.name,
        leagueDescription: result.league.description ?? "",
        leagueLogoUrl: result.league.logo_url ?? null,
        seasonName: result.visibleSeason?.name ?? null,
        seasonStatus: result.visibleSeason?.status ?? null,
      },
    }),
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "spectator_invite_claim",
    limit: 10,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const { code: rawCode } = await params
  const code = validateInviteCode(decodeURIComponent(rawCode ?? ""))

  if (!code) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 })
  }

  const result = await resolveInvite(code)

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    )
  }

  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    )
  }

  const {
    user: { id: userId },
  } = authResult.actor
  const { supabase, invite, league } = result
  const { data: playerMembership, error: membershipError } = await supabase
    .from("league_memberships")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", userId)
    .maybeSingle()

  if (membershipError) {
    return NextResponse.json(
      { error: "spectator_membership_lookup_failed" },
      { status: 500 },
    )
  }

  if (!playerMembership) {
    const { error: spectatorError } = await supabase
      .from("league_spectators")
      .upsert(
        {
          league_id: league.id,
          user_id: userId,
          spectator_invite_id: invite.id,
        },
        { onConflict: "league_id,user_id" },
      )

    if (spectatorError) {
      return NextResponse.json(
        { error: "spectator_access_upsert_failed" },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({
    ok: true,
    leagueId: league.id,
    access: playerMembership ? "member" : "spectator",
  })
}
