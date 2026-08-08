import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import {
  loadAccessiblePersonalMatchPeople,
  publicPersonalMatchPeople,
} from "@/lib/serverPersonalMatches"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const people = await loadAccessiblePersonalMatchPeople(authResult.actor)
    return NextResponse.json({ people: publicPersonalMatchPeople(people) })
  } catch {
    return NextResponse.json({ error: "personal_match_people_lookup_failed" }, { status: 500 })
  }
}
