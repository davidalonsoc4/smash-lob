import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeCode(value: string) {
  return value.trim().toUpperCase()
}

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
    return { ok: false as const, status: 500, error: inviteError.message }
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
    return { ok: false as const, status: 500, error: leagueError.message }
  }

  const { data: seasons, error: seasonsError } = await supabase
    .from("seasons")
    .select("id,name,status")
    .eq("league_id", league.id)
    .order("name", { ascending: false })

  if (seasonsError) {
    return { ok: false as const, status: 500, error: seasonsError.message }
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
  const code = normalizeCode(decodeURIComponent(rawCode ?? ""))

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

  return NextResponse.json({
    invite: {
      code: result.invite.code,
      leagueId: result.league.id,
      leagueName: result.league.name,
      leagueDescription: result.league.description ?? "",
      leagueLogoUrl: result.league.logo_url ?? null,
      seasonName: result.visibleSeason?.name ?? null,
      seasonStatus: result.visibleSeason?.status ?? null,
    },
  })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth()
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }

  const { code: rawCode } = await params
  const code = normalizeCode(decodeURIComponent(rawCode ?? ""))
  const result = await resolveInvite(code)

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    )
  }

  const { supabase, invite, league } = result
  const { data: existingUser, error: existingUserError } = await supabase
    .from("app_users")
    .select("id,is_superuser,can_create_leagues,avatar_url,display_name")
    .eq("email", email)
    .maybeSingle()

  if (existingUserError) {
    return NextResponse.json(
      { error: existingUserError.message },
      { status: 500 },
    )
  }

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .upsert(
      {
        email,
        display_name: session?.user?.name?.trim() || existingUser?.display_name || null,
        avatar_url: session?.user?.image ?? existingUser?.avatar_url ?? null,
        is_superuser: Boolean(existingUser?.is_superuser),
        can_create_leagues: Boolean(existingUser?.can_create_leagues),
      },
      { onConflict: "email" },
    )
    .select("id")
    .single()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  const { data: playerMembership, error: membershipError } = await supabase
    .from("league_memberships")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    return NextResponse.json(
      { error: membershipError.message },
      { status: 500 },
    )
  }

  if (!playerMembership) {
    const { error: spectatorError } = await supabase
      .from("league_spectators")
      .upsert(
        {
          league_id: league.id,
          user_id: user.id,
          spectator_invite_id: invite.id,
        },
        { onConflict: "league_id,user_id" },
      )

    if (spectatorError) {
      return NextResponse.json(
        { error: spectatorError.message },
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
