import type { MvpManualSelection, MvpVote } from "@/lib/mvp"

type MvpDataPayload = {
  votes?: MvpVote[]
  manualSelections?: MvpManualSelection[]
}

type MatchMvpVotePayload = {
  vote?: MvpVote
  existingMatchAwardEvent?: boolean
  existingRoundAwardEvent?: boolean
}

export async function fetchSupabaseMvpData(leagueIds: string[]) {
  if (leagueIds.length === 0) {
    return {
      votes: [],
      manualSelections: [],
    }
  }

  const response = await fetch("/api/mvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leagueIds }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`mvp-data-api-${response.status}`)
  }

  const payload = (await response.json()) as MvpDataPayload

  return {
    votes: payload.votes ?? [],
    manualSelections: payload.manualSelections ?? [],
  }
}

export async function upsertSupabaseMvpVote(input: {
  matchId: string
  selectedPlayerId: string
}) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(input.matchId)}/mvp-vote`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedPlayerId: input.selectedPlayerId }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`match-mvp-vote-api-${response.status}`)
  }

  const payload = (await response.json()) as MatchMvpVotePayload

  if (!payload.vote) {
    throw new Error("match-mvp-vote-api-empty")
  }

  return {
    vote: payload.vote,
    existingMatchAwardEvent: Boolean(payload.existingMatchAwardEvent),
    existingRoundAwardEvent: Boolean(payload.existingRoundAwardEvent),
  }
}

export async function deleteSupabaseMvpVotesForMatch(matchId: string) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/mvp-votes`,
    {
      method: "DELETE",
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`match-mvp-vote-delete-api-${response.status}`)
  }
}

export async function saveSupabaseMvpManualSelection({
  leagueId,
  seasonId,
  scope,
  round,
  selectedPlayerId,
}: {
  leagueId: string
  seasonId: string
  scope: "round" | "season"
  round: number | null
  selectedPlayerId: string | null
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/mvp-selection`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope,
        round,
        selectedPlayerId,
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`mvp-manual-selection-api-${response.status}`)
  }
}
