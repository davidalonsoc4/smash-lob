import "server-only"
import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"
import { validateLeaguePairs, type LeagueModality, type LeaguePair } from "@/lib/fixedPairLeague"

export async function getServerLeagueModality(supabase: ServerLeagueActor["supabase"], leagueId: string): Promise<LeagueModality> {
  const { data, error } = await supabase.from("leagues").select("modality").eq("id", leagueId).maybeSingle()
  if (error || !data) throw new Error("league_modality_lookup_failed")
  return data.modality === "fixed_pairs" ? "fixed_pairs" : "individual"
}

export function pairsFromRoster(rows: { player_id: string; pair_number?: number | null; status?: string | null }[]): LeaguePair[] {
  const active = rows.filter(row => row.status !== "withdrawn")
  const groups = new Map<number, string[]>()
  for (const row of active) {
    if (!Number.isInteger(row.pair_number) || row.pair_number! < 1 || row.pair_number! > 16) throw new Error("invalid_fixed_pairs")
    const key = row.pair_number!
    groups.set(key, [...(groups.get(key) ?? []), row.player_id])
  }
  const pairs = [...groups.entries()].sort(([a], [b]) => a - b).map(([, ids]) => ids)
  if (!validateLeaguePairs(pairs, active.map(row => row.player_id))) throw new Error("invalid_fixed_pairs")
  return pairs
}

export async function getServerSeasonPairs(supabase: ServerLeagueActor["supabase"], seasonId: string) {
  const { data, error } = await supabase.from("season_players").select("player_id,pair_number,status").eq("season_id", seasonId)
  if (error) throw new Error("season_pairs_lookup_failed")
  return pairsFromRoster(data ?? [])
}
