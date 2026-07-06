import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type InviteRequestBody = {
  code?: unknown
  email?: unknown
  displayName?: unknown
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function normalizeInviteCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : ""
}

function normalizeDisplayName(value: unknown) {
  const cleanValue = typeof value === "string" ? value.trim() : ""

  return cleanValue || null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params
  const body = (await request.json().catch(() => ({}))) as InviteRequestBody
  const code = normalizeInviteCode(body.code)
  const email = normalizeEmail(body.email)
  const displayName = normalizeDisplayName(body.displayName)

  if (!leagueId || !code || !email) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return NextResponse.json({ error: "missing_service_role" }, { status: 501 })
  }

  try {
    const { data: existingUser, error: existingUserError } = await supabase
      .from("app_users")
      .select("id,is_superuser,can_create_leagues,avatar_url")
      .eq("email", email)
      .maybeSingle()

    if (existingUserError) {
      throw existingUserError
    }

    const { data: user, error: userError } = await supabase
      .from("app_users")
      .upsert(
        {
          email,
          display_name: displayName,
          avatar_url: existingUser?.avatar_url ?? null,
          is_superuser: Boolean(existingUser?.is_superuser),
          can_create_leagues: Boolean(existingUser?.can_create_leagues),
        },
        { onConflict: "email" }
      )
      .select("id,is_superuser")
      .single()

    if (userError) {
      throw userError
    }

    const { data: membership, error: membershipError } = await supabase
      .from("league_memberships")
      .select("role")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (membershipError) {
      throw membershipError
    }

    const canRegenerateInvite =
      Boolean(user.is_superuser) ||
      membership?.role === "creator" ||
      membership?.role === "admin"

    if (!canRegenerateInvite) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .update({ invite_code: code })
      .eq("id", leagueId)
      .select("id,invite_code")
      .single()

    if (leagueError) {
      throw leagueError
    }

    const { error: inviteError } = await supabase.from("invites").insert({
      league_id: leagueId,
      code,
      created_by_user_id: user.id,
    })

    if (inviteError) {
      console.warn("No se ha podido guardar el histórico de invitación", inviteError)
    }

    return NextResponse.json({
      leagueId: league.id,
      inviteCode: league.invite_code,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "invite_regeneration_failed"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
