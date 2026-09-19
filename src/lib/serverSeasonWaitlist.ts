import "server-only"

// Supabase's fluent query builder is intentionally narrowed at the route boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WaitlistClient = { from: (table: string) => any }

export async function joinSeasonWaitlist({
  supabase,
  leagueId,
  seasonId,
  userId,
}: {
  supabase: WaitlistClient
  leagueId: string
  seasonId: string
  userId: string
}) {
  const { data, error } = await supabase.from("season_waitlist").upsert(
    { league_id: leagueId, season_id: seasonId, user_id: userId, status: "waiting" },
    { onConflict: "season_id,user_id", ignoreDuplicates: true },
  ).select("id,created_at,status").maybeSingle()
  if (error) throw new Error("waitlist_join_failed")
  return data
}

export async function leaveSeasonWaitlist({
  supabase,
  seasonId,
  userId,
}: {
  supabase: WaitlistClient
  seasonId: string
  userId: string
}) {
  const { error } = await supabase.from("season_waitlist").update({ status: "cancelled" }).eq("season_id", seasonId).eq("user_id", userId).eq("status", "waiting")
  if (error) throw new Error("waitlist_leave_failed")
}
