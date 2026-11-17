import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { validateUuid } from "@/lib/serverRequest"
import { getVisibleTutorial } from "@/lib/serverTutorials"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Context = { params: Promise<{ tutorialId: string }> }

/** Marks a tutorial as seen by the signed-in person (only if they may see it). */
export async function POST(_request: Request, context: Context) {
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const tutorialId = validateUuid((await context.params).tutorialId)
  if (!tutorialId) return NextResponse.json({ error: "tutorial_not_found" }, { status: 404 })
  const found = await getVisibleTutorial(auth.actor, tutorialId)
  if (found.status === "not_found") return NextResponse.json({ error: "tutorial_not_found" }, { status: 404 })
  if (found.status === "error") return NextResponse.json({ error: "tutorials_failed" }, { status: 500 })
  const saved = await auth.actor.supabase
    .from("tutorial_video_views")
    .upsert({ tutorial_id: tutorialId, user_id: auth.actor.user.id, seen_at: new Date().toISOString() }, { onConflict: "tutorial_id,user_id" })
  if (saved.error) return NextResponse.json({ error: "tutorials_failed" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
