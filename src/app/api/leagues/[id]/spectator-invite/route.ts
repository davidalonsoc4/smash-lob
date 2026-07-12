import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { getPublicAppBaseUrl } from "@/lib/inviteUrls"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function generateSpectatorCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(12)
  const content = Array.from(bytes)
    .map((value) => alphabet[value % alphabet.length])
    .join("")

  return `SP-${content.slice(0, 4)}-${content.slice(4, 8)}-${content.slice(8, 12)}`
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leagueId } = await params
  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    )
  }

  const { supabase, user } = access.actor
  const { data: existingInvite, error: existingInviteError } = await supabase
    .from("spectator_invites")
    .select("id,code")
    .eq("league_id", leagueId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingInviteError) {
    return NextResponse.json(
      { error: existingInviteError.message },
      { status: 500 },
    )
  }

  let code = existingInvite?.code ?? null

  if (!code) {
    for (let attempt = 0; attempt < 8 && !code; attempt += 1) {
      const candidate = generateSpectatorCode()
      const { data: createdInvite, error: createError } = await supabase
        .from("spectator_invites")
        .insert({
          league_id: leagueId,
          code: candidate,
          created_by_user_id: user.id,
          is_active: true,
        })
        .select("code")
        .single()

      if (!createError && createdInvite?.code) {
        code = createdInvite.code
        break
      }

      if (createError?.code === "23505") {
        const { data: concurrentInvite } = await supabase
          .from("spectator_invites")
          .select("code")
          .eq("league_id", leagueId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (concurrentInvite?.code) {
          code = concurrentInvite.code
          break
        }

        continue
      }

      return NextResponse.json(
        { error: createError?.message ?? "spectator_invite_create_failed" },
        { status: 500 },
      )
    }
  }

  if (!code) {
    return NextResponse.json(
      { error: "spectator_invite_create_failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({
    code,
    url: `${getPublicAppBaseUrl()}/spectate/${encodeURIComponent(code)}`,
  })
}
