import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { leagueIds: [] },
      { status: authResult.status }
    )
  }

  const {
    supabase,
    user: { id: userId },
  } = authResult.actor
  const { data, error } = await supabase
    .from("league_spectators")
    .select("league_id")
    .eq("user_id", userId)

  if (error) {
    return NextResponse.json({ leagueIds: [] })
  }

  return NextResponse.json({
    leagueIds: Array.from(
      new Set(
        (data ?? [])
          .map((row) => row.league_id)
          .filter((leagueId): leagueId is string => typeof leagueId === "string"),
      ),
    ),
  })
}
