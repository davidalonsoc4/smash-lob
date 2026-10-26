import { describe, expect, it } from "vitest"
import {
  buildRapidScheduleChecks,
  buildRapidFixtures,
  buildRapidRounds,
  calculateRapidStandings,
  getRapidRoundAt,
  getTournamentChampions,
  generateBalancedAmericanaFixtures,
  getRapidPreparationMax,
  getRapidRoundCount,
  RAPID_TOURNAMENT_SLOTS,
  shuffleTournamentNames,
  validateTournamentParticipants,
} from "@/lib/rapidTournament"

const names = RAPID_TOURNAMENT_SLOTS.slice(0, 12)

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
    for (const slot of names) {
      const roundsPlayed = fixtures.filter((match) => [...match.teamA, ...match.teamB].includes(slot)).map((match) => match.round)
      const roundsRested = restsByRound.flatMap((rest, index) => rest.includes(slot) ? [index + 1] : [])
      expect(roundsRested.some((round, index) => roundsRested[index - 1] === round - 1)).toBe(false)
      expect(roundsPlayed).toHaveLength(4)
    }
  })

  it("reports all creator schedule checks and each player's run/rest/court counts", () => {
    const matches = buildRapidFixtures().map((match) => ({
      round: match.round, court: match.court,
      teamAIds: match.teamA, teamBIds: match.teamB,
    }))
    const result = buildRapidScheduleChecks(names.map((id) => ({ id, name: id })), matches)
    expect(result.passed).toBe(true)
    expect(result.checks.every((check) => check.passed)).toBe(true)
    expect(result.players).toHaveLength(12)
    expect(result.players.every((player) => player.played === 4 && player.rested === 2 && player.playedMinutes === 64)).toBe(true)
    expect(result.players.every((player) => player.maxConsecutivePlayed <= 2 && player.maxConsecutiveRested === 1 && player.courts[0] === 2 && player.courts[1] === 2)).toBe(true)
    const invalid = buildRapidScheduleChecks(names.map((id) => ({ id, name: id })), [...matches.slice(0, 1), { ...matches[0], round: 2 }, ...matches.slice(2)])
    expect(invalid.passed).toBe(false)
    expect(invalid.checks.find((check) => check.id === "complete-calendar")?.passed).toBe(false)
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

  it("generates valid balanced schedules for every supported player and court count", () => {
    for (let playerCount = 8; playerCount <= 16; playerCount += 1) for (let courts = 1; courts <= 4; courts += 1) {
      const rounds = getRapidRoundCount(120), schedule = generateBalancedAmericanaFixtures(playerCount, courts, rounds)
      const config = { players: playerCount, courts, reservationMinutes: 120, rounds, roundMinutes: 16, transitionMinutes: 3, preparationMinutes: 2 }
      const checks = buildRapidScheduleChecks(RAPID_TOURNAMENT_SLOTS.slice(0, playerCount).map((id) => ({ id, name: id })), schedule.map((match) => ({ round: match.round, court: match.court, teamAIds: match.teamA, teamBIds: match.teamB })), config)
      expect(schedule).toHaveLength(rounds * Math.min(courts, Math.floor(playerCount / 4)))
      expect(checks.passed, `${playerCount} players, ${courts} courts: ${JSON.stringify(checks.checks)} ${JSON.stringify(checks.players)}`).toBe(true)
      expect(checks.players.every((player) => player.playedMinutes === player.played * 16)).toBe(true)
    }
  })

  it("fits 60, 90 and 120 minute reservations while preserving two safety minutes", () => {
    for (const reservation of [60, 90, 120]) {
      const count = getRapidRoundCount(reservation), preparation = getRapidPreparationMax(reservation)
      const rounds = buildRapidRounds(new Date(Date.parse("2026-10-19T09:00:00Z") + preparation * 60_000), { rounds: count, roundMinutes: 16, transitionMinutes: 3 })
      const elapsed = (Date.parse(rounds.at(-1)!.endsAt) - Date.parse("2026-10-19T09:00:00Z")) / 60_000
      expect(count).toBe(({ 60: 3, 90: 4, 120: 6 } as const)[reservation as 60 | 90 | 120])
      expect(elapsed).toBeLessThanOrEqual(reservation - 2)
      expect(reservation - elapsed).toBeGreaterThanOrEqual(2)
    }
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
