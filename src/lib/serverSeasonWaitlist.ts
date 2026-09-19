import "server-only"

// Supabase's fluent query builder is intentionally narrowed at the route boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WaitlistClient = { from: (table: string) => any }

export async function assertSeasonWaitlistEligible({
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
  const [{ data: season }, { data: settings }, { data: membership }] = await Promise.all([
    supabase.from("seasons").select("status").eq("id", seasonId).eq("league_id", leagueId).maybeSingle(),
    supabase.from("season_settings").select("registration_open,roster_mode,player_capacity").eq("season_id", seasonId).eq("league_id", leagueId).maybeSingle(),
    supabase.from("league_memberships").select("player_id").eq("league_id", leagueId).eq("user_id", userId).maybeSingle(),
  ])
  if (season?.status !== "upcoming" || settings?.registration_open !== true || settings?.roster_mode !== "self_registration") {
    throw new Error("waitlist_not_available")
  }
  if (membership?.player_id) {
    const { data: registered } = await supabase.from("season_players").select("player_id").eq("season_id", seasonId).eq("player_id", membership.player_id).maybeSingle()
    if (registered) throw new Error("already_registered")
  }
  const { count, error } = await supabase.from("season_players").select("player_id", { count: "exact", head: true }).eq("season_id", seasonId)
  if (error || typeof settings.player_capacity !== "number" || (count ?? 0) < settings.player_capacity) {
    throw new Error("waitlist_not_full")
  }
}

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
  const { data: last } = await supabase.from("season_waitlist").select("position").eq("season_id", seasonId).eq("status", "waiting").order("position", { ascending: false }).limit(1).maybeSingle()
  const nextPosition = typeof last?.position === "number" ? last.position + 1 : 1
  const { data, error } = await supabase.from("season_waitlist").upsert(
    { league_id: leagueId, season_id: seasonId, user_id: userId, status: "waiting", position: nextPosition },
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
