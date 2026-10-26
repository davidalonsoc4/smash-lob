import { validateFixedTournamentTeams, type FixedTournamentTeam } from "./fixedRapidTournament"
import { parseTournamentPoints } from "./tournamentResult"

export type TraditionalFormat = "knockout" | "groups" | "groups_knockout"
export type TraditionalConfiguration = {
  format: TraditionalFormat
  groupCount: number
  qualifiersPerGroup: number
  thirdPlace: boolean
  consolation: boolean
}
export type TraditionalSource =
  | { kind: "team"; teamId: string }
  | { kind: "winner" | "loser"; matchId: string }
  | { kind: "group"; groupId: string; position: number }
  | null
export type TraditionalMatch = {
  id: string
  stage: "group" | "main" | "third_place" | "consolation"
  round: number
  groupId: string | null
  a: TraditionalSource
  b: TraditionalSource
}
export type TraditionalGroup = { id: string; teamIds: string[] }
export type TraditionalPlan = {
  configuration: TraditionalConfiguration
  teams: FixedTournamentTeam[]
  seedOrder: string[]
  groups: TraditionalGroup[]
  matches: TraditionalMatch[]
}
export type TraditionalResult = { matchId: string; teamAId: string; teamBId: string; scoreA: number; scoreB: number }
export type TraditionalGroupRow = {
  teamId: string; position: number; played: number; wins: number; draws: number; losses: number
  pointsFor: number; pointsAgainst: number; difference: number
}
export type TraditionalResolvedMatch = TraditionalMatch & {
  teamAId: string | null; teamBId: string | null
  state: "pending" | "bye" | "ready" | "completed"
  winnerId: string | null; loserId: string | null
  scoreA: number | null; scoreB: number | null
}

function fail(message: string): never { throw new Error(message) }
const sizeOfBracket = (count: number) => 2 ** Math.ceil(Math.log2(count))
const teamSource = (teamId: string): TraditionalSource => ({ kind: "team", teamId })
const outcome = (matchId: string, kind: "winner" | "loser" = "winner"): TraditionalSource => ({ kind, matchId })
const groupSource = (groupId: string, position: number): TraditionalSource => ({ kind: "group", groupId, position })

export function validateTraditionalConfiguration(teamCount: number, config: TraditionalConfiguration) {
  if (!Number.isInteger(teamCount) || teamCount < 2 || teamCount > 16 ||
    !["knockout", "groups", "groups_knockout"].includes(config.format) ||
    typeof config.thirdPlace !== "boolean" || typeof config.consolation !== "boolean" ||
    !Number.isInteger(config.groupCount) || !Number.isInteger(config.qualifiersPerGroup)) fail("invalid_traditional_configuration")
  const grouped = config.format !== "knockout"
  if (grouped && (config.groupCount < 1 || config.groupCount > 8 || config.groupCount * 2 > teamCount)) fail("invalid_traditional_groups")
  if (config.format === "groups" && (config.thirdPlace || config.consolation || config.qualifiersPerGroup !== 0)) fail("invalid_traditional_options")
  if (!grouped && (config.groupCount !== 0 || config.qualifiersPerGroup !== 0)) fail("invalid_traditional_groups")
  if (config.format === "groups_knockout" && (config.groupCount < 2 || config.qualifiersPerGroup < 1 ||
    config.qualifiersPerGroup > Math.floor(teamCount / config.groupCount))) fail("invalid_traditional_qualifiers")
  const finalists = grouped ? config.groupCount * config.qualifiersPerGroup : teamCount
  if (config.format !== "groups" && finalists < 2) fail("invalid_traditional_qualifiers")
  if (config.thirdPlace && finalists < 4) fail("third_place_requires_semifinals")
  // Consolation contains opening-round losers, or non-qualifiers after groups.
  // Byes never count as a defeat and never invent a consolation participant.
  const consolationTeams = grouped ? teamCount - finalists : teamCount - sizeOfBracket(teamCount) / 2
  if (config.consolation && consolationTeams < 2) fail("consolation_requires_two_teams")
  if (config.format === "knockout" && teamCount === 4 && config.thirdPlace && config.consolation) fail("consolation_duplicates_third_place")
  return { knockoutTeams: finalists, consolationTeams }
}

