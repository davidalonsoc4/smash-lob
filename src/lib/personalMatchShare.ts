import { getPublicAppBaseUrl } from "@/lib/appUrl"

export function getPublicPersonalMatchUrl(code: string, request?: Request) {
  return new URL(
    `/spectate/match/${encodeURIComponent(code.trim())}`,
    getPublicAppBaseUrl(request),
  ).toString()
}

/** "Ana y Bea vs. Carla y Dani": identifies the match in the share dialog. */
export function formatPersonalMatchShareTitle(teams: [string[], string[]]) {
  const [first, second] = teams.map((team) => team.filter(Boolean).join(" y "))
  if (!first || !second) return null

  return `${first} vs. ${second}`
}

/** Client helper: asks the server for the (reusable) read-only link of a friendly. */
export async function createOrGetPersonalMatchShareLink(matchId: string) {
  const response = await fetch(
    `/api/personal-matches/${encodeURIComponent(matchId)}/share-link`,
    { method: "POST", cache: "no-store" },
  )

  if (!response.ok) {
    throw new Error(`personal_match_share_link_failed_${response.status}`)
  }

  return (await response.json()) as { code: string; url: string; title?: string | null }
}
