import { describe, expect, it } from "vitest"
import { calculateFixedRapidStandings, generateFixedAmericanaFixtures, generateFixedRapidRound, validateFixedTournamentTeams, type FixedTournamentTeam } from "@/lib/fixedRapidTournament"
import { buildRapidScheduleChecks, calculateRapidStandings } from "@/lib/rapidTournament"
import type { MexicanoMatch } from "@/lib/dynamicMexicano"

const roster = (count: number): FixedTournamentTeam[] => Array.from({ length: count / 2 }, (_, i) => ({ id: `team-${i}`, playerIds: [`p${i * 2}`, `p${i * 2 + 1}`] }))
const members = (teams: FixedTournamentTeam[]) => teams.flatMap(team => [...team.playerIds])
const teamKey = (ids: readonly string[]) => [...ids].sort().join("/")

describe("fixed-pair rapid tournaments", () => {
  it.each([4,6,8,10,12,14,16,18,20,22,24,26,28,30,32])("generates balanced complete rounds for %i players", count => {
    const teams = roster(count), courts = 2, rounds = 12
    const history = generateFixedAmericanaFixtures(teams, courts, rounds, 19)
    expect(history).toEqual(generateFixedAmericanaFixtures(teams, courts, rounds, 19))
    expect(history).toHaveLength(rounds * Math.min(courts, Math.floor(count / 4)))
    const valid = new Set(teams.map(team => teamKey(team.playerIds)))
    for (let round = 1; round <= rounds; round++) {
      const games = history.filter(match => match.round === round)
      const playing = games.flatMap(match => [...match.teamAIds, ...match.teamBIds])
      expect(new Set(playing).size).toBe(playing.length)
      expect(new Set(games.map(match => match.court)).size).toBe(games.length)
      for (const match of games) for (const pair of [match.teamAIds,match.teamBIds]) expect(valid.has(teamKey(pair))).toBe(true)
    }
    const played = members(teams).map(id => history.filter(match => [...match.teamAIds,...match.teamBIds].includes(id)).length)
    expect(Math.max(...played) - Math.min(...played)).toBeLessThanOrEqual(1)
  })
  it("uses every opponent before rematches when four fixed pairs play on two courts", () => {
    const history = generateFixedAmericanaFixtures(roster(8),2,3,7)
    const rivals = new Set(history.map(match => [teamKey(match.teamAIds), teamKey(match.teamBIds)].sort().join(" vs ")))
    expect(rivals.size).toBe(6)
    const courtDifferences = members(roster(8)).map(id => {
      const courts = history.filter(match => [...match.teamAIds,...match.teamBIds].includes(id)).map(match => match.court)
      return Math.abs(courts.filter(court => court === 1).length - courts.filter(court => court === 2).length)
    })
    // With four pairs and all three distinct perfect matchings of K4, any choice
    // of one match per court leaves one pair on the same court for all rounds.
    expect(Math.max(...courtDifferences)).toBe(3)
    expect(history.filter(match => match.court === 1)).toHaveLength(3)
    expect(history.filter(match => match.court === 2)).toHaveLength(3)
    const audit=buildRapidScheduleChecks(members(roster(8)).map(id=>({id,name:id})),history,{players:8,courts:2,rounds:3,roundMinutes:10,transitionMinutes:2,preparationMinutes:2,reservationMinutes:60})
    expect(audit.passed).toBe(true)
    expect(audit.checks.find(check=>check.id==="player-court-balance")?.passed).toBe(false)
  })
  it("does not repeat a rest when six pairs can rotate through two courts", () => {
    const history = generateFixedAmericanaFixtures(roster(12),2,9,31)
    for (let round = 2; round <= 9; round++) {
      const playing = (r: number) => new Set(history.filter(match => match.round === r).flatMap(match => [...match.teamAIds,...match.teamBIds]))
      expect(members(roster(12)).filter(id => !playing(round).has(id) && !playing(round - 1).has(id))).toEqual([])
    }
  })
  it("creates dynamic fixed-pair rounds deterministically, with complete-score gates", () => {
    const teams = roster(24), history: MexicanoMatch[] = []
    for (let round = 1; round <= 9; round++) {
      const input = { teams, history, round, courts: 4, seed: 31, format: "dynamic_mexicano" as const }
      const next = generateFixedRapidRound(input)
      expect(generateFixedRapidRound(input)).toEqual(next)
      history.push(...next.matches.map(match => ({ ...match, round, scoreA: 20, scoreB: 12 })))
    }
    expect(calculateFixedRapidStandings(teams,history,"dynamic_mexicano").map(row => row.played)).toEqual(Array(12).fill(6))
    const incomplete = history.map((match,i) => i === history.length - 1 ? { ...match, scoreA: null } : match)
    expect(() => generateFixedRapidRound({ teams, history: incomplete, round: 10, courts: 4, seed: 31, format: "dynamic_mexicano" })).toThrow("previous_round_incomplete")
  })
  it("counts points once per pair and retains shared sporting positions", () => {
    const teams = roster(8), history = generateFixedAmericanaFixtures(teams,2,1,9).map(match => ({ ...match, scoreA: 16, scoreB: 12 }))
    const ranking = calculateFixedRapidStandings(teams,history,"balanced_americana")
    expect(ranking.map(row => row.position)).toEqual([1,1,3,3])
    expect(ranking[0]).toMatchObject({ played: 1, wins: 1, pointsFor: 16, pointsAgainst: 12 })
    expect(ranking[0].averagePercent).toBeCloseTo(100 * 16 / 28)
    expect(calculateFixedRapidStandings(teams,history,"dynamic_mexicano")[0].rating).toBeCloseTo(100 * 19 / 34)
  })
  it("rejects partial, duplicated or changing fixed pairs and corrupt chronology", () => {
    const teams = roster(8), ids = members(teams)
    expect(validateFixedTournamentTeams(ids,teams)).toBe(true)
    expect(validateFixedTournamentTeams(ids,[...teams.slice(0,3),teams[0]])).toBe(false)
    expect(validateFixedTournamentTeams(ids.slice(0,7),teams)).toBe(false)
    const history = generateFixedAmericanaFixtures(teams,2,1,1)
    const changed = history.map((match,i) => i === 0 ? { ...match, teamAIds: ["p0","p2"] as [string,string] } : match)
    expect(() => calculateFixedRapidStandings(teams,changed,"balanced_americana")).toThrow("invalid_fixed_history")
    expect(() => generateFixedRapidRound({ teams, history, round: 1, courts: 2, seed: 1, format: "balanced_americana" })).toThrow("invalid_fixed_history")
  })
  it("keeps percentages finite with 100 large-score results while comparing exact fractions", () => {
    const games = Array.from({ length: 100 }, (_, i) => ({ teamA: ["a"], teamB: ["b"], scoreA: 1_000_000_007 + i * 2, scoreB: 1_000_000_000 + i * 3 }))
    const result = calculateRapidStandings(["a","b"], games)
    expect(result.every(row => Number.isFinite(row.averagePercent))).toBe(true)
    const average = games.reduce((sum, game) => sum + game.scoreA / (game.scoreA + game.scoreB),0)
    expect(result.find(row => row.player === "a")!.averagePercent).toBeCloseTo(average,10)
  })
})
