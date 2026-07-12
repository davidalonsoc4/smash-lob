export type SpectatorInviteSummary = {
  code: string
  leagueId: string
  leagueName: string
  leagueDescription: string
  leagueLogoUrl: string | null
  seasonName: string | null
  seasonStatus: "upcoming" | "active" | "finished" | null
}

export type LeagueSpectator = {
  userId: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  joinedAt: string
}

async function parseError(response: Response) {
  const body = (await response.json().catch(() => ({}))) as { error?: string }

  return body.error ?? `request_failed_${response.status}`
}

export async function createOrGetSpectatorInvite(leagueId: string) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/spectator-invite`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return (await response.json()) as { code: string; url: string }
}

export async function fetchSpectatorInvite(code: string) {
  const response = await fetch(
    `/api/spectator-invites/${encodeURIComponent(code)}`,
    { cache: "no-store" },
  )

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }

    throw new Error(await parseError(response))
  }

  const body = (await response.json()) as { invite: SpectatorInviteSummary }

  return body.invite
}

export async function acceptSpectatorInvite(code: string) {
  const response = await fetch(
    `/api/spectator-invites/${encodeURIComponent(code)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return (await response.json()) as {
    ok: true
    leagueId: string
    access: "member" | "spectator"
  }
}

export async function fetchLeagueSpectators(leagueId: string) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/spectators`,
    { cache: "no-store" },
  )

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const body = (await response.json()) as { spectators: LeagueSpectator[] }

  return body.spectators
}

export async function removeLeagueSpectator({
  leagueId,
  userId,
}: {
  leagueId: string
  userId: string
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/spectators`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    },
  )

  if (!response.ok) {
    throw new Error(await parseError(response))
  }
}
