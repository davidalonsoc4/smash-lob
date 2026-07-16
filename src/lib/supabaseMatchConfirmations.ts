export type MatchResultConfirmationStatus = "confirmed" | "disputed"

export type MatchResultConfirmation = {
  matchId: string
  playerId: string
  status: MatchResultConfirmationStatus
  updatedAt: string
}

export async function fetchSupabaseMatchResultConfirmations(matchIds: string[]) {
  if (matchIds.length === 0) {
    return []
  }

  const response = await fetch("/api/result-confirmations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchIds }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`result-confirmations-api-${response.status}`)
  }

  const payload = (await response.json()) as {
    items?: MatchResultConfirmation[]
  }

  return payload.items ?? []
}

export async function upsertSupabaseMatchResultConfirmation(
  confirmation: {
    matchId: string
    status: MatchResultConfirmationStatus
  }
) {
  const response = await fetch(
    `/api/result-confirmations/${encodeURIComponent(confirmation.matchId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: confirmation.status }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`result-confirmation-save-api-${response.status}`)
  }

  const payload = (await response.json()) as {
    confirmation?: MatchResultConfirmation
  }

  if (!payload.confirmation) {
    throw new Error("result-confirmation-save-api-empty")
  }

  return payload.confirmation
}

export async function clearSupabaseMatchResultConfirmations(matchId: string) {
  const response = await fetch(
    `/api/result-confirmations/${encodeURIComponent(matchId)}`,
    {
      method: "DELETE",
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`result-confirmation-delete-api-${response.status}`)
  }
}
