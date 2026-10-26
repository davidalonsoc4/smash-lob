import type { PlayerProfile, SeasonPlayer } from "@/data/fakeData"
import { calculateSeasonRanking } from "@/lib/ranking"

type RankingInput = Parameters<typeof calculateSeasonRanking>[0]
type PairMatch = RankingInput["matches"][number] & { substitutions?: { originalPlayerId: string; substitutePlayerId: string }[] }

export function calculateLeaguePairRanking({ seasonId, playerProfiles, seasonPlayers, matches }: Omit<RankingInput, "matches"> & { matches: PairMatch[] }) {
  const roster = seasonPlayers.filter(row => row.seasonId === seasonId && row.pairNumber)
  const groups = new Map<number, SeasonPlayer[]>()
  for (const row of roster) groups.set(row.pairNumber!, [...(groups.get(row.pairNumber!) ?? []), row])
  const pairId = (number: number) => `pair-${number}`
  const teams = [...groups].map(([number, rows]) => {
    const active = rows.filter(row => row.status !== "withdrawn")
    const displayRows = [...active, ...rows.filter(row => row.status === "withdrawn" && !row.replacedByPlayerId)].slice(0, 2)
    const members = displayRows.flatMap(row => {
      const profile = playerProfiles.find(player => player.id === row.playerId)
      return profile ? [profile] : []
    })
    return { number, members, active: active.length > 0, profile: { ...members[0], id: pairId(number), slug: members[0]?.slug ?? "", displayName: members.map(member => member.displayName).join(" · "), avatarInitials: "", avatarUrl: null } as PlayerProfile }
  })
  // Team totals count each match once. A registered substitute inherits the team
  // of the remaining teammate. When both are substitutes, use their existing
  // substitution records, preserving the original pair's historical identity.
  const teamFor = (ids: string[], match: PairMatch) => {
    const originals = ids.map(id => {
      const visited = new Set<string>()
      while (!roster.some(row => row.playerId === id) && !visited.has(id)) {
        visited.add(id)
        const substitution = match.substitutions?.find(row => row.substitutePlayerId === id)
        if (!substitution) break
        id = substitution.originalPlayerId
      }
      return id
    })
    const numbers = [...new Set(originals.flatMap(id => roster.filter(row => row.playerId === id).map(row => row.pairNumber!)))]
    return numbers.length === 1 ? [pairId(numbers[0])] : []
  }
  const result = calculateSeasonRanking({
    seasonId,
    playerProfiles: teams.map(team => team.profile),
    seasonPlayers: teams.map(team => ({ seasonId, playerId: team.profile.id, status: team.active ? "active" : "withdrawn" })),
    matches: matches.filter(match => match.seasonId === seasonId).map(match => ({ ...match, teamA: teamFor(match.teamA, match), teamB: teamFor(match.teamB, match) })).filter(match => match.teamA.length === 1 && match.teamB.length === 1 && match.teamA[0] !== match.teamB[0]),
  })
  return result.map(row => ({ ...row, members: teams.find(team => team.profile.id === row.id)!.members }))
}
