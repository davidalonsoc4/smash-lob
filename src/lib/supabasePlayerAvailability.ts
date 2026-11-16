import type { PlayerAvailability } from "@/lib/playerAvailability"

/**
 * Availability of the match participants. It is edited once, from the profile (Settings → My profile),
 * and the server only returns it when the match season uses availability recommendations.
 */
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
