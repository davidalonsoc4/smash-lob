import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function ownRows(supabase: NonNullable<ReturnType<typeof import("@/lib/supabaseServer").createSupabaseServiceClient>>, table: string, column: string, userId: string) {
  const result = await supabase.from(table).select("*").eq(column, userId)
  return result.error ? [] : result.data ?? []
}

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  const { supabase, user } = authResult.actor
  const [memberships, seasonPlayers, personalMatches, preferences, subscriptions] = await Promise.all([
    ownRows(supabase, "league_memberships", "player_id", user.id),
    ownRows(supabase, "season_players", "player_id", user.id),
    ownRows(supabase, "personal_matches", "created_by_user_id", user.id),
    ownRows(supabase, "notification_preferences", "user_id", user.id),
    ownRows(supabase, "push_subscriptions", "user_id", user.id),
  ])
  return NextResponse.json({ exportedAt: new Date().toISOString(), profile: user, memberships, seasonPlayers, personalMatches, notificationPreferences: preferences, pushSubscriptions: subscriptions })
}
