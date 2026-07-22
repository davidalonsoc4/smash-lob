import type { UserLeagueMembership } from "@/data/fakeData"

export type SelfRegistrationResponse = {
  ok: true
  playerId: string
  registeredCount: number
  playerCapacity: number
  rosterComplete: boolean
  membership: UserLeagueMembership
}

async function readResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | null

  if (!response.ok || !payload) {
    throw new Error(payload?.error ?? `self-registration-api-${response.status}`)
  }

  return payload
}

export async function joinSeasonRoster(leagueId: string, seasonId: string) {
  return readResponse<SelfRegistrationResponse>(
    await fetch(
      `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/registration`,
      { method: "POST", cache: "no-store" },
    ),
  )
}

export async function leaveSeasonRoster(
  leagueId: string,
  seasonId: string,
  playerId?: string,
) {
  return readResponse<{ ok: true; registeredCount: number; playerCapacity: number }>(
    await fetch(
      `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/registration`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
        cache: "no-store",
      },
    ),
  )
}
