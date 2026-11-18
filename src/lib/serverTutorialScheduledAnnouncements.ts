import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { announceTutorialInLeagues } from "@/lib/serverTutorialChatShare"
import { TUTORIAL_FIELDS, type TutorialRow } from "@/lib/serverTutorials"

/**
 * Sends the league-chat notice of the tutorials whose scheduled moment has arrived. Runs from the periodic job, so
 * it goes out within a few minutes of publish_at. Each tutorial is claimed first (the flag is cleared in one
 * atomic update), so two overlapping runs can never announce the same one twice.
 */
export async function runScheduledTutorialAnnouncements({ supabase, now = new Date() }: { supabase: SupabaseClient; now?: Date }) {
  const summary = { tutorials: 0, posted: 0, skipped: 0 }
  const due = await supabase.from("tutorial_videos").select(`${TUTORIAL_FIELDS},created_by`)
    .eq("announce_on_publish", true).lte("publish_at", now.toISOString()).limit(20)
  if (due.error) return summary
  for (const row of (due.data ?? []) as unknown as (TutorialRow & { created_by: string | null })[]) {
    const claimed = await supabase.from("tutorial_videos").update({ announce_on_publish: false })
      .eq("id", row.id).eq("announce_on_publish", true).select("id")
    if (claimed.error || !claimed.data?.length) continue
    summary.tutorials += 1
    if (row.audience !== "leagues" || !row.created_by) continue
    const links = await supabase.from("tutorial_video_leagues").select("league_id").eq("tutorial_id", row.id).is("announced_at", null)
    const leagueIds = (links.data ?? []).map((link) => String(link.league_id))
    if (!leagueIds.length) continue
    const result = await announceTutorialInLeagues({
      supabase,
      user: { id: row.created_by, email: "admin@smashandlob.com", displayName: "Admin", isSuperuser: true },
      tutorial: row,
      leagueIds,
    })
    summary.posted += result.posted
    summary.skipped += result.skipped.length
  }
  return summary
}
