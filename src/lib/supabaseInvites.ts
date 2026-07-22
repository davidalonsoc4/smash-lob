import type { SeasonSnapshot } from "@/context/SeasonSettingsProvider"
import type { MatchData } from "@/context/MatchDataProvider"
import type { League, UserLeagueMembership } from "@/data/fakeData"

type ClaimPlayerResult =
  | { ok: true; membership: UserLeagueMembership }
  | {
      ok: false
      error:
        | "already-in-league"
        | "player-already-claimed"
        | "profile-incomplete"
        | "roster-full"
        | "registration-closed"
    }

export type SupabaseInviteSnapshot = {
  league: League
  claimedMemberships: UserLeagueMembership[]
  matches: MatchData[]
  seasonSnapshot: SeasonSnapshot
  claimablePlayerIds: string[]
}

function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase()
}

export async function fetchSupabaseInviteSnapshot(
  code: string,
  leagueIdHint?: string | null
): Promise<SupabaseInviteSnapshot | null> {
  const normalizedCode = normalizeInviteCode(code)

  if (!normalizedCode || typeof window === "undefined") {
    return null
  }

  const inviteUrl = new URL(
    `/api/invites/${encodeURIComponent(normalizedCode)}`,
    window.location.origin
  )
  const cleanLeagueIdHint = leagueIdHint?.trim()

  if (cleanLeagueIdHint) {
    inviteUrl.searchParams.set("leagueId", cleanLeagueIdHint)
  }

  const response = await fetch(inviteUrl.toString(), { cache: "no-store" })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`invite-api-${response.status}`)
  }

  const payload = (await response.json()) as {
    snapshot?: SupabaseInviteSnapshot | null
  }

  return payload.snapshot ?? null
}

export async function claimSupabasePlayer({
  code,
  leagueId,
  playerId,
}: {
  code: string
  leagueId: string
  playerId?: string
}): Promise<ClaimPlayerResult> {
  const normalizedCode = normalizeInviteCode(code)
  const response = await fetch(
    `/api/invites/${encodeURIComponent(normalizedCode)}/claim`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueId, playerId: playerId || null }),
      cache: "no-store",
    }
  )

  if (response.status === 409) {
    return (await response.json()) as ClaimPlayerResult
  }

  if (!response.ok) {
    throw new Error(`claim-api-${response.status}`)
  }

  return (await response.json()) as ClaimPlayerResult
}
