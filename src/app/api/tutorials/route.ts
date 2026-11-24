import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { listVisibleTutorials } from "@/lib/serverTutorials"
import type { TutorialSummary } from "@/lib/tutorialVideos"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Tutorials this person may see. Audience and league ids are management data: they are not sent. */
export async function GET() {
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const list = await listVisibleTutorials(auth.actor)
  if (list === null) return NextResponse.json({ error: "tutorials_failed" }, { status: 500 })
  const tutorials: TutorialSummary[] = list.map((item) => ({
    id: item.id, title: item.title, description: item.description, position: item.position,
    posterUrl: item.posterUrl, width: item.width, height: item.height, durationMs: item.durationMs, seen: item.seen, screen: item.screen ?? null,
  }))
  return NextResponse.json({ tutorials }, { headers: { "Cache-Control": "private, no-store" } })
}
