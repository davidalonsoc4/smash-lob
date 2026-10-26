import { describe, expect, it } from "vitest"
import { buildTraditionalDraw, resolveTraditionalTournament, traditionalSeedPositions, validateTraditionalConfiguration, type TraditionalConfiguration, type TraditionalPlan, type TraditionalResult } from "@/lib/traditionalTournament"
import { buildTraditionalSchedule, validateTraditionalSchedule, type TraditionalScheduleOptions } from "@/lib/traditionalTournamentSchedule"
import type { FixedTournamentTeam } from "@/lib/fixedRapidTournament"

const roster = (count: number): FixedTournamentTeam[] => Array.from({ length: count }, (_, i) => ({ id: `team-${i + 1}`, playerIds: [`p${i * 2 + 1}`, `p${i * 2 + 2}`] }))
const knockout: TraditionalConfiguration = { format: "knockout", groupCount: 0, qualifiersPerGroup: 0, thirdPlace: false, consolation: false }
const draw = (count: number, configuration = knockout) => buildTraditionalDraw({ teams: roster(count), configuration, seed: 19, manualOrder: roster(count).map(team => team.id) })
const resultFor = (match: ReturnType<typeof resolveTraditionalTournament>["matches"][number]): TraditionalResult => ({
  matchId: match.id, teamAId: match.teamAId!, teamBId: match.teamBId!, scoreA: Number(match.teamAId!.split("-")[1]) < Number(match.teamBId!.split("-")[1]) ? 20 : 9,
  scoreB: Number(match.teamAId!.split("-")[1]) < Number(match.teamBId!.split("-")[1]) ? 9 : 20,
})
function finish(plan: TraditionalPlan) {
  const results: TraditionalResult[] = []
  for (let i = 0; i < 20; i++) {
    const state = resolveTraditionalTournament(plan, results)
    if (state.complete) return { state, results }
    const ready = state.matches.filter(match => match.state === "ready")
    expect(ready.length).toBeGreaterThan(0)
    results.push(...ready.map(resultFor))
  }
  throw new Error("traditional_did_not_finish")
}
const options: TraditionalScheduleOptions = { startsAt: "2026-11-01T09:00:00.000Z", courts: 2, matchMinutes: 30, transitionMinutes: 5 }

