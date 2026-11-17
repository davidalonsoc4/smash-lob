import { NextResponse } from "next/server"
import { recordApplicationAdminAudit } from "@/lib/serverApplicationAdminAudit"
import { adminFail, allLeaguesExist, parseTutorialFields, replaceTutorialLeagues, requireTutorialAdmin } from "@/lib/serverTutorialAdmin"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { TUTORIAL_BUCKET } from "@/lib/tutorialVideos"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ tutorialId: string }> }

/** Edit the text, the audience and the leagues of a tutorial. The video itself is not replaced here. */
export async function PATCH(request: Request, context: Context) {
  const auth = await requireTutorialAdmin()
  if (!auth.ok) return adminFail(auth.error, auth.status)
  const id = validateUuid((await context.params).tutorialId)
  const fields = parseTutorialFields(await parseJsonBody<Record<string, unknown>>(request))
  if (!id || !fields) return adminFail("invalid_tutorial", 400)
  if (!(await allLeaguesExist(auth.actor, fields.leagueIds))) return adminFail("invalid_tutorial", 400)
  const updated = await auth.actor.supabase
    .from("tutorial_videos")
    .update({ title: fields.title, description: fields.description, audience: fields.audience, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle()
  if (updated.error) return adminFail("tutorial_update_failed", 500)
  if (!updated.data) return adminFail("tutorial_not_found", 404)
  if (!(await replaceTutorialLeagues(auth.actor, id, fields.leagueIds))) return adminFail("tutorial_update_failed", 500)
  await recordApplicationAdminAudit({ supabase: auth.actor.supabase, actor: auth.actor.user, action: "tutorial_updated", metadata: { tutorialId: id, audience: fields.audience } })
  return NextResponse.json({ ok: true })
}

/** Deletes the tutorial and its files. Copies already shared in a chat are independent and stay. */
export async function DELETE(_request: Request, context: Context) {
  const auth = await requireTutorialAdmin()
  if (!auth.ok) return adminFail(auth.error, auth.status)
  const id = validateUuid((await context.params).tutorialId)
  if (!id) return adminFail("tutorial_not_found", 404)
  const found = await auth.actor.supabase.from("tutorial_videos").select("video_path,poster_path").eq("id", id).maybeSingle()
  if (found.error) return adminFail("tutorial_delete_failed", 500)
  if (!found.data) return adminFail("tutorial_not_found", 404)
  const removed = await auth.actor.supabase.from("tutorial_videos").delete().eq("id", id)
  if (removed.error) return adminFail("tutorial_delete_failed", 500)
  const paths = [found.data.video_path, found.data.poster_path].filter((path): path is string => typeof path === "string")
  await auth.actor.supabase.storage.from(TUTORIAL_BUCKET).remove(paths)
  await recordApplicationAdminAudit({ supabase: auth.actor.supabase, actor: auth.actor.user, action: "tutorial_deleted", metadata: { tutorialId: id } })
  return NextResponse.json({ ok: true })
}
