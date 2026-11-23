import "server-only"

import { isCoinTossOpenNoticeDue } from "@/lib/matchCoinToss"
import type { createSupabaseServiceClient } from "@/lib/supabaseServer"

type SupabaseServiceClient = NonNullable<ReturnType<typeof createSupabaseServiceClient>>

type CoinTossNoticeMatch = {
  id: string
  league_id: string
  season_id: string
  round: number
  team_a: string[] | null
  team_b: string[] | null
  scheduled_at: string | null
  result_recorded_at: string | null
}

/**
 * "You can toss the coin now" for the matches of the leagues whose toss has just opened: one activity event per match (the push goes out
 * from it), only if nobody has tossed the coin yet. It never stops the rest of the reminders: if something fails, it creates nothing.
 */
export async function createCoinTossOpenEvents({ supabase, matches, now }: { supabase: SupabaseServiceClient; matches: CoinTossNoticeMatch[]; now: Date }) {
  const candidates = matches.filter((match) => !match.result_recorded_at && isCoinTossOpenNoticeDue(match.scheduled_at, now.getTime()))
  if (candidates.length === 0) return []

  try {
    const ids = candidates.map((match) => match.id)
    const [tossed, noticed] = await Promise.all([
      supabase.from("match_coin_tosses").select("match_id").in("match_id", ids),
      supabase.from("activity_events").select("match_id").eq("type", "match_coin_toss_open").in("match_id", ids),
    ])
    if (tossed.error || noticed.error) return []

    const skipped = new Set([...(tossed.data ?? []), ...(noticed.data ?? [])].map((row) => String((row as { match_id: string }).match_id)))
    const eventIds: string[] = []
    for (const match of candidates) {
      if (skipped.has(match.id)) continue
      const { data, error } = await supabase
        .from("activity_events")
        .insert({
          league_id: match.league_id,
          season_id: match.season_id,
          match_id: match.id,
          actor_user_id: null,
          actor_email: "system@smash-lob.local",
          actor_display_name: "Smash & Lob",
          type: "match_coin_toss_open",
          title: "Sorteo del saque",
          description: "Ya puedes sortear el saque de tu partido.",
          metadata: {
            round: match.round,
            participantIds: [...(match.team_a ?? []), ...(match.team_b ?? [])],
            scheduledAt: match.scheduled_at,
            automatic: true,
          },
        })
        .select("id")
        .single()
      if (!error && data) eventIds.push((data as { id: string }).id)
    }
    return eventIds
  } catch {
    return []
  }
}