describe("traditional knockout", () => {
  it.each(Array.from({ length: 15 }, (_, i) => i + 2))("completes %i fixed pairs with byes and exactly N-1 played matches", count => {
    const plan = draw(count), snapshot = structuredClone(plan), { state, results } = finish(plan)
    expect(state.complete).toBe(true)
    expect(state.championIds).toEqual(["team-1"])
    expect(results).toHaveLength(count - 1)
    expect(state.matches.filter(match => match.state === "bye")).toHaveLength(2 ** Math.ceil(Math.log2(count)) - count)
    expect(plan).toEqual(snapshot)
    const schedule = buildTraditionalSchedule(plan, options)
    expect(schedule).toHaveLength(count - 1)
    expect(validateTraditionalSchedule(plan, schedule, options)).toMatchObject({ complete: true, pending: 0 })
  })
  it.each([6,7,8,10,11,12])("plays bronze and consolation without including byes (%i teams)", count => {
    const { state, results } = finish(draw(count, { ...knockout, thirdPlace: true, consolation: true }))
    const consolationTeams = count - 2 ** Math.ceil(Math.log2(count)) / 2
    expect(state.thirdPlaceId).toBe("team-3")
    expect(state.consolationWinnerId).toBeTruthy()
    expect(results).toHaveLength(count - 1 + 1 + consolationTeams - 1)
    const openingLosers = state.matches.filter(match => match.stage === "main" && match.round === 1).map(match => match.loserId).filter(Boolean)
    expect(openingLosers).toHaveLength(consolationTeams)
    for (const match of state.matches.filter(match => match.stage === "consolation")) {
      for (const id of [match.teamAId, match.teamBId].filter(Boolean)) expect(openingLosers).toContain(id)
    }
  })
  it("is deterministic and protects seeds, including optional manual order", () => {
    const input = { teams: roster(12), configuration: knockout, seed: 31, seededTeamIds: ["team-1", "team-2", "team-3", "team-4"] }
    const first = buildTraditionalDraw(input)
    expect(buildTraditionalDraw(input)).toEqual(first)
    expect(first.seedOrder.slice(0, 4)).toEqual(input.seededTeamIds)
    expect(buildTraditionalDraw({ ...input, seed: 98 }).seedOrder.slice(4)).not.toEqual(first.seedOrder.slice(4))
    expect(traditionalSeedPositions(8)).toEqual([1,8,4,5,2,7,3,6])
    expect(() => buildTraditionalDraw({ ...input, manualOrder: [...first.seedOrder].reverse() })).toThrow("invalid_manual_draw")
    expect(buildTraditionalDraw({ ...input, manualOrder: first.seedOrder }).seedOrder).toEqual(first.seedOrder)
  })
  it("never creates a winner for a pending semifinal or allows a draw in elimination", () => {
    const plan = draw(4), state = resolveTraditionalTournament(plan, []), ready = state.matches.find(match => match.state === "ready")!
    expect(state.championIds).toEqual([])
    expect(state.matches.at(-1)).toMatchObject({ state: "pending", winnerId: null, teamAId: null, teamBId: null })
    expect(() => resolveTraditionalTournament(plan, [{ ...resultFor(ready), scoreA: 10, scoreB: 10 }])).toThrow("invalid_traditional_result_state")
    expect(() => resolveTraditionalTournament(plan, [{ matchId: state.matches.at(-1)!.id, teamAId: "team-1", teamBId: "team-2", scoreA: 20, scoreB: 10 }])).toThrow("invalid_traditional_result_state")
  })
  it("refuses to change the opponents of an already played downstream match", () => {
    const plan = draw(8), { results } = finish(plan)
    const changed = results.map((result, i) => i === 0 ? { ...result, scoreA: result.scoreB, scoreB: result.scoreA } : result)
    expect(() => resolveTraditionalTournament(plan, changed)).toThrow("played_traditional_match_changed")
    expect(resolveTraditionalTournament(plan, results)).toEqual(resolveTraditionalTournament(plan, results))
    const firstRoundOnly = [results[0]]
    expect(() => resolveTraditionalTournament(plan, [{ ...firstRoundOnly[0], scoreA: 5, scoreB: 30 }])).not.toThrow()
  })
})

