import { normalizeLeagueLocations, type LeagueLocation } from "@/lib/leagueLocations"

type LeagueAdminUpdateResult = {
  leagueId: string
  name: string
  description: string
  logoUrl: string | null
  locations: LeagueLocation[]
  statusColorsEnabled: boolean
  showRankingAvatars: boolean
}

async function patchLeague(
  leagueId: string,
  payload: Record<string, unknown>
): Promise<LeagueAdminUpdateResult> {
  const response = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`update-league-api-${response.status}`)
  }

  return (await response.json()) as LeagueAdminUpdateResult
}

export async function updateSupabaseLeagueDetails({
  leagueId,
  name,
  description,
}: {
  leagueId: string
  name: string
  description: string
}) {
  const cleanName = name.trim()
  const cleanDescription = description.trim()

  if (!cleanName) {
    throw new Error("El nombre de la liga no puede estar vacio")
  }

  const data = await patchLeague(leagueId, {
    name: cleanName,
    description: cleanDescription,
  })

  return {
    leagueId: data.leagueId,
    name: data.name,
    description: data.description,
    logoUrl: data.logoUrl,
  }
}

export async function updateSupabaseLeagueLogo({
  leagueId,
  logoUrl,
}: {
  leagueId: string
  logoUrl: string | null
}) {
  const data = await patchLeague(leagueId, { logoUrl })

  return {
    leagueId: data.leagueId,
    logoUrl: data.logoUrl,
  }
}

export async function updateSupabaseLeagueLocations({
  leagueId,
  locations,
}: {
  leagueId: string
  locations: LeagueLocation[]
}) {
  const normalizedLocations = normalizeLeagueLocations(locations)
  const data = await patchLeague(leagueId, {
    locations: normalizedLocations,
  })

  return {
    leagueId: data.leagueId,
    locations: normalizeLeagueLocations(data.locations),
  }
}

export async function updateSupabaseLeagueStatusColorsEnabled({
  leagueId,
  enabled,
}: {
  leagueId: string
  enabled: boolean
}) {
  const data = await patchLeague(leagueId, {
    statusColorsEnabled: enabled,
  })

  return {
    leagueId: data.leagueId,
    statusColorsEnabled: data.statusColorsEnabled,
  }
}

export async function updateSupabaseLeagueShowRankingAvatars({
  leagueId,
  enabled,
}: {
  leagueId: string
  enabled: boolean
}) {
  const data = await patchLeague(leagueId, {
    showRankingAvatars: enabled,
  })

  return {
    leagueId: data.leagueId,
    showRankingAvatars: data.showRankingAvatars,
  }
}

export async function regenerateSupabaseLeagueInviteCode({
  leagueId,
  code,
}: {
  leagueId: string
  code: string
  email: string
  displayName?: string | null
}) {
  const normalizedCode = code.trim().toUpperCase()
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/invite`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: normalizedCode }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`regenerate-invite-api-${response.status}`)
  }

  return (await response.json()) as {
    leagueId: string
    inviteCode: string
  }
}

export async function deleteSupabaseLeague({
  leagueId,
}: {
  leagueId: string
  email: string
  displayName?: string | null
}) {
  const response = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}`, {
    method: "DELETE",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`delete-league-api-${response.status}`)
  }

  return (await response.json()) as { leagueId: string }
}
