import "server-only"

import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"
import type { UserLeagueMembership } from "@/data/fakeData"

export type SelfRegistrationJoinResult = {
  playerId: string
  registeredCount: number
  playerCapacity: number
  rosterComplete: boolean
  membership: UserLeagueMembership
}

function toRole(value: unknown): UserLeagueMembership["role"] {
  return value === "creator" || value === "admin" ? value : "player"
}

export async function joinSelfRegistrationSeason({
  actor,
  leagueId,
  seasonId,
}: {
  actor: ServerLeagueActor
  leagueId: string
  seasonId: string
}): Promise<SelfRegistrationJoinResult> {
  const { data, error } = await actor.supabase.rpc(
    "server_join_self_registration_season",
    {
      p_user_id: actor.user.id,
      p_league_id: leagueId,
      p_season_id: seasonId,
    },
  )

  if (error || !Array.isArray(data) || !data[0]) {
    throw new Error(error?.message ?? "self_registration_join_failed")
  }

  const row = data[0] as {
    player_id: string
    registered_count: number
    player_capacity: number
    roster_complete: boolean
  }
  const { data: membership, error: membershipError } = await actor.supabase
    .from("league_memberships")
    .select("league_id,player_id,role")
    .eq("user_id", actor.user.id)
    .eq("league_id", leagueId)
    .single()

  if (membershipError || !membership?.player_id) {
    throw new Error("self_registration_membership_lookup_failed")
  }

  return {
    playerId: row.player_id,
    registeredCount: Number(row.registered_count),
    playerCapacity: Number(row.player_capacity),
    rosterComplete: Boolean(row.roster_complete),
    membership: {
      userId: actor.user.email,
      leagueId: membership.league_id,
      playerId: membership.player_id,
      role: toRole(membership.role),
    },
  }
}

export async function removeSelfRegistrationPlayer({
  actor,
  leagueId,
  seasonId,
  playerId,
}: {
  actor: ServerLeagueActor
  leagueId: string
  seasonId: string
  playerId: string
}) {
  const { data, error } = await actor.supabase.rpc(
    "server_remove_self_registration_player",
    {
      p_actor_user_id: actor.user.id,
      p_actor_is_superuser: actor.user.isSuperuser,
      p_league_id: leagueId,
      p_season_id: seasonId,
      p_player_id: playerId,
    },
  )

  if (error || !Array.isArray(data) || !data[0]) {
    throw new Error(error?.message ?? "self_registration_remove_failed")
  }

  const row = data[0] as {
    registered_count: number
    player_capacity: number
  }

  return {
    registeredCount: Number(row.registered_count),
    playerCapacity: Number(row.player_capacity),
  }
}