// Standard seeded bracket: 1/2 only meet in the final, 1–4 in the semifinals.
export function traditionalSeedPositions(size: number): number[] {
  if (!Number.isInteger(size) || size < 2 || size > 16 || (size & (size - 1))) fail("invalid_bracket_size")
  let order = [1, 2]
  while (order.length < size) order = order.flatMap(seed => [seed, order.length * 2 + 1 - seed])
  return order
}
function shuffled<T>(values: readonly T[], seed: number): T[] {
  let state = seed >>> 0
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const j = Math.floor(state / 4294967296 * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
function bracket(sources: TraditionalSource[], stage: "main" | "consolation"): TraditionalMatch[] {
  if (sources.length < 2) return []
  let entries = traditionalSeedPositions(sizeOfBracket(sources.length)).map(position => sources[position - 1] ?? null)
  const matches: TraditionalMatch[] = []
  for (let round = 1; entries.length > 1; round++) {
    const next: TraditionalSource[] = []
    for (let i = 0; i < entries.length; i += 2) {
      const id = `${stage}-${round}-${i / 2 + 1}`
      matches.push({ id, stage, round, groupId: null, a: entries[i], b: entries[i + 1] })
      next.push(outcome(id))
    }
    entries = next
  }
  return matches
}
function groupFixtures(group: TraditionalGroup): TraditionalMatch[] {
  const circle: Array<string | null> = [...group.teamIds]
  if (circle.length % 2) circle.push(null)
  const matches: TraditionalMatch[] = []
  for (let round = 1; round < circle.length; round++) {
    for (let i = 0; i < circle.length / 2; i++) {
      const a = circle[i], b = circle[circle.length - 1 - i]
      if (a && b) matches.push({ id: `${group.id}-${round}-${i + 1}`, stage: "group", round, groupId: group.id, a: teamSource(a), b: teamSource(b) })
    }
    circle.splice(1, 0, circle.pop()!)
  }
  return matches
}
function permutations<T>(items: readonly T[]): T[][] {
  return items.length < 2 ? [[...items]] : items.flatMap((item, i) => permutations(items.filter((_, j) => i !== j)).map(rest => [item, ...rest]))
}
function qualifiersForBracket(groups: TraditionalGroup[], count: number): TraditionalSource[] {
  const positions = traditionalSeedPositions(sizeOfBracket(groups.length * count))
  const ordered: Array<{ kind: "group"; groupId: string; position: number }> = []
  const cost = (sources: typeof ordered) => sources.reduce((sum, a, i) => sum + sources.slice(i + 1).reduce((score, b, j) => {
    if (a.groupId !== b.groupId) return score
    const difference = positions.indexOf(i + 1) ^ positions.indexOf(i + j + 2)
    return score + 1000 ** (Math.log2(positions.length) - Math.floor(Math.log2(difference)) - 1)
  }, 0), 0)
  for (let rank = 1; rank <= count; rank++) {
    // Keep the existing exhaustive search for up to six groups. Larger draws
    // use bounded rotations/reflections instead of factorial browser work.
    const options = rank === 1 ? [groups] : groups.length <= 6 ? permutations(groups)
      : [groups, [...groups].reverse()].flatMap(order => order.map((_, i) => [...order.slice(i), ...order.slice(0, i)]))
    let best = options[0], bestCost = Infinity
    for (const option of options) {
      const nextCost = cost([...ordered, ...option.map(group => ({ kind: "group" as const, groupId: group.id, position: rank }))])
      if (nextCost < bestCost) { best = option; bestCost = nextCost }
    }
    ordered.push(...best.map(group => ({ kind: "group" as const, groupId: group.id, position: rank })))
  }
  return ordered
}

export function buildTraditionalDraw(input: {
  teams: readonly FixedTournamentTeam[]; configuration: TraditionalConfiguration; seed: number
  seededTeamIds?: readonly string[]; manualOrder?: readonly string[]; manualGroups?: readonly (readonly string[])[]
}): TraditionalPlan {
  const { teams, configuration: config } = input
  if (!validateFixedTournamentTeams(teams.flatMap(team => [...team.playerIds]), teams)) fail("invalid_fixed_teams")
  validateTraditionalConfiguration(teams.length, config)
  if (!Number.isSafeInteger(input.seed) || input.seed < 0 || input.seed > 4294967295) fail("invalid_draw_seed")
  const ids = teams.map(team => team.id), seeds = [...(input.seededTeamIds ?? [])]
  if (new Set(seeds).size !== seeds.length || seeds.some(id => !ids.includes(id))) fail("invalid_draw_seeds")
  const seedOrder = input.manualOrder ? [...input.manualOrder] : [...seeds, ...shuffled(ids.filter(id => !seeds.includes(id)), input.seed)]
  if (seedOrder.length !== ids.length || new Set(seedOrder).size !== ids.length || seedOrder.some(id => !ids.includes(id)) ||
    (input.manualOrder && seeds.some((id, i) => seedOrder[i] !== id))) fail("invalid_manual_draw")
  const groups: TraditionalGroup[] = config.format === "knockout" ? [] : Array.from({ length: config.groupCount }, (_, i) => ({ id: `group-${i + 1}`, teamIds: [] }))
  if (input.manualGroups) {
    const members = input.manualGroups.flat()
    if (!groups.length || input.manualGroups.length !== groups.length || members.length !== ids.length || new Set(members).size !== ids.length || members.some(id => !ids.includes(id)) ||
      input.manualGroups.some(group => group.length < Math.floor(ids.length / groups.length) || group.length > Math.ceil(ids.length / groups.length))) fail("invalid_manual_groups")
    groups.forEach((group, i) => { group.teamIds = [...input.manualGroups![i]] })
  } else seedOrder.forEach((id, i) => {
    if (groups.length) groups[Math.floor(i / groups.length) % 2 ? groups.length - 1 - i % groups.length : i % groups.length].teamIds.push(id)
  })
  const matches = groups.flatMap(groupFixtures).sort((a, b) => a.round - b.round || a.id.localeCompare(b.id, "en"))
  if (config.format !== "groups") {
    const qualifiers = groups.length ? qualifiersForBracket(groups, config.qualifiersPerGroup) : seedOrder.map(teamSource)
    const main = bracket(qualifiers, "main")
    matches.push(...main)
    if (config.thirdPlace) {
      const semifinalRound = Math.max(...main.map(match => match.round)) - 1
      const semis = main.filter(match => match.round === semifinalRound)
      matches.push({ id: "third-place", stage: "third_place", round: semifinalRound + 1, groupId: null, a: outcome(semis[0].id, "loser"), b: outcome(semis[1].id, "loser") })
    }
    if (config.consolation) {
      const entrants = groups.length ? groups.flatMap(group => group.teamIds.slice(config.qualifiersPerGroup).map((_, i) => groupSource(group.id, config.qualifiersPerGroup + i + 1)))
        : main.filter(match => match.round === 1 && match.a && match.b).map(match => outcome(match.id, "loser"))
      matches.push(...bracket(entrants, "consolation"))
    }
  }
  return { configuration: { ...config }, teams: teams.map(team => ({ id: team.id, playerIds: [...team.playerIds] as [string, string] })), seedOrder, groups, matches }
}

function groupTable(group: TraditionalGroup, matches: readonly TraditionalResolvedMatch[]): TraditionalGroupRow[] {
  const rows = new Map(group.teamIds.map(teamId => [teamId, { teamId, position: 0, played: 0, wins: 0, draws: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, difference: 0 }]))
  for (const match of matches) {
    if (match.groupId !== group.id || match.state !== "completed") continue
    for (const [id, own, other] of [[match.teamAId!, match.scoreA!, match.scoreB!], [match.teamBId!, match.scoreB!, match.scoreA!]] as const) {
      const row = rows.get(id)!
      row.played++; row.wins += Number(own > other); row.draws += Number(own === other); row.losses += Number(own < other)
      row.pointsFor += own; row.pointsAgainst += other; row.difference += own - other
    }
  }
  const sorted = [...rows.values()].sort(compareGroupRows)
  sorted.forEach((row, i) => { row.position = i && compareGroupRows(row, sorted[i - 1]) === 0 ? sorted[i - 1].position : i + 1 })
  return sorted
}
const compareGroupRows = (a: TraditionalGroupRow, b: TraditionalGroupRow) => b.wins - a.wins || b.difference - a.difference || b.pointsFor - a.pointsFor

// Reconstruct from persisted results; never mutate or silently reassign a played match.
// Explicit tie orders only resolve equal sporting rows, not a worse group's result.
export function resolveTraditionalTournament(plan: TraditionalPlan, results: readonly TraditionalResult[], tiedTeamOrders: Readonly<Record<string, readonly string[]>> = {}) {
  validateTraditionalConfiguration(plan.teams.length, plan.configuration)
  if (!validateFixedTournamentTeams(plan.teams.flatMap(team => [...team.playerIds]), plan.teams) || new Set(plan.matches.map(match => match.id)).size !== plan.matches.length) fail("invalid_traditional_plan")
  const resultById = new Map(results.map(result => [result.matchId, result]))
  if (resultById.size !== results.length || results.some(result => !plan.matches.some(match => match.id === result.matchId) || !parseTournamentPoints(result.scoreA, result.scoreB))) fail("invalid_traditional_results")
  for (const [groupId, order] of Object.entries(tiedTeamOrders)) {
    const group = plan.groups.find(group => group.id === groupId)
    if (!group || order.length !== group.teamIds.length || new Set(order).size !== order.length || order.some(id => !group.teamIds.includes(id))) fail("invalid_group_tie_order")
  }
  const resolved = new Map<string, TraditionalResolvedMatch>()
  const read = (source: TraditionalSource): { known: boolean; teamId: string | null } => {
    if (!source) return { known: true, teamId: null }
    if (source.kind === "team") {
      if (!plan.teams.some(team => team.id === source.teamId)) fail("invalid_traditional_source")
      return { known: true, teamId: source.teamId }
    }
    if (source.kind === "group") {
      const group = plan.groups.find(group => group.id === source.groupId)
      if (!group) fail("invalid_traditional_source")
      if (plan.matches.some(match => match.groupId === group.id && resolved.get(match.id)?.state !== "completed")) return { known: false, teamId: null }
      const table = groupTable(group, [...resolved.values()])
      const order = tiedTeamOrders[group.id]
      table.sort((a, b) => compareGroupRows(a, b) || (order ? order.indexOf(a.teamId) - order.indexOf(b.teamId) : 0))
      const row = table[source.position - 1]
      if (!row || !order && table.filter(other => compareGroupRows(row, other) === 0).length > 1) return { known: false, teamId: null }
      return { known: true, teamId: row.teamId }
    }
    const previous = resolved.get(source.matchId)
    if (!previous) fail("invalid_traditional_source")
    return previous.state === "pending" || previous.state === "ready" ? { known: false, teamId: null }
      : { known: true, teamId: source.kind === "winner" ? previous.winnerId : previous.loserId }
  }
  for (const match of plan.matches) {
    const a = read(match.a), b = read(match.b), result = resultById.get(match.id)
    const ready = a.known && b.known && a.teamId !== null && b.teamId !== null
    if (ready && a.teamId === b.teamId) fail("invalid_traditional_opponents")
    if (result && (!ready || match.stage !== "group" && result.scoreA === result.scoreB)) fail("invalid_traditional_result_state")
    if (result && (result.teamAId !== a.teamId || result.teamBId !== b.teamId)) fail("played_traditional_match_changed")
    const winnerId = result && result.scoreA !== result.scoreB ? result.scoreA > result.scoreB ? a.teamId : b.teamId
      : a.known && b.known && !ready ? a.teamId ?? b.teamId : null
    const loserId = result && result.scoreA !== result.scoreB ? result.scoreA > result.scoreB ? b.teamId : a.teamId : null
    resolved.set(match.id, { ...match, teamAId: a.teamId, teamBId: b.teamId, state: result ? "completed" : ready ? "ready" : a.known && b.known ? "bye" : "pending",
      winnerId, loserId, scoreA: result?.scoreA ?? null, scoreB: result?.scoreB ?? null })
  }
  const matches = [...resolved.values()], groups = plan.groups.map(group => ({ ...group, table: groupTable(group, matches), complete: matches.filter(match => match.groupId === group.id).every(match => match.state === "completed") }))
  const complete = matches.every(match => match.state === "completed" || match.state === "bye")
  const championIds = !complete ? [] : plan.configuration.format === "groups" ? groups.flatMap(group => group.table.filter(row => row.position === 1).map(row => row.teamId))
    : [matches.filter(match => match.stage === "main").at(-1)!.winnerId!]
  return { matches, groups, complete, championIds,
    thirdPlaceId: complete ? resolved.get("third-place")?.winnerId ?? null : null,
    consolationWinnerId: complete ? matches.filter(match => match.stage === "consolation").at(-1)?.winnerId ?? null : null }
}
