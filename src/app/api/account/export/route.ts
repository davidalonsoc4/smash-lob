import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { applyPrivateNoStore } from "@/lib/serverResponse"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function ownRows(supabase: NonNullable<ReturnType<typeof import("@/lib/supabaseServer").createSupabaseServiceClient>>, table: string, column: string, userId: string) {
  const result = await supabase.from(table).select("*").eq(column, userId)
  if (result.error) throw new Error("account_export_query_failed")
  return (result.data ?? []) as Record<string, unknown>[]
}

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) return applyPrivateNoStore(NextResponse.json({ error: authResult.error }, { status: authResult.status }))
  const { supabase, user } = authResult.actor
  try {
    const memberships = await ownRows(supabase, "league_memberships", "user_id", user.id)
    const playerIds = [...new Set(memberships.map((row) => row.player_id).filter((id): id is string => typeof id === "string"))]
    const [seasonRows, personalMatches, preferences, subscriptions] = await Promise.all([
      playerIds.length ? supabase.from("season_players").select("*").in("player_id", playerIds) : { data: [], error: null },
      ownRows(supabase, "personal_matches", "created_by_user_id", user.id),
      ownRows(supabase, "notification_preferences", "user_email", user.email),
      ownRows(supabase, "push_subscriptions", "user_email", user.email),
    ])
    if (seasonRows.error) throw new Error("account_export_query_failed")
    return applyPrivateNoStore(NextResponse.json({ exportedAt: new Date().toISOString(), profile: user, memberships, seasonPlayers: seasonRows.data ?? [], personalMatches, notificationPreferences: preferences, pushSubscriptions: subscriptions }))
  } catch {
    return applyPrivateNoStore(NextResponse.json({ error: "account_export_failed" }, { status: 500 }))
  }
}
