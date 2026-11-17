import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { validateUuid } from "@/lib/serverRequest"
import { getVisibleTutorial, signTutorialPaths } from "@/lib/serverTutorials"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ tutorialId: string }> }

/** The signed link of one video, issued only to someone who may see that tutorial. */
export async function GET(_request: Request, context: Context) {
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const tutorialId = validateUuid((await context.params).tutorialId)
  if (!tutorialId) return NextResponse.json({ error: "tutorial_not_found" }, { status: 404 })
  const found = await getVisibleTutorial(auth.actor, tutorialId)
  if (found.status === "not_found") return NextResponse.json({ error: "tutorial_not_found" }, { status: 404 })
  if (found.status === "error") return NextResponse.json({ error: "tutorials_failed" }, { status: 500 })
  const urls = await signTutorialPaths(auth.actor, [found.row.video_path])
  const videoUrl = urls?.get(found.row.video_path)
  if (!videoUrl) return NextResponse.json({ error: "tutorials_failed" }, { status: 500 })
  return NextResponse.json({ videoUrl }, { headers: { "Cache-Control": "private, no-store" } })
}
