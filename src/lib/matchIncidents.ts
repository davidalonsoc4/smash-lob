import type { MatchData } from "@/context/MatchDataProvider"

export type MatchIncidentType =
  | "injury"
  | "no_show"
  | "cancelled"
  | "disputed"
  | "other"

export type MatchIncidentStatus = "open" | "resolved"

export type MatchResolutionType =
  | "played"
  | "postponed"
  | "cancelled"
  | "no_show"
  | "abandoned"
  | "administrative"

export type MatchIncidentResolutionInput = {
  resolutionType: MatchResolutionType
  notes: string
  rankingCounts: boolean
  sets?: { a: number; b: number }[]
}

export const matchIncidentTypeLabels: Record<MatchIncidentType, string> = {
  injury: "Lesión o abandono",
  no_show: "No presentado",
  cancelled: "Partido cancelado",
  disputed: "Resultado impugnado",
  other: "Otra incidencia",
}

export const matchResolutionTypeLabels: Record<MatchResolutionType, string> = {
  played: "Partido jugado",
  postponed: "Aplazado",
  cancelled: "Cancelado sin resultado",
  no_show: "No presentado / resultado administrativo",
  abandoned: "Abandono durante el partido",
  administrative: "Resultado administrativo",
}

async function readMatch(response: Response, errorPrefix: string) {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(payload?.error || `${errorPrefix}-${response.status}`)
  }

  const payload = (await response.json()) as { match?: MatchData }

  if (!payload.match) {
    throw new Error(`${errorPrefix}-empty`)
  }

  return payload.match
}

export async function reportMatchIncident({
  matchId,
  incidentType,
  reason,
}: {
  matchId: string
  incidentType: MatchIncidentType
  reason: string
}) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/incident`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentType, reason }),
      cache: "no-store",
    },
  )

  return readMatch(response, "match-incident-report-api")
}

export async function resolveMatchIncident({
  matchId,
  resolution,
}: {
  matchId: string
  resolution: MatchIncidentResolutionInput
}) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/incident`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resolution),
      cache: "no-store",
    },
  )

  return readMatch(response, "match-incident-resolve-api")
}

export async function clearMatchIncident(matchId: string) {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/incident`,
    {
      method: "DELETE",
      cache: "no-store",
    },
  )

  return readMatch(response, "match-incident-clear-api")
}
