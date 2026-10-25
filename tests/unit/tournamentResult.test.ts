import { describe, expect, it } from "vitest"
import { parseTournamentPoints } from "@/lib/tournamentResult"
import { calculateRapidStandings } from "@/lib/rapidTournament"
import { calculateMexicanoStandings } from "@/lib/dynamicMexicano"

describe("tournament point result contract", () => {
  it.each([[0, 1], [19, 19], [2_147_483_647, 2_147_483_647]])("accepts valid score %i/%i", (a, b) => {
    expect(parseTournamentPoints(a, b)).toEqual({ a, b })
  })
  it.each([[0, 0], [-1, 12], [12, -1], [1.5, 12], [NaN, 12], [Infinity, 12], [2_147_483_648, 12], ["12", 4], [null, 4]])("rejects invalid scores at every boundary", (a, b) => {
    expect(parseTournamentPoints(a, b)).toBeNull()
  })
  it("excludes invalid historical results from both rankings without losing pending matches", () => {
    const players = ["A", "B", "C", "D"]
    const matches = [{ id: "m1", round: 1, court: 1, teamA: ["A", "B"] as [string, string], teamB: ["C", "D"] as [string, string], scoreA: -1, scoreB: 12 }]
    expect(calculateRapidStandings(players, matches).every(row => row.played === 0 && row.pending === 1)).toBe(true)
    expect(calculateMexicanoStandings(players.map(id => ({ id, name: id })), matches.map(match => ({ ...match, teamAIds: match.teamA, teamBIds: match.teamB }))).every(row => row.played === 0)).toBe(true)
  })
})
