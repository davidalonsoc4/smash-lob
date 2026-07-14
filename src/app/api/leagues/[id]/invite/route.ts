import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type InviteRequestBody = {
  code?: unknown
}

function normalizeInviteCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : ""
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params
  const body = (await request.json().catch(() => ({}))) as InviteRequestBody
  const code = normalizeInviteCode(body.code)

  if (!leagueId || !code) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, {
    requireAdmin: true,
  })

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    )
  }

  const { supabase, user } = access.actor

  try {
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
      console.warn(
        "No se ha podido guardar el histórico de invitación",
        inviteError
      )
    }

    return NextResponse.json({
      leagueId: league.id,
      inviteCode: league.invite_code,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "invite_regeneration_failed"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
