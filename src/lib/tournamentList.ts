import { createSessionResource } from "@/lib/sessionResource"

export const TOURNAMENT_LIST_ACCOUNT_HEADER = "x-smash-lob-tournament-account"
export type TournamentListItem = {
  id: string
  name: string
  description: string
  startsAt: string
  createdAt?: string
  status: "draft" | "in_progress" | "finished"
}

export function createTournamentList(email: string) {
  const account = encodeURIComponent(email.trim().toLowerCase())
  return createSessionResource(async signal => {
    const response = await fetch("/api/tournaments", {
      cache: "no-store", signal, headers: { [TOURNAMENT_LIST_ACCOUNT_HEADER]: account },
    })
    if (response.status === 401 || response.status === 403) return null
    if (!response.ok) throw new Error("tournaments_failed")
    const payload = await response.json() as { tournaments?: TournamentListItem[] }
    return Array.isArray(payload.tournaments) ? payload.tournaments : []
  })
}
