import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { loadRatingsOverview } from "@/lib/serverRatings"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// The level is hidden while it is being tuned: only the superuser gets an answer, everyone else a plain 404.
export async function GET() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  if (!authResult.actor.user.isSuperuser) return NextResponse.json({ error: "not_found" }, { status: 404 })
  try {
    const { people } = await loadRatingsOverview(authResult.actor.supabase)
    const mine = people.find((person) => person.key === authResult.actor.user.id)
    return NextResponse.json({ userId: authResult.actor.user.id, rating: mine ? { level: mine.level, rating: mine.rating, matches: mine.matches, wins: mine.wins, provisional: mine.provisional } : null })
  } catch {
    return NextResponse.json({ error: "rating_failed" }, { status: 500 })
  }
}
