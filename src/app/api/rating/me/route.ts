import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { summarizeRating } from "@/lib/rating"
import { loadRatingsOverview } from "@/lib/serverRatings"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Level of the signed-in person.
export async function GET() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  try {
    const { people } = await loadRatingsOverview(authResult.actor.supabase)
    const mine = people.find((person) => person.key === authResult.actor.user.id)
    return NextResponse.json({ userId: authResult.actor.user.id, rating: mine ? summarizeRating(mine) : null })
  } catch {
    return NextResponse.json({ error: "rating_failed" }, { status: 500 })
  }
}
