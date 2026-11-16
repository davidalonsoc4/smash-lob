import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { sanitizePublicPersonalMatch } from "@/lib/publicPersonalMatch"
import type { PublicPersonalMatchPayload } from "@/lib/publicPersonalMatch"
import { normalizeSessionEmail } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { validateInviteCode } from "@/lib/serverRequest"
import { applyPrivateNoStore } from "@/lib/serverResponse"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const fail = (status: number, error: string) =>
  applyPrivateNoStore(NextResponse.json({ error }, { status }))

/**
 * Public, read-only view of a friendly reached through its share link. The
 * response is sanitized (see `sanitizePublicPersonalMatch`); the match id is
 * only disclosed to signed-in participants so the page can open the real match.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "public_personal_match_view",
    limit: 60,
    windowMs: 60_000,
  })
  if (rateLimited) return applyPrivateNoStore(rateLimited)

  const { code: rawCode } = await params
  const code = validateInviteCode(decodeURIComponent(rawCode ?? ""))
  if (!code) return fail(400, "invalid_code")

  const supabase = createSupabaseServiceClient()
  if (!supabase) return fail(501, "service_unavailable")

  const { data: link, error: linkError } = await supabase
    .from("personal_match_share_links")
    .select("match_id")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle()
  if (linkError) return fail(500, "personal_match_view_unavailable")
  if (!link) return fail(404, "share_link_not_found")

  const [matchResult, participantsResult] = await Promise.all([
    supabase
      .from("personal_matches")
      .select("id,played_at,location_name,sets,status")
      .eq("id", link.match_id)
      .maybeSingle(),
    supabase
      .from("personal_match_participants")
      .select("team,slot,user_id,display_name")
      .eq("match_id", link.match_id),
  ])
  if (matchResult.error || participantsResult.error) {
    return fail(500, "personal_match_view_unavailable")
  }
  if (!matchResult.data) return fail(404, "share_link_not_found")

  const participants = participantsResult.data ?? []
  let viewerIsParticipant = false
  const email = normalizeSessionEmail((await auth())?.user?.email)
  if (email) {
    const { data: viewer } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", email)
      .maybeSingle()
    viewerIsParticipant = Boolean(
      viewer?.id && participants.some((participant) => participant.user_id === viewer.id),
    )
  }

  const payload: PublicPersonalMatchPayload = {
    match: sanitizePublicPersonalMatch(matchResult.data, participants),
    viewer: viewerIsParticipant ? "participant" : "spectator",
    matchId: viewerIsParticipant ? matchResult.data.id : null,
  }

  return applyPrivateNoStore(NextResponse.json(payload))
}