describe("traditional groups and qualifying brackets", () => {
  const matrix: Array<[number, TraditionalConfiguration]> = []
  for (let count = 4; count <= 16; count++) for (let groupCount = 2; groupCount <= Math.floor(count / 2); groupCount++) {
    for (let qualifiersPerGroup = 1; qualifiersPerGroup <= Math.floor(count / groupCount); qualifiersPerGroup++) {
      matrix.push([count, { format: "groups_knockout", groupCount, qualifiersPerGroup, thirdPlace: groupCount * qualifiersPerGroup >= 4, consolation: count - groupCount * qualifiersPerGroup >= 2 }])
    }
  }
  it.each(matrix)("completes every viable mixed combination (%i teams / %j)", (count, configuration) => {
    const plan = draw(count, configuration)
    expect(finish(plan).state.complete).toBe(true)
    expect(validateTraditionalSchedule(plan, buildTraditionalSchedule(plan, options), options).complete).toBe(true)
  })
  it.each([2,3,4,5,6,7,8,9,10,11,12,13,14,15,16])("plays every opponent once with %i teams, including odd groups", count => {
    const groupCount = count >= 4 ? 2 : 1
    const plan = draw(count, { ...knockout, format: "groups", groupCount }), { state, results } = finish(plan)
    expect(results).toHaveLength(plan.groups.reduce((sum, group) => sum + group.teamIds.length * (group.teamIds.length - 1) / 2, 0))
    expect(state.groups.every(group => group.complete)).toBe(true)
    expect(state.championIds).toHaveLength(groupCount)
    for (const group of state.groups) {
      expect(group.table.every(row => row.played === group.teamIds.length - 1)).toBe(true)
      const matches = state.matches.filter(match => match.groupId === group.id)
      expect(new Set(matches.map(match => [match.teamAId, match.teamBId].sort().join("/"))).size).toBe(matches.length)
      for (const round of new Set(matches.map(match => match.round))) {
        const members = matches.filter(match => match.round === round).flatMap(match => [match.teamAId,match.teamBId])
        expect(new Set(members).size).toBe(members.length)
      }
    }
    expect(validateTraditionalSchedule(plan, buildTraditionalSchedule(plan, options), options).complete).toBe(true)
  })
  it.each([[4,2,1],[5,2,1],[6,2,2],[8,2,2],[8,4,1],[9,3,2],[10,2,3],[12,4,2],[12,3,3],[12,6,1]])("qualifies from %i teams / %i groups / %i per group", (count, groupCount, qualifiersPerGroup) => {
    const config: TraditionalConfiguration = { format: "groups_knockout", groupCount, qualifiersPerGroup, thirdPlace: groupCount * qualifiersPerGroup >= 4, consolation: count - groupCount * qualifiersPerGroup >= 2 }
    const plan = draw(count, config), initial = resolveTraditionalTournament(plan, [])
    expect(initial.matches.filter(match => match.stage !== "group").every(match => match.state === "pending")).toBe(true)
    const { state } = finish(plan)
    expect(state.championIds).toEqual(["team-1"])
    const qualified = state.groups.flatMap(group => group.table.slice(0, qualifiersPerGroup).map(row => row.teamId))
    for (const match of state.matches.filter(match => match.stage === "main")) {
      for (const id of [match.teamAId, match.teamBId].filter(Boolean)) expect(qualified).toContain(id)
    }
    expect(validateTraditionalSchedule(plan, buildTraditionalSchedule(plan, options), options).complete).toBe(true)
  })
  it.each([2,4])("keeps two qualifiers from the same group in opposite halves (%i groups)", groupCount => {
    const plan = draw(groupCount * 3, { ...knockout, format: "groups_knockout", groupCount, qualifiersPerGroup: 2 })
    const opening = plan.matches.filter(match => match.stage === "main" && match.round === 1)
    const halves = [opening.slice(0, opening.length / 2), opening.slice(opening.length / 2)]
    for (const group of plan.groups) {
      for (const half of halves) expect(half.flatMap(match => [match.a,match.b]).filter(source => source?.kind === "group" && source.groupId === group.id)).toHaveLength(1)
    }
  })
  it("preserves sporting ties and requires an explicit tie order before ambiguous qualification", () => {
    const plan = draw(4, { ...knockout, format: "groups_knockout", groupCount: 2, qualifiersPerGroup: 1 })
    const groupResults = resolveTraditionalTournament(plan, []).matches.filter(match => match.stage === "group").map(match => ({ ...resultFor(match), scoreA: 10, scoreB: 10 }))
    const tied = resolveTraditionalTournament(plan, groupResults)
    expect(tied.groups[0].table.map(row => row.position)).toEqual([1,1])
    expect(tied.matches.at(-1)!.state).toBe("pending")
    const orders = Object.fromEntries(plan.groups.map(group => [group.id, group.teamIds]))
    const decided = resolveTraditionalTournament(plan, groupResults, orders)
    expect(decided.matches.at(-1)!.state).toBe("ready")
    expect(decided.groups[0].table.map(row => row.position)).toEqual([1,1])
    expect(() => resolveTraditionalTournament(plan, groupResults, { "group-1": ["team-1","team-1"] })).toThrow("invalid_group_tie_order")
    const playedFinal = [...groupResults, resultFor(decided.matches.at(-1)!)]
    expect(() => resolveTraditionalTournament(plan, playedFinal, { ...orders, "group-1": [...orders["group-1"]].reverse() })).toThrow("played_traditional_match_changed")
  })
  it("cannot use a tie decision to promote a team with worse sporting results", () => {
    const plan = draw(4, { ...knockout, format: "groups_knockout", groupCount: 2, qualifiersPerGroup: 1 })
    const groups = resolveTraditionalTournament(plan, []).matches.filter(match => match.stage === "group").map(resultFor)
    const first = resolveTraditionalTournament(plan, groups)
    const orders = Object.fromEntries(plan.groups.map(group => [group.id, [...group.teamIds].reverse()]))
    expect(resolveTraditionalTournament(plan, groups, orders).matches.at(-1)).toEqual(first.matches.at(-1))
  })
  it("accepts manually allocated balanced groups and rejects duplicate or missing teams", () => {
    const config: TraditionalConfiguration = { ...knockout, format: "groups", groupCount: 2 }
    const manualGroups = [["team-1","team-3","team-5"],["team-2","team-4"]]
    const plan = buildTraditionalDraw({ teams: roster(5), configuration: config, seed: 7, manualGroups })
    expect(plan.groups.map(group => group.teamIds)).toEqual(manualGroups)
    finish(plan)
    expect(() => buildTraditionalDraw({ teams: roster(5), configuration: config, seed: 7, manualGroups: [["team-1","team-1","team-3"],["team-4","team-5"]] })).toThrow("invalid_manual_groups")
  })
})

