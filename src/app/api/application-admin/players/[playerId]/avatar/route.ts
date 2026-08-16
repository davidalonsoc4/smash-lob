import { NextResponse } from "next/server"
import { recordApplicationAdminAudit } from "@/lib/serverApplicationAdminAudit"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { isValidAccountAvatarUrl, normalizeStoredImageUrl } from "@/lib/serverImageValidation"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = { avatarUrl?: unknown }

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> },
) {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }
  if (!authResult.actor.user.isSuperuser) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { playerId } = await params
  if (!validateUuid(playerId)) {
    return NextResponse.json({ error: "invalid_player_id" }, { status: 400 })
  }

  const body = await parseJsonBody<Body>(request)
  const rawAvatarUrl = body?.avatarUrl === null ? null : body?.avatarUrl
  if (rawAvatarUrl !== null && typeof rawAvatarUrl !== "string") {
    return NextResponse.json({ error: "invalid_avatar" }, { status: 400 })
  }
  if (!isValidAccountAvatarUrl(rawAvatarUrl)) {
    return NextResponse.json({ error: "invalid_avatar" }, { status: 400 })
  }
  const avatarUrl = rawAvatarUrl === null ? null : normalizeStoredImageUrl(rawAvatarUrl)
  if (rawAvatarUrl !== null && !avatarUrl) {
    return NextResponse.json({ error: "invalid_avatar" }, { status: 400 })
  }

  const { supabase } = authResult.actor
  const { data: player, error: lookupError } = await supabase
    .from("players")
    .select("id,league_id,display_name,competitive_avatar_url")
    .eq("id", playerId)
    .maybeSingle()
  if (lookupError || !player) {
    return NextResponse.json({ error: "player_not_found" }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from("players")
    .update({ competitive_avatar_url: avatarUrl })
    .eq("id", playerId)
  if (updateError) {
    return NextResponse.json({ error: "player_avatar_update_failed" }, { status: 500 })
  }

  const { data: membership } = await supabase
    .from("league_memberships")
    .select("user_id")
    .eq("player_id", playerId)
    .maybeSingle()

  await recordApplicationAdminAudit({
    supabase,
    actor: authResult.actor.user,
    action: "player_competitive_avatar_updated",
    targetUserId: typeof membership?.user_id === "string" ? membership.user_id : null,
    targetEmail: null,
    leagueId: String(player.league_id),
    metadata: {
      playerId,
      playerName: String(player.display_name ?? "Jugador"),
      hasOverride: Boolean(avatarUrl),
      previousHadOverride: Boolean(player.competitive_avatar_url),
      scope: "competitive_player",
    },
  }).catch(() => null)

  return NextResponse.json({ ok: true, playerId, competitiveAvatarUrl: avatarUrl })
}
