type PreviewMatch = { id: string; round: number; teamA: string[]; teamB: string[] }
export type MatchPreviewScope = "mine" | "league"

export function getHomeMatchPreviewScopes(personal?: PreviewMatch | null, league?: PreviewMatch | null): MatchPreviewScope[] {
  if (!personal) return league ? ["league"] : []
  if (!league) return ["mine"]
  const sameTeam = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index])
  const sameMatch = personal.id === league.id || (
    personal.round === league.round && sameTeam(personal.teamA, league.teamA) && sameTeam(personal.teamB, league.teamB)
  )
  return sameMatch ? ["mine"] : ["mine", "league"]
}
