import { NextResponse } from "next/server"
import { recordApplicationAdminAudit } from "@/lib/serverApplicationAdminAudit"
import { listVisibleTutorials } from "@/lib/serverTutorials"
import {
  adminFail, allLeaguesExist, parseTutorialFields, replaceTutorialLeagues, requireTutorialAdmin,
  tutorialFileExists, validTutorialPaths,
} from "@/lib/serverTutorialAdmin"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const dimension = (value: unknown, max: number) =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= max ? value : null

/** Everything the management screen needs: all tutorials, view counts and the leagues that can be chosen. */
export async function GET() {
  const auth = await requireTutorialAdmin()
  if (!auth.ok) return adminFail(auth.error, auth.status)
  const [items, views, leagues] = await Promise.all([
    listVisibleTutorials(auth.actor),
    auth.actor.supabase.from("tutorial_video_views").select("tutorial_id"),
    auth.actor.supabase.from("leagues").select("id,name").order("name", { ascending: true }).limit(500),
  ])
  if (items === null || views.error || leagues.error) return adminFail("tutorials_failed", 500)
  const counts = new Map<string, number>()
  for (const view of views.data ?? []) counts.set(String(view.tutorial_id), (counts.get(String(view.tutorial_id)) ?? 0) + 1)
  return NextResponse.json(
    {
      tutorials: items.map((item) => ({ ...item, viewCount: counts.get(item.id) ?? 0 })),
      leagues: (leagues.data ?? []).map((league) => ({ id: String(league.id), name: String(league.name) })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}

/** Step 2: the files are already uploaded; this records the tutorial. */
export async function POST(request: Request) {
  const auth = await requireTutorialAdmin()
  if (!auth.ok) return adminFail(auth.error, auth.status)
  const input = await parseJsonBody<Record<string, unknown>>(request)
  const fields = parseTutorialFields(input)
  if (!fields || !input || !validTutorialPaths(input.videoPath, input.posterPath)) return adminFail("invalid_tutorial", 400)
  const videoPath = input.videoPath as string
  const posterPath = typeof input.posterPath === "string" ? input.posterPath : null
  if (!(await allLeaguesExist(auth.actor, fields.leagueIds))) return adminFail("invalid_tutorial", 400)
  if (!(await tutorialFileExists(auth.actor, videoPath)) || (posterPath && !(await tutorialFileExists(auth.actor, posterPath)))) {
    return adminFail("tutorial_file_missing", 400)
  }
  const last = await auth.actor.supabase.from("tutorial_videos").select("position").order("position", { ascending: false }).limit(1).maybeSingle()
  const created = await auth.actor.supabase
    .from("tutorial_videos")
    .insert({
      title: fields.title, description: fields.description, audience: fields.audience,
      position: ((last.data?.position as number | undefined) ?? 0) + 1,
      video_path: videoPath, poster_path: posterPath,
      width: dimension(input.width, 20000), height: dimension(input.height, 20000),
      duration_ms: typeof input.durationMs === "number" && input.durationMs >= 0 && input.durationMs <= 3_600_000 ? Math.round(input.durationMs) : null,
      created_by: auth.actor.user.id,
    })
    .select("id")
    .single()
  if (created.error || !created.data) return adminFail("tutorial_create_failed", 500)
  const id = String(created.data.id)
  if (!(await replaceTutorialLeagues(auth.actor, id, fields.leagueIds))) return adminFail("tutorial_create_failed", 500)
  await recordApplicationAdminAudit({ supabase: auth.actor.supabase, actor: auth.actor.user, action: "tutorial_created", metadata: { tutorialId: id, audience: fields.audience } })
  return NextResponse.json({ id }, { status: 201 })
}

/** New display order: the ids in the order they must appear. */
export async function PUT(request: Request) {
  const auth = await requireTutorialAdmin()
  if (!auth.ok) return adminFail(auth.error, auth.status)
  const input = await parseJsonBody<{ order?: unknown }>(request)
  const ids = Array.isArray(input?.order) ? input.order.map(validateUuid) : []
  if (!ids.length || ids.length > 200 || ids.some((id) => id === null) || new Set(ids).size !== ids.length) return adminFail("invalid_order", 400)
  for (const [index, id] of (ids as string[]).entries()) {
    const updated = await auth.actor.supabase.from("tutorial_videos").update({ position: index + 1, updated_at: new Date().toISOString() }).eq("id", id)
    if (updated.error) return adminFail("tutorial_order_failed", 500)
  }
  return NextResponse.json({ ok: true })
}
