import { describe, expect, it } from "vitest"
import {
  buildRapidFixtures,
  buildRapidRounds,
  calculateRapidStandings,
  getRapidRoundAt,
  getTournamentChampions,
  RAPID_TOURNAMENT_SLOTS,
  shuffleTournamentNames,
  validateTournamentParticipants,
} from "@/lib/rapidTournament"

const names = [...RAPID_TOURNAMENT_SLOTS]

describe("rapid tournament fixed format", () => {
  it("keeps the balanced twelve-match template invariants", () => {
    const fixtures = buildRapidFixtures()
    expect(fixtures).toHaveLength(12)
    const partners = new Map<string, Set<string>>(names.map((name) => [name, new Set()]))
    const opponents = new Map<string, Set<string>>(names.map((name) => [name, new Set()]))
    const courts = new Map<string, number[]>(names.map((name) => [name, [0, 0]]))
    const played = new Map<string, number>(names.map((name) => [name, 0]))
    const rests = new Map<string, number>(names.map((name) => [name, 0]))
    const restsByRound = ["ABCD", "EFGH", "IJKL", "ABCD", "EFGH", "IJKL"]

    for (let round = 1; round <= 6; round += 1) {
      const roundFixtures = fixtures.filter((item) => item.round === round)
      expect(roundFixtures).toHaveLength(2)
      expect(roundFixtures.map((item) => item.court).sort()).toEqual([1, 2])
      const players = roundFixtures.flatMap((item) => [...item.teamA, ...item.teamB])
      expect(new Set(players).size).toBe(8)
      for (const player of restsByRound[round - 1]) rests.set(player, rests.get(player)! + 1)
      for (const fixture of roundFixtures) {
        for (const player of fixture.teamA) {
          played.set(player, played.get(player)! + 1)
          partners.get(player)!.add(fixture.teamA.find((other) => other !== player)!)
          for (const opponent of fixture.teamB) opponents.get(player)!.add(opponent)
          courts.get(player)![fixture.court - 1] += 1
        }
        for (const player of fixture.teamB) {
          played.set(player, played.get(player)! + 1)
          partners.get(player)!.add(fixture.teamB.find((other) => other !== player)!)
          for (const opponent of fixture.teamA) opponents.get(player)!.add(opponent)
          courts.get(player)![fixture.court - 1] += 1
        }
      }
    }
    expect([...played.values()]).toEqual(Array(12).fill(4))
    expect([...rests.values()]).toEqual(Array(12).fill(2))
    expect([...partners.values()].map((value) => value.size)).toEqual(Array(12).fill(4))
    expect([...opponents.values()].map((value) => value.size)).toEqual(Array(12).fill(8))
    expect([...courts.values()]).toEqual(Array.from({ length: 12 }, () => [2, 2]))
    for (const slot of RAPID_TOURNAMENT_SLOTS) {
      const roundsPlayed = fixtures.filter((match) => [...match.teamA, ...match.teamB].includes(slot)).map((match) => match.round)
      const roundsRested = restsByRound.flatMap((rest, index) => rest.includes(slot) ? [index + 1] : [])
      expect(roundsRested.some((round, index) => roundsRested[index - 1] === round - 1)).toBe(false)
      expect(roundsPlayed).toHaveLength(4)
    }
  })

  it("builds six 16-minute rounds with three-minute transitions and nine-minute margin", () => {
    const rounds = buildRapidRounds("2026-10-17T07:00:00.000Z")
    expect(rounds).toHaveLength(6)
    expect(rounds[0].startsAt).toBe("2026-10-17T07:00:00.000Z")
    expect(rounds[0].endsAt).toBe("2026-10-17T07:16:00.000Z")
    expect(rounds[5].startsAt).toBe("2026-10-17T08:35:00.000Z")
    expect(rounds[5].endsAt).toBe("2026-10-17T08:51:00.000Z")
    expect(Date.parse(rounds[5].endsAt) - Date.parse(rounds[0].startsAt)).toBeLessThanOrEqual(120 * 60_000)
    expect(getRapidRoundAt(rounds, new Date("2026-10-17T07:18:00.000Z"))).toMatchObject({ round: 2, phase: "upcoming" })
    expect(getRapidRoundAt(rounds, new Date("2026-10-17T07:20:00.000Z"))).toMatchObject({ round: 2, phase: "playing" })
  })

  it("validates complete, unique names and shuffles reproducibly with an injected random source", () => {
    expect(validateTournamentParticipants(names).ok).toBe(true)
    expect(validateTournamentParticipants([...names.slice(0, 11), "  a "])).toMatchObject({ ok: false, error: "duplicate_player_names" })
    expect(validateTournamentParticipants([...names.slice(0, 11), " "])).toMatchObject({ ok: false, error: "all_player_names_required" })
    expect(shuffleTournamentNames(names, () => 0)).toEqual([...names.slice(1), names[0]])
  })

  it("calculates the arithmetic average, provisional leader, and only declares finished champions", () => {
    const matches = [60, 45, 55, 70].map((scoreA, index) => ({
      id: String(index), round: index + 1, court: 1 as const,
      teamA: ["A", "B"] as [string, string], teamB: ["C", "D"] as [string, string], scoreA, scoreB: 100 - scoreA,
    }))
    const standings = calculateRapidStandings(["A", "B", "C", "D"], matches)
    expect(standings[0]).toMatchObject({ player: "A", played: 4, pending: 0, wins: 3, pointsFor: 230, pointsAgainst: 170 })
    expect(standings[0].averagePercent).toBeCloseTo(57.5, 10)
    expect(standings[2].averagePercent).toBeCloseTo(42.5, 10)
    expect(getTournamentChampions(standings, "in_progress", 4)).toEqual([])
    const allMatches = [...matches, ...matches, ...matches]
    expect(getTournamentChampions(calculateRapidStandings(["A", "B", "C", "D"], allMatches), "finished", 12)).toHaveLength(2)
    expect(calculateRapidStandings(["A", "B"], [{ id: "x", round: 1, court: 1, teamA: ["A", "A"], teamB: ["B", "B"], scoreA: 19, scoreB: 19 }])[0]).toMatchObject({ player: "A", wins: 0, averagePercent: 50 })
  })

  it("applies exact tiebreak order before sharing a position", () => {
    const standings = calculateRapidStandings(["A", "B", "C", "D", "E", "F"], [
      { id: "one", round: 1, court: 1, teamA: ["A", "C"], teamB: ["B", "D"], scoreA: 10, scoreB: 10 },
      { id: "two", round: 2, court: 1, teamA: ["A", "C"], teamB: ["E", "F"], scoreA: 10, scoreB: 10 },
      { id: "three", round: 3, court: 1, teamA: ["B", "D"], teamB: ["E", "F"], scoreA: 10, scoreB: 10 },
    ])
    expect(standings.map((item) => item.position)).toEqual([1, 1, 1, 1, 1, 1])
  })
})
