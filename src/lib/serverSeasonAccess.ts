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
  seasonId: string,
  options: { requireMutable?: boolean } = {},
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

  const status = normalizeSeasonStatus(data.status)
  if (options.requireMutable && status === "finished" && !access.actor.user.isSuperuser) {
    return { ok: false, status: 409, error: "season_finished_read_only" }
  }

  return {
    ok: true,
    actor: access.actor,
    season: {
      id: data.id,
      leagueId: data.league_id,
      name: data.name,
      status,
      totalRounds: Number(data.total_rounds),
      completedRounds: Number(data.completed_rounds),
    },
  }
}

export async function requireMutableSeasonForActor(
  actor: ServerLeagueActor,
  seasonId: string,
  leagueId?: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (actor.user.isSuperuser) return { ok: true }
  let query = actor.supabase.from("seasons").select("id,league_id,status").eq("id", seasonId)
  if (leagueId) query = query.eq("league_id", leagueId)
  const { data, error } = await query.maybeSingle()
  if (error) return { ok: false, status: 500, error: "season_lookup_failed" }
  if (!data) return { ok: false, status: 404, error: "season_not_found" }
  if (normalizeSeasonStatus(data.status) === "finished") return { ok: false, status: 409, error: "season_finished_read_only" }
  return { ok: true }
}
