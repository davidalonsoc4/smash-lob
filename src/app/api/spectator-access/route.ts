import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ leagueIds: [] }, { status: 401 })
  }

  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return NextResponse.json({ leagueIds: [] }, { status: 501 })
  }

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (userError || !user) {
    return NextResponse.json({ leagueIds: [] })
  }

  const { data, error } = await supabase
    .from("league_spectators")
    .select("league_id")
    .eq("user_id", user.id)

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
