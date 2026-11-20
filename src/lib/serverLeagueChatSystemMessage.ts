import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

export type LeagueSystemTextResult = { ok: true; row: { id: string } & Record<string, unknown> } | { ok: false; error: string; status: number }

/**
 * A text message signed by the league itself (not by the person who wrote it): a "Novedad" or a normal message. The caller must already have
 * checked that the user is the creator or an administrator. Novedades are capped at 5 per hour per chat, since each one notifies everybody; normal ones at 30 per minute.
 */
export async function sendLeagueSystemText({ supabase, leagueId, seasonId, body, announcement }: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
  body: string
  announcement: boolean
}): Promise<LeagueSystemTextResult> {
  const recent = await supabase.from("league_season_chat_messages").select("id", { count: "exact", head: true })
    .eq("season_id", seasonId).eq("is_system", true).eq("is_announcement", announcement)
    .gte("created_at", new Date(Date.now() - (announcement ? 3_600_000 : 60_000)).toISOString())
  if (recent.error) return { ok: false, error: "league_chat_write_failed", status: 500 }
  if ((recent.count ?? 0) >= (announcement ? 5 : 30)) return { ok: false, error: "league_chat_rate_limited", status: 429 }
  const league = await supabase.from("leagues").select("name").eq("id", leagueId).maybeSingle()
  const name = typeof league.data?.name === "string" && league.data.name.trim() ? league.data.name : "Liga"
  const sent = await supabase.rpc("send_league_system_text", { p_season_id: seasonId, p_sender_display_name: name, p_body: body, p_is_announcement: announcement })
  if (sent.error) {
    return sent.error.message.includes("season_chat_read_only")
      ? { ok: false, error: "league_chat_read_only", status: 409 }
      : { ok: false, error: "league_chat_write_failed", status: 500 }
  }
  return { ok: true, row: sent.data as { id: string } & Record<string, unknown> }
}
