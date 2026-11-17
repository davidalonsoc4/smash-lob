import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { LEAGUE_CHAT_MEDIA_BUCKET } from "@/lib/leagueChatMedia"
import { canPublishLeagueChatMedia } from "@/lib/serverLeagueChatMedia"
import { getLeagueSeasonChatActor } from "@/lib/serverLeagueSeasonChatAccess"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { TUTORIAL_FIELDS, type TutorialRow } from "@/lib/serverTutorials"
import { TUTORIAL_BUCKET, type TutorialSummary } from "@/lib/tutorialVideos"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ seasonId: string }> }
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

/** Tutorials the creator may reuse in this league: the public ones and those limited to this league. Never drafts. */
async function eligibleTutorials(access: Extract<Awaited<ReturnType<typeof getLeagueSeasonChatActor>>, { ok: true }>) {
  const leagueId = access.season.league_id
  const [rows, links] = await Promise.all([
    access.actor.supabase.from("tutorial_videos").select(TUTORIAL_FIELDS).neq("audience", "draft").order("position", { ascending: true }).order("created_at", { ascending: true }),
    access.actor.supabase.from("tutorial_video_leagues").select("tutorial_id").eq("league_id", leagueId),
  ])
  if (rows.error || links.error) return null
  const linked = new Set((links.data ?? []).map((row) => String(row.tutorial_id)))
  return ((rows.data ?? []) as unknown as TutorialRow[]).filter((row) => row.audience === "public" || linked.has(row.id))
}

async function requireCreator(seasonId: string) {
  const access = await getLeagueSeasonChatActor(seasonId)
  if (!access.ok) return { error: fail(access.error, access.status) }
  if (access.season.status !== "active" && access.season.status !== "upcoming") return { error: fail("league_chat_read_only", 409) }
  const allowed = await canPublishLeagueChatMedia(access.actor, access.season.league_id)
  if (allowed === null) return { error: fail("league_chat_access_failed", 500) }
  if (!allowed) return { error: fail("league_chat_media_forbidden", 403) }
  return { access }
}

/** Lists the tutorials the league creator can share in this chat. */
export async function GET(_request: Request, context: Context) {
  const { seasonId } = await context.params
  const checked = await requireCreator(seasonId)
  if (!checked.access) return checked.error
  const rows = await eligibleTutorials(checked.access)
  if (rows === null) return fail("tutorials_failed", 500)
  const posterPaths = rows.flatMap((row) => (row.poster_path ? [row.poster_path] : []))
  const signed = posterPaths.length ? await checked.access.actor.supabase.storage.from(TUTORIAL_BUCKET).createSignedUrls(posterPaths, 3600) : null
  const posters = new Map((signed?.data ?? []).flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : [])))
  const tutorials: TutorialSummary[] = rows.map((row) => ({
    id: row.id, title: row.title, description: row.description, position: row.position,
    posterUrl: row.poster_path ? (posters.get(row.poster_path) ?? null) : null,
    width: row.width, height: row.height, durationMs: row.duration_ms, seen: false,
  }))
  return NextResponse.json({ tutorials }, { headers: { "Cache-Control": "private, no-store" } })
}

/**
 * Prepares a tutorial to be posted in the chat: copies its files into the chat bucket (so the message keeps
 * working on its own, even if the tutorial is later changed or deleted). The browser then sends the normal message.
 */
export async function POST(request: Request, context: Context) {
  const rateLimited = await enforceRequestRateLimit({ request, scope: "league_chat_tutorial_share", limit: 20, windowMs: 60_000 })
  if (rateLimited) return rateLimited
  const { seasonId } = await context.params
  const checked = await requireCreator(seasonId)
  if (!checked.access) return checked.error
  const tutorialId = validateUuid((await parseJsonBody<{ tutorialId?: unknown }>(request))?.tutorialId)
  if (!tutorialId) return fail("invalid_tutorial", 400)
  const rows = await eligibleTutorials(checked.access)
  if (rows === null) return fail("tutorials_failed", 500)
  const tutorial = rows.find((row) => row.id === tutorialId)
  if (!tutorial) return fail("tutorial_not_found", 404)

  const storage = checked.access.actor.supabase.storage.from(TUTORIAL_BUCKET)
  const mediaPath = `${seasonId}/${randomUUID()}.mp4`
  const copiedVideo = await storage.copy(tutorial.video_path, mediaPath, { destinationBucket: LEAGUE_CHAT_MEDIA_BUCKET })
  if (copiedVideo.error) return fail("tutorial_copy_failed", 500)
  let posterPath: string | null = null
  if (tutorial.poster_path) {
    const extension = tutorial.poster_path.split(".").pop() ?? "jpg"
    const candidate = `${seasonId}/${randomUUID()}.${extension}`
    const copiedPoster = await storage.copy(tutorial.poster_path, candidate, { destinationBucket: LEAGUE_CHAT_MEDIA_BUCKET })
    if (!copiedPoster.error) posterPath = candidate
  }
  return NextResponse.json(
    { mediaPath, posterPath, width: tutorial.width, height: tutorial.height, durationMs: tutorial.duration_ms, title: tutorial.title },
    { status: 201, headers: { "Cache-Control": "private, no-store" } },
  )
}
