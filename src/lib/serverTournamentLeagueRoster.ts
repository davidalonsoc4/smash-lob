import "server-only"
import type { AuthenticatedAppUser } from "@/lib/serverAuth"
export type TournamentLeagueRosterEntry = { playerId: string; displayName: string; userId: string | null }
export async function getTournamentLeagueRoster(supabase: AuthenticatedAppUser["supabase"], leagueId: string, seasonId: string): Promise<{ players: TournamentLeagueRosterEntry[] | null; error: string | null }> {
  const season = await supabase.from("seasons").select("id,league_id").eq("id", seasonId).eq("league_id", leagueId).maybeSingle()
  if (season.error) return { players: null, error: "tournament_source_lookup_failed" }; if (!season.data) return { players: null, error: "tournament_source_not_found" }
  const roster = await supabase.from("season_players").select("player_id").eq("season_id", seasonId)
  if (roster.error) return { players: null, error: "tournament_source_lookup_failed" }; const playerIds = [...new Set((roster.data ?? []).map((row) => row.player_id).filter((id): id is string => typeof id === "string"))]
  const [memberships, accounts] = await Promise.all([playerIds.length ? supabase.from("league_memberships").select("player_id,user_id").eq("league_id", leagueId).in("player_id", playerIds).not("user_id", "is", null) : Promise.resolve({ data: [], error: null }), playerIds.length ? supabase.from("players").select("id,display_name").in("id", playerIds) : Promise.resolve({ data: [], error: null })])
  if (memberships.error || accounts.error) return { players: null, error: "tournament_source_lookup_failed" }
  const userIds = [...new Set((memberships.data ?? []).map((item) => item.user_id).filter((id): id is string => typeof id === "string"))], appUsers = userIds.length ? await supabase.from("app_users").select("id,suspended_at").in("id", userIds) : { data: [], error: null }
  if (appUsers.error) return { players: null, error: "tournament_source_lookup_failed" }; const accountByPlayer = new Map<string, string>(), activeUserIds = new Set((appUsers.data ?? []).filter((user) => !user.suspended_at).map((user) => user.id))
  for (const membership of memberships.data ?? []) if (membership.player_id && membership.user_id && activeUserIds.has(membership.user_id)) accountByPlayer.set(membership.player_id, membership.user_id)
  const nameByPlayer = new Map((accounts.data ?? []).map((player) => [player.id, player.display_name])), players = playerIds.map((playerId) => ({ playerId, displayName: nameByPlayer.get(playerId)?.trim() || "Jugador", userId: accountByPlayer.get(playerId) ?? null })).sort((a, b) => a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" }))
  return { players, error: null }
}