describe("traditional validation and manual calendars", () => {
  it.each([
    [3,{ ...knockout, thirdPlace: true },"third_place_requires_semifinals"],
    [4,{ ...knockout, thirdPlace: true, consolation: true },"consolation_duplicates_third_place"],
    [5,{ ...knockout, consolation: true },"consolation_requires_two_teams"],
    [9,{ ...knockout, consolation: true },"consolation_requires_two_teams"],
    [5,{ ...knockout, format: "groups", groupCount: 3 },"invalid_traditional_groups"],
    [4,{ ...knockout, format: "groups_knockout", groupCount: 2, qualifiersPerGroup: 3 },"invalid_traditional_qualifiers"],
    [6,{ ...knockout, format: "groups", groupCount: 2, thirdPlace: true },"invalid_traditional_options"],
  ] as const)("rejects impossible combinations", (count, configuration, error) => {
    expect(() => validateTraditionalConfiguration(count, configuration)).toThrow(error)
  })
  it("rejects malformed rosters, invalid result values, duplicate results and unknown matches", () => {
    expect(() => buildTraditionalDraw({ teams: roster(17), configuration: knockout, seed: 7 })).toThrow("invalid_fixed_teams")
    const teams = roster(4); teams[1].playerIds = teams[0].playerIds
    expect(() => buildTraditionalDraw({ teams, configuration: knockout, seed: 7 })).toThrow("invalid_fixed_teams")
    const plan = draw(4), ready = resultFor(resolveTraditionalTournament(plan, []).matches[0])
    for (const scoreA of [-1,NaN,Infinity,1.5,2147483648]) expect(() => resolveTraditionalTournament(plan, [{ ...ready, scoreA }])).toThrow("invalid_traditional_results")
    expect(() => resolveTraditionalTournament(plan, [{ ...ready, scoreA: 0, scoreB: 0 }])).toThrow("invalid_traditional_results")
    expect(() => resolveTraditionalTournament(plan, [ready,ready])).toThrow("invalid_traditional_results")
    expect(() => resolveTraditionalTournament(plan, [{ ...ready, matchId: "unknown" }])).toThrow("invalid_traditional_results")
    expect(() => resolveTraditionalTournament(plan, [{ ...ready, teamAId: "team-2" }])).toThrow("played_traditional_match_changed")
  })
  it("offers manual planning across several weeks and identifies unplanned matches", () => {
    const plan = draw(4), schedule = buildTraditionalSchedule(plan, options)
    expect(schedule[0].startsAt).toBe(schedule[1].startsAt)
    expect(schedule[2].startsAt).toBe("2026-11-01T09:35:00.000Z")
    const weeks = schedule.map((entry, i) => i !== 2 ? entry : { ...entry, startsAt: "2026-11-15T10:00:00.000Z", endsAt: "2026-11-15T11:30:00.000Z" })
    expect(validateTraditionalSchedule(plan, weeks, options)).toMatchObject({ complete: true, scheduled: 3 })
    expect(validateTraditionalSchedule(plan, weeks.slice(0, 2), options)).toMatchObject({ complete: false, pending: 1 })
    expect(validateTraditionalSchedule(plan, [], options)).toMatchObject({ complete: false, pending: 3 })
    expect(() => validateTraditionalSchedule(plan, [weeks[2]], options)).toThrow("traditional_schedule_dependency_conflict")
  })
  it("allows a final and bronze simultaneously, as they have mutually exclusive opponents", () => {
    const plan = draw(4, { ...knockout, thirdPlace: true }), schedule = buildTraditionalSchedule(plan, options)
    expect(schedule[2].startsAt).toBe(schedule[3].startsAt)
    expect(schedule[2].court).not.toBe(schedule[3].court)
    expect(validateTraditionalSchedule(plan, schedule, options).complete).toBe(true)
  })
  it("rejects simultaneous same-team matches, court collisions and insufficient transition", () => {
    const plan = draw(3, { ...knockout, format: "groups", groupCount: 1 }), schedule = buildTraditionalSchedule(plan, options)
    const overlap = schedule.map((entry, i) => ({ ...entry, startsAt: options.startsAt, endsAt: "2026-11-01T09:30:00.000Z", court: i % 2 + 1 }))
    expect(() => validateTraditionalSchedule(plan, overlap, options)).toThrow("traditional_schedule_overlap")
    const crowded = draw(4), collisions = buildTraditionalSchedule(crowded, options).map((entry, i) => i === 1 ? { ...entry, court: 1 } : entry)
    expect(() => validateTraditionalSchedule(crowded, collisions, options)).toThrow("traditional_schedule_overlap")
    const early = buildTraditionalSchedule(crowded, options).map((entry, i) => i === 2 ? { ...entry, startsAt: "2026-11-01T09:34:00.000Z" } : entry)
    expect(() => validateTraditionalSchedule(crowded, early, options)).toThrow("traditional_schedule_dependency_conflict")
    expect(schedule[1].startsAt).toBe("2026-11-01T09:35:00.000Z")
  })
  it("rejects malformed dates, duplicate slots, bye assignments and out-of-range courts", () => {
    const plan = draw(5), schedule = buildTraditionalSchedule(plan, options)
    expect(() => validateTraditionalSchedule(plan, [schedule[0],schedule[0]], options)).toThrow("invalid_traditional_schedule_match")
    const bye = resolveTraditionalTournament(plan, []).matches.find(match => match.state === "bye")!
    expect(() => validateTraditionalSchedule(plan, [{ ...schedule[0], matchId: bye.id }], options)).toThrow("invalid_traditional_schedule_match")
    expect(() => validateTraditionalSchedule(plan, [{ ...schedule[0], court: 5 }], options)).toThrow("invalid_traditional_schedule_slot")
    expect(() => buildTraditionalSchedule(plan, { ...options, startsAt: "2026-11-01T09:00:00" })).toThrow("invalid_traditional_schedule_time")
    expect(() => buildTraditionalSchedule(plan, { ...options, courts: 0 })).toThrow("invalid_traditional_schedule_configuration")
  })
})
