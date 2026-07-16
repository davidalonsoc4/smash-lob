import type { LeagueMemberRole } from "@/data/fakeData"

export type LeagueUserManagementPlayer = {
  playerId: string
  displayName: string
  avatarInitials: string
  avatarUrl: string | null
  linkedUserId: string | null
  linkedUserEmail: string | null
  linkedUserDisplayName: string | null
  role: LeagueMemberRole | null
}

export async function fetchSupabaseLeagueUsers(
  leagueId: string
): Promise<LeagueUserManagementPlayer[]> {
  const response = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}/users`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`league-users-api-${response.status}`)
  }

  const payload = (await response.json()) as {
    items?: LeagueUserManagementPlayer[]
  }

  return payload.items ?? []
}

export async function updateSupabaseLeagueMembershipRole({
  leagueId,
  playerId,
  role,
}: {
  leagueId: string
  playerId: string
  role: Extract<LeagueMemberRole, "admin" | "player">
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/members/${encodeURIComponent(playerId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`membership-role-api-${response.status}`)
  }

  return (await response.json()) as {
    userId: string
    leagueId: string
    playerId: string
    role: LeagueMemberRole
  }
}

export async function unlinkSupabaseLeagueMembership({
  leagueId,
  playerId,
}: {
  leagueId: string
  playerId: string
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/members/${encodeURIComponent(playerId)}`,
    {
      method: "DELETE",
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`membership-delete-api-${response.status}`)
  }

  return (await response.json()) as {
    leagueId: string
    playerId: string
  }
}

export async function updateSupabasePlayerDisplayName({
  leagueId,
  playerId,
  displayName,
}: {
  leagueId: string
  playerId: string
  displayName: string
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/players/${encodeURIComponent(playerId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`player-name-api-${response.status}`)
  }

  return (await response.json()) as {
    playerId: string
    displayName: string
    avatarInitials: string
    avatarUrl: string | null
  }
}

export async function updateSupabasePlayerAvatar({
  leagueId,
  playerId,
  avatarUrl,
}: {
  leagueId: string
  playerId: string
  avatarUrl: string | null
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/players/${encodeURIComponent(playerId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`player-avatar-api-${response.status}`)
  }

  return (await response.json()) as {
    playerId: string
    displayName: string
    avatarInitials: string
    avatarUrl: string | null
    userId: string | null
  }
}
