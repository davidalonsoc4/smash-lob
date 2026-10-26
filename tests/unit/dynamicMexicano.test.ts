import { describe, expect, it } from "vitest"
import { calculateMexicanoStandings, generateDynamicMexicanoRound, type MexicanoMatch } from "@/lib/dynamicMexicano"

const players = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `p${String(index + 1).padStart(2, "0")}`, name: `Jugador ${index + 1}` }))

function simulate(playerCount: number, courts: number, rounds: number, seed = 73) {
  const roster = players(playerCount), history: MexicanoMatch[] = []
  for (let round = 1; round <= rounds; round += 1) {
    const generated = generateDynamicMexicanoRound({ players: roster, history, courts, round, seed })
    generated.matches.forEach((match, index) => history.push({ ...match, round, scoreA: 12 + ((round + index) % 7), scoreB: 10 + ((round * 3 + index) % 7) }))
  }
  return { roster, history }
}

describe("Mexicano dinámico equilibrado", () => {
  it.each([[8, 2], [12, 2], [12, 3], [16, 3], [10, 2], [7, 1]])("adapta jugadores y pistas para %i/%i", (playerCount, courts) => {
    const roster = players(playerCount)
    const round = generateDynamicMexicanoRound({ players: roster, history: [], courts, round: 1, seed: 19 })
    expect(round.matches).toHaveLength(Math.min(courts, Math.floor(playerCount / 4)))
    const playing = round.matches.flatMap((match) => [...match.teamAIds, ...match.teamBIds])
    expect(new Set(playing).size).toBe(playing.length)
    expect(round.matches.every((match) => match.teamAIds.length === 2 && match.teamBIds.length === 2)).toBe(true)
    expect(playing.length + round.restingIds.length).toBe(playerCount)
  })

  it.each([[8, 2, 3], [12, 2, 6], [12, 3, 5], [16, 3, 6], [10, 2, 6], [7, 1, 6]])("minimiza la diferencia de participación en %i/%i/%i", (playerCount, courts, rounds) => {
    const { roster, history } = simulate(playerCount, courts, rounds)
    const played = calculateMexicanoStandings(roster, history, rounds).map((standing) => standing.played)
    expect(Math.max(...played) - Math.min(...played)).toBeLessThanOrEqual(1)
  })

  it("evita descansos consecutivos cuando la participación permite otra elección", () => {
    const { roster, history } = simulate(12, 2, 6)
    for (let round = 2; round <= 6; round += 1) {
      const previous = new Set(history.filter((match) => match.round === round - 1).flatMap((match) => [...match.teamAIds, ...match.teamBIds]))
      const current = new Set(history.filter((match) => match.round === round).flatMap((match) => [...match.teamAIds, ...match.teamBIds]))
      expect(roster.filter((player) => !previous.has(player.id) && !current.has(player.id))).toHaveLength(0)
    }
  })

  it("rota compañeros y produce la misma ronda con la misma semilla", () => {
    const roster = players(12), history: MexicanoMatch[] = []
    const first = generateDynamicMexicanoRound({ players: roster, history, courts: 2, round: 1, seed: 91 })
    const repeated = generateDynamicMexicanoRound({ players: roster, history, courts: 2, round: 1, seed: 91 })
    expect(repeated).toEqual(first)
    first.matches.forEach((match) => history.push({ ...match, round: 1, scoreA: 16, scoreB: 12 }))
    const second = generateDynamicMexicanoRound({ players: roster, history, courts: 2, round: 2, seed: 91 })
    const oldPartners = new Set(first.matches.flatMap((match) => [match.teamAIds.slice().sort().join("|"), match.teamBIds.slice().sort().join("|")]))
    expect(second.matches.flatMap((match) => [match.teamAIds, match.teamBIds]).some((team) => oldPartners.has(team.slice().sort().join("|")))).toBe(false)
  })

  it("varía el primer sorteo al cambiar la semilla", () => {
    const roster = players(12)
    expect(generateDynamicMexicanoRound({ players: roster, history: [], courts: 2, round: 1, seed: 1 })).not.toEqual(generateDynamicMexicanoRound({ players: roster, history: [], courts: 2, round: 1, seed: 2 }))
  })

  it("calcula el rendimiento suavizado y los desempates deterministas", () => {
    const roster = players(4)
    const standings = calculateMexicanoStandings(roster, [{ round: 1, court: 1, teamAIds: ["p01", "p02"], teamBIds: ["p03", "p04"], scoreA: 17, scoreB: 13 }], 1)
    expect(standings[0]).toMatchObject({ id: "p01", played: 1, wins: 1, pointsFor: 17, pointsAgainst: 13, rating: 100 * 20 / 36, position: 1 })
    expect(standings[1].position).toBe(1)
    expect(standings[2]).toMatchObject({ played: 1, losses: 1, rating: 100 * 16 / 36, position: 3 })
  })
})
