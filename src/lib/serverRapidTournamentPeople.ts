import "server-only"
import type { AuthenticatedAppUser } from "@/lib/serverAuth"
export type RapidTournamentSelectablePerson = { userId: string; displayName: string }
export async function getRapidTournamentSelectablePeople(
  supabase: AuthenticatedAppUser["supabase"],
  currentUserId: string,
): Promise<{ people: RapidTournamentSelectablePerson[] | null; error: string | null }> {
  const ownMemberships = await supabase
    .from("league_memberships")
    .select("league_id")
    .eq("user_id", currentUserId)
    .not("player_id", "is", null)
  if (ownMemberships.error) return { people: null, error: "tournament_people_lookup_failed" }
  const leagueIds = [...new Set((ownMemberships.data ?? []).map((item) => item.league_id).filter((id): id is string => typeof id === "string"))]
  if (!leagueIds.length) return { people: [], error: null }
  const memberships = await supabase
    .from("league_memberships")
    .select("user_id,player_id")
    .in("league_id", leagueIds)
    .not("user_id", "is", null)
    .not("player_id", "is", null)
  if (memberships.error) return { people: null, error: "tournament_people_lookup_failed" }
  const userIds = [...new Set((memberships.data ?? [])
    .map((item) => item.user_id)
    .filter((id): id is string => typeof id === "string" && id !== currentUserId))]
  if (!userIds.length) return { people: [], error: null }
  const playerIds = [...new Set((memberships.data ?? [])
    .filter((item) => typeof item.user_id === "string" && userIds.includes(item.user_id))
    .map((item) => item.player_id)
    .filter((id): id is string => typeof id === "string"))]
  const [usersResult, playersResult] = await Promise.all([
    supabase.from("app_users").select("id,display_name,first_name,last_name,suspended_at").in("id", userIds),
    playerIds.length ? supabase.from("players").select("id,display_name").in("id", playerIds) : Promise.resolve({ data: [], error: null }),
  ])
  if (usersResult.error || playersResult.error) return { people: null, error: "tournament_people_lookup_failed" }
  const fallbackNameByUserId = new Map<string, string>()
  const playerNames = new Map((playersResult.data ?? []).map((player) => [String(player.id), String(player.display_name ?? "")]))
  for (const membership of memberships.data ?? []) {
    if (typeof membership.user_id === "string" && typeof membership.player_id === "string" && !fallbackNameByUserId.has(membership.user_id)) {
      fallbackNameByUserId.set(membership.user_id, playerNames.get(membership.player_id) ?? "")
    }
  }
  const people = (usersResult.data ?? [])
    .filter((user) => typeof user.id === "string" && !user.suspended_at)
    .map((user) => ({
      userId: String(user.id),
      displayName: (typeof user.display_name === "string" && user.display_name.trim())
        || [user.first_name, user.last_name].filter((part): part is string => typeof part === "string" && Boolean(part.trim())).join(" ")
        || fallbackNameByUserId.get(String(user.id))
        || "Jugador",
    }))
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "es", { sensitivity: "base" }))
  return { people, error: null }
}
