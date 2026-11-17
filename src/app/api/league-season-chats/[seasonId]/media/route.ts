import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import {
  LEAGUE_CHAT_MEDIA_BUCKET,
  buildLeagueChatMediaPath,
  getLeagueChatMediaRule,
} from "@/lib/leagueChatMedia"
import { canPublishLeagueChatMedia } from "@/lib/serverLeagueChatMedia"
import { getLeagueSeasonChatActor } from "@/lib/serverLeagueSeasonChatAccess"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ seasonId: string }> }
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

/**
 * Step 1 of publishing a photo/video: the browser uploads straight to private Storage (a video is larger
 * than the serverless request limit), using a one-use signed upload URL that only the league creator gets.
 */
export async function POST(request: Request, context: Context) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "league_chat_media_upload",
    limit: 20,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited
  const { seasonId } = await context.params
  const access = await getLeagueSeasonChatActor(seasonId)
  if (!access.ok) return fail(access.error, access.status)
  if (access.season.status !== "active" && access.season.status !== "upcoming") {
    return fail("league_chat_read_only", 409)
  }
  const allowed = await canPublishLeagueChatMedia(access.actor, access.season.league_id)
  if (allowed === null) return fail("league_chat_access_failed", 500)
  if (!allowed) return fail("league_chat_media_forbidden", 403)

  const input = await parseJsonBody<{ contentType?: unknown; size?: unknown }>(request)
  const rule = getLeagueChatMediaRule(input?.contentType)
  const size = typeof input?.size === "number" ? input.size : NaN
  if (!rule || !Number.isFinite(size) || size <= 0 || size > rule.maxBytes) {
    return fail("invalid_media", 400)
  }
  const path = buildLeagueChatMediaPath(seasonId, randomUUID(), input?.contentType as string)
  if (!path) return fail("invalid_media", 400)

  const signed = await access.actor.supabase.storage.from(LEAGUE_CHAT_MEDIA_BUCKET).createSignedUploadUrl(path)
  if (signed.error || !signed.data?.token) return fail("league_chat_media_failed", 500)
  return NextResponse.json(
    { path, token: signed.data.token, uploadUrl: signed.data.signedUrl, kind: rule.kind },
    { status: 201, headers: { "Cache-Control": "private, no-store" } },
  )
}
