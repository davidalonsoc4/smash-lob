import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

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
  const body = await parseJsonBody<InviteRequestBody>(request)
  const code = normalizeInviteCode(body?.code)

  if (!validateUuid(leagueId) || !code) {
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
    const { data, error } = await supabase.rpc(
      "server_regenerate_league_invite",
      {
        p_league_id: leagueId,
        p_code: code,
        p_created_by_user_id: user.id,
      }
    )

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "invite_code_conflict" }, { status: 409 })
      }

      throw error
    }

    const result = Array.isArray(data) ? data[0] : data

    await recordServerActorActivity({
      supabase,
      user,
      membership: access.actor.membership,
      leagueId,
      type: "league_invite_regenerated",
      title: "Invitacion regenerada",
      description:
        "Se ha generado un nuevo código de invitación para la liga. Los enlaces anteriores dejan de ser válidos.",
      metadata: {
        inviteCode: result?.invite_code ?? code,
      },
    }).catch(() => null)

    return NextResponse.json({
      leagueId: result?.league_id ?? leagueId,
      inviteCode: result?.invite_code ?? code,
    })
  } catch {
    return NextResponse.json(
      { error: "invite_regeneration_failed" },
      { status: 500 }
    )
  }
}
