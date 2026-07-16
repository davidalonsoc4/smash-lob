import type { PlayerAvailability } from "@/lib/playerAvailability"

export async function fetchSupabasePlayerAvailability({
  leagueId,
  seasonId,
  playerId,
}: {
  leagueId: string;
  seasonId: string;
  playerId: string;
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/players/${encodeURIComponent(playerId)}/availability?seasonId=${encodeURIComponent(seasonId)}`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`player-availability-api-${response.status}`)
  }

  const payload = (await response.json()) as {
    availability?: PlayerAvailability | null
  }

  return payload.availability ?? null
}

export async function fetchSupabaseMatchPlayerAvailabilities({
  leagueId,
  matchId,
}: {
  leagueId: string;
  matchId: string;
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/matches/${encodeURIComponent(matchId)}/availability`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`match-availability-api-${response.status}`)
  }

  const payload = (await response.json()) as {
    items?: PlayerAvailability[]
  }

  return payload.items ?? []
}

export async function upsertSupabasePlayerAvailability({
  availability,
}: {
  availability: PlayerAvailability;
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(availability.leagueId)}/players/${encodeURIComponent(availability.playerId)}/availability`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seasonId: availability.seasonId,
        timezone: availability.timezone,
        weeklySlots: availability.weeklySlots,
        dateOverrides: availability.dateOverrides,
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`player-availability-save-api-${response.status}`)
  }

  const payload = (await response.json()) as {
    availability?: PlayerAvailability
  }

  if (!payload.availability) {
    throw new Error("player-availability-save-api-empty")
  }

  return payload.availability
}
