import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { isMatchClosedForAdvance } from "@/lib/progressiveCalendar"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"

type Actor = Parameters<typeof recordServerActorActivity>[0]["user"]
type Membership = Parameters<typeof recordServerActorActivity>[0]["membership"]

/**
 * Progressive calendar: when every match of a round is closed (played, cancelled, or postponed out of date),
 * the next round unlocks for everybody at once. The stored value only ever grows, so a round that was revealed
 * never locks again, and the announcement goes out once.
 */
export async function revealNextProgressiveRoundIfClosed({
  supabase,
  user,
  membership,
  leagueId,
  seasonId,
  round,
}: {
  supabase: SupabaseClient
  user: Actor
  membership: Membership
  leagueId: string
  seasonId: string
  round: number
}) {
  const { data: settings } = await supabase
    .from("season_settings")
    .select("calendar_visibility_mode,revealed_through_round")
    .eq("season_id", seasonId)
    .maybeSingle()
  if (settings?.calendar_visibility_mode !== "progressive") return false

  const { data: rows, error } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("season_id", seasonId)
    .eq("round", round)
  if (error) return false

  const roundMatches = (rows ?? []).map((row) => mapSupabaseMatch(row as Record<string, unknown>))
  if (!roundMatches.length || !roundMatches.every(isMatchClosedForAdvance)) return false

  const nextRound = round + 1
  const { data: nextRoundMatch } = await supabase
    .from("matches")
    .select("id")
    .eq("season_id", seasonId)
    .eq("round", nextRound)
    .limit(1)
    .maybeSingle()
  const stored = typeof settings.revealed_through_round === "number" ? settings.revealed_through_round : 0
  if (!nextRoundMatch || stored >= nextRound) return false

  const { data: revealed, error: revealError } = await supabase
    .from("season_settings")
    .update({ revealed_through_round: nextRound })
    .eq("season_id", seasonId)
    .lt("revealed_through_round", nextRound)
    .select("season_id")
    .maybeSingle()
  if (revealError || !revealed) return false

  const hasPostponed = roundMatches.some((match) => match.status === "postponed")
  await recordServerActorActivity({
    supabase,
    user,
    membership,
    leagueId,
    seasonId,
    type: "round_pairings_revealed",
    title: `Jornada ${nextRound} desbloqueada`,
    description: hasPostponed
      ? `La Jornada ${round} se ha cerrado (algún partido queda aplazado fuera de fecha). Ya puedes consultar los emparejamientos de la Jornada ${nextRound} y empezar a organizar el partido.`
      : `La Jornada ${round} ha terminado. Ya puedes consultar los emparejamientos de la Jornada ${nextRound} y empezar a organizar el partido.`,
    metadata: { round: nextRound, previousRound: round, reason: "previous_round_completed" },
  }).catch(() => null)
  return true
}
