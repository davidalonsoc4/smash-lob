import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { validateInviteCode } from "@/lib/serverRequest"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { applyPrivateNoStore } from "@/lib/serverResponse"
import { expirePendingAccessIntentCookie } from "@/lib/serverPendingAccessIntent"
import { normalizeSpectatorInviteAppearance } from "@/lib/spectatorTheme"
import { auth } from "@/auth"
import { normalizeSessionEmail } from "@/lib/serverAuth"

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
    .select("id,league_id,code,is_active,created_at,theme_visual_style,theme_base,theme_palette,theme_competition_accent,theme_accent_color")
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
    .select("id,name,description,logo_url,accent_color,active_season_id")
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

  // Public spectator routes deliberately render without the authenticated app
  // providers. Resolve an existing member here so a signed-in member can keep
  // the full league experience without exposing account data to anonymous
  // viewers.
  let viewerAccess: "member" | "superuser" | null = null
  const session = await auth()
  const email = normalizeSessionEmail(session?.user?.email)
  if (email) {
    const { data: viewer } = await supabase
      .from("app_users")
      .select("id,is_superuser")
      .eq("email", email)
      .maybeSingle()

    if (viewer?.is_superuser) {
      viewerAccess = "superuser"
    } else if (viewer?.id) {
      const { data: membership } = await supabase
        .from("league_memberships")
        .select("id")
        .eq("league_id", league.id)
        .eq("user_id", viewer.id)
        .maybeSingle()

      if (membership) viewerAccess = "member"
    }
  }

  return {
    ok: true as const,
    supabase,
    invite,
    league,
    visibleSeason,
    viewerAccess,
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
        leagueAccentColor: result.league.accent_color ?? null,
        appearance: result.invite.theme_visual_style
          ? normalizeSpectatorInviteAppearance({
              visualStyle: result.invite.theme_visual_style,
              baseTheme: result.invite.theme_base,
              palette: result.invite.theme_palette,
              competitionAccent: result.invite.theme_competition_accent,
              accentColor: result.invite.theme_accent_color,
            })
          : null,
        viewerAccess: result.viewerAccess,
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

  return expirePendingAccessIntentCookie(
    NextResponse.json({
      ok: true,
      leagueId: league.id,
      access: playerMembership ? "member" : "spectator",
    }),
    request,
  )
}
