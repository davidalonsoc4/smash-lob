import "server-only"

import { getServerLeagueActor, type ServerLeagueActor } from "@/lib/serverLeagueAccess"

type ServerSeasonStatus = "upcoming" | "active" | "finished"

export type ServerSeason = {
  id: string
  leagueId: string
  name: string
  status: ServerSeasonStatus
  totalRounds: number
  completedRounds: number
}

function normalizeSeasonStatus(value: unknown): ServerSeasonStatus {
  return value === "finished" || value === "upcoming" ? value : "active"
}

export async function getServerSeasonAdmin(
  leagueId: string,
  seasonId: string
): Promise<
  | {
      ok: true
      actor: ServerLeagueActor
      season: ServerSeason
    }
  | {
      ok: false
      status: number
      error: string
    }
> {
  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return access
  }

  const { supabase } = access.actor
  const { data, error } = await supabase
    .from("seasons")
    .select("id,league_id,name,status,total_rounds,completed_rounds")
    .eq("id", seasonId)
    .eq("league_id", leagueId)
    .maybeSingle()

  if (error) {
    return { ok: false, status: 500, error: "season_lookup_failed" }
  }

  if (!data) {
    return { ok: false, status: 404, error: "season_not_found" }
  }

  return {
    ok: true,
    actor: access.actor,
    season: {
      id: data.id,
      leagueId: data.league_id,
      name: data.name,
      status: normalizeSeasonStatus(data.status),
      totalRounds: Number(data.total_rounds),
      completedRounds: Number(data.completed_rounds),
    },
  }
}
