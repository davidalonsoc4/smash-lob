import { describe, expect, it } from "vitest"
import { buildRapidScheduleChecks, generateBalancedAmericanaFixtures, RAPID_TOURNAMENT_SLOTS } from "@/lib/rapidTournament"
import { calculateMexicanoStandings, generateDynamicMexicanoRound, type MexicanoMatch } from "@/lib/dynamicMexicano"
import { buildRapidCues, getRapidCueAnnouncement } from "@/lib/rapidTournamentTiming"

describe("configurable rapid tournaments", () => {
  it.each([4,5,7,17,19,21,23,24])("generates a complete balanced Americana for %i players", players => {
    const config = { players, courts: 2, rounds: 8, roundMinutes: 10, transitionMinutes: 2, preparationMinutes: 4, reservationMinutes: 120 }
    const fixtures = generateBalancedAmericanaFixtures(players,2,8)
    const checks = buildRapidScheduleChecks(RAPID_TOURNAMENT_SLOTS.slice(0,players).map(id=>({id,name:id})),fixtures.map(match=>({...match,teamAIds:match.teamA,teamBIds:match.teamB})),config)
    expect(checks.checks.find(check=>check.id==="complete-calendar")?.passed).toBe(true)
    expect(checks.checks.find(check=>check.id==="equal-participation")?.passed).toBe(true)
    expect(checks.players.every(player=>player.playedMinutes===player.played*10)).toBe(true)
  })
  it("handles 24-player Mexicano with bounded selection and reproducible rounds", () => {
    const players = Array.from({length:24},(_,i)=>({id:`p${i}`,name:`Player ${i}`})), history: MexicanoMatch[] = []
    for (let round=1;round<=6;round++) {
      const input = {players,history,courts:2,round,seed:31}
      const result = generateDynamicMexicanoRound(input)
      expect(generateDynamicMexicanoRound(input)).toEqual(result)
      const playing = result.matches.flatMap(match=>[...match.teamAIds,...match.teamBIds])
      expect(new Set(playing).size).toBe(8)
      history.push(...result.matches.map(match=>({...match,round,scoreA:16,scoreB:12})))
    }
    const standings = calculateMexicanoStandings(players,history,6)
    expect(standings.every(player=>player.played===2 && player.rests===4)).toBe(true)
  })
  it("omits impossible pre-start and two-minute cues for short rounds without warmup", () => {
    const start = "2027-01-01T10:00:00Z"
    const cues = buildRapidCues(start,true,{rounds:2,roundMinutes:1,transitionMinutes:0,preparationMinutes:0})
    expect(cues.every(cue=>cue.at>=Date.parse(start))).toBe(true)
    expect(cues.some(cue=>cue.kind==="two_minutes" || cue.kind==="preparation")).toBe(false)
    expect(cues.filter(cue=>cue.kind==="start")).toHaveLength(2)
  })
  it("announces the configured warmup and transition without inventing a pause", () => {
    const config = { rounds: 6, roundMinutes: 10, preparationMinutes: 4, transitionMinutes: 2 }
    expect(getRapidCueAnnouncement({ id: "warm", at: 0, kind: "preparation", round: 1 }, config)).toEqual({ source: "Calentamiento: {} minutos.", number: 4 })
    expect(getRapidCueAnnouncement({ id: "end", at: 0, kind: "end", round: 1 }, config)).toEqual({ source: "Fin de ronda. Termina el punto en juego. Cambio: {} minutos.", number: 2 })
    expect(getRapidCueAnnouncement({ id: "end", at: 0, kind: "end", round: 1 }, { ...config, transitionMinutes: 0 })).toEqual({ source: "Fin de ronda. Termina el punto en juego." })
  })
  it("keeps optimization warnings distinct from an invalid calendar", () => {
    const players = "ABCD".split("").map(id => ({ id, name: id }))
    const config = { players: 4, courts: 1, rounds: 4, roundMinutes: 10, transitionMinutes: 0, preparationMinutes: 0, reservationMinutes: 60 }
    const matches = [1,2,3,4].map(round => ({ round, court: 1, teamAIds: ["A","B"], teamBIds: ["C","D"] }))
    expect(buildRapidScheduleChecks(players, matches, config)).toMatchObject({ passed: true, allPassed: false })
    expect(buildRapidScheduleChecks(players, [...matches, matches[0]], config).passed).toBe(false)
  })
})
