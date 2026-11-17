import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { TUTORIAL_BUCKET, buildTutorialPath, getTutorialFileRule } from "@/lib/tutorialVideos"
import { adminFail, requireTutorialAdmin } from "@/lib/serverTutorialAdmin"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Step 1 of adding a tutorial: a one-use signed upload URL straight to private Storage (the superuser only). */
export async function POST(request: Request) {
  const rateLimited = await enforceRequestRateLimit({ request, scope: "tutorial_upload", limit: 20, windowMs: 60_000 })
  if (rateLimited) return rateLimited
  const auth = await requireTutorialAdmin()
  if (!auth.ok) return adminFail(auth.error, auth.status)
  const input = await parseJsonBody<{ contentType?: unknown; size?: unknown }>(request)
  const rule = getTutorialFileRule(input?.contentType)
  const size = typeof input?.size === "number" ? input.size : NaN
  if (!rule || !Number.isFinite(size) || size <= 0 || size > rule.maxBytes) return adminFail("invalid_media", 400)
  const path = buildTutorialPath(randomUUID(), input?.contentType as string)
  if (!path) return adminFail("invalid_media", 400)
  const signed = await auth.actor.supabase.storage.from(TUTORIAL_BUCKET).createSignedUploadUrl(path)
  if (signed.error || !signed.data?.token) return adminFail("tutorial_upload_failed", 500)
  return NextResponse.json({ path, uploadUrl: signed.data.signedUrl, kind: rule.kind }, { status: 201, headers: { "Cache-Control": "private, no-store" } })
}
