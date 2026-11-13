import "server-only"

import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { validateUuid } from "@/lib/serverRequest"

/** Service-role queries must check the season snapshot, including for admins. */
export async function getLeagueSeasonChatActor(seasonId: string) {
  if (!validateUuid(seasonId)) return { ok: false as const, status: 400, error: "invalid_season_id" }
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return auth
  const { supabase, user } = auth.actor
  const [season, participant] = await Promise.all([
    supabase.from("seasons").select("id,league_id,name,status").eq("id", seasonId).maybeSingle(),
    supabase.from("league_season_chat_participants").select("player_id,last_read_at").eq("season_id", seasonId).eq("user_id", user.id).maybeSingle(),
  ])
  if (season.error || participant.error) return { ok: false as const, status: 500, error: "league_chat_access_failed" }
  // Return the same response for absent seasons and nonparticipants.
  if (!season.data || !participant.data) return { ok: false as const, status: 404, error: "league_chat_not_found" }
  if (season.data.status === "upcoming") {
    const membership = await supabase.from("league_memberships").select("player_id").eq("league_id", season.data.league_id).eq("user_id", user.id).maybeSingle()
    if (membership.error) return { ok: false as const, status: 500, error: "league_chat_access_failed" }
    if (!membership.data?.player_id) return { ok: false as const, status: 404, error: "league_chat_not_found" }
    const roster = await supabase.from("season_players").select("player_id").eq("season_id", seasonId).eq("player_id", membership.data.player_id).maybeSingle()
    if (roster.error) return { ok: false as const, status: 500, error: "league_chat_access_failed" }
    if (!roster.data) return { ok: false as const, status: 404, error: "league_chat_not_found" }
  }
  return { ok: true as const, actor: auth.actor, season: season.data, participant: participant.data }
}
