import { parseTournamentPoints } from "./tournamentResult"

export const RAPID_TOURNAMENT = {
  players: 12,
  courts: 2,
  reservationMinutes: 120,
  rounds: 6,
  roundMinutes: 16,
  transitionMinutes: 3,
  preparationMinutes: 2,
  safetyMinutes: 2,
  matchesPerPlayer: 4,
  restsPerPlayer: 2,
} as const
// Preserve existing A–X identities; new participants use the remaining letters.
export const RAPID_TOURNAMENT_SLOTS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef".split("")
export type RapidBreakConfig = { breakMinutes?: number; breakEveryRounds?: number }
export type RapidTournamentConfig = { players: number; courts: number; reservationMinutes: number; rounds: number; roundMinutes: number; transitionMinutes: number; preparationMinutes: number } & RapidBreakConfig
export function getRapidBreakOffsetMinutes(round: number, config: RapidBreakConfig) {
  const every = config.breakEveryRounds ?? 0
  return every > 0 ? Math.floor(Math.max(0,round-1)/every)*(config.breakMinutes ?? 0) : 0
}
export function getRapidPauseMinutes(round: number, config: Pick<RapidTournamentConfig,"rounds"|"transitionMinutes"> & RapidBreakConfig) {
  return round >= config.rounds ? 0 : config.transitionMinutes + getRapidBreakOffsetMinutes(round+1,config)-getRapidBreakOffsetMinutes(round,config)
}
export function getRapidRoundCount(reservationMinutes: number) { return Math.floor((reservationMinutes + RAPID_TOURNAMENT.transitionMinutes - RAPID_TOURNAMENT.safetyMinutes) / (RAPID_TOURNAMENT.roundMinutes + RAPID_TOURNAMENT.transitionMinutes)) }
export function getRapidPreparationMax(reservationMinutes: number, rounds = getRapidRoundCount(reservationMinutes)) { return Math.max(0, reservationMinutes - RAPID_TOURNAMENT.safetyMinutes - rounds * RAPID_TOURNAMENT.roundMinutes - Math.max(0, rounds - 1) * RAPID_TOURNAMENT.transitionMinutes) }
export function getRapidActiveCourtCount(players: number, courts: number) { return Math.min(courts, Math.floor(players / 4)) }
export function getRapidMinimumCourtCount(players: number, reservationMinutes: number) { return Math.ceil(players / (getRapidRoundCount(reservationMinutes) * 4)) }
export function validateRapidTournamentConfiguration(players: number, courts: number, reservationMinutes: number) {
  if (!Number.isInteger(players) || players < 8 || players > 16 || !Number.isInteger(courts) || courts < 1 || courts > 4 || ![60, 90, 120].includes(reservationMinutes)) return { ok: false as const, error: "invalid_tournament_configuration" }
  if (courts < getRapidMinimumCourtCount(players, reservationMinutes)) return { ok: false as const, error: "insufficient_matches_for_all_players" }
  return { ok: true as const }
}
export type RapidFixture = {
  round: number
  court: number
  teamA: [string, string]
  teamB: [string, string]
}
export type RapidRoundTemplate = {
  round: number
  rests: string[]
  matches: RapidFixture[]
}
const template: RapidRoundTemplate[] = [
  { round: 1, rests: ["A", "B", "C", "D"], matches: [{ round: 1, court: 1, teamA: ["F", "I"], teamB: ["K", "E"] }, { round: 1, court: 2, teamA: ["L", "H"], teamB: ["J", "G"] }] },
  { round: 2, rests: ["E", "F", "G", "H"], matches: [{ round: 2, court: 1, teamA: ["D", "K"], teamB: ["L", "A"] }, { round: 2, court: 2, teamA: ["C", "I"], teamB: ["B", "J"] }] },
  { round: 3, rests: ["I", "J", "K", "L"], matches: [{ round: 3, court: 1, teamA: ["C", "B"], teamB: ["G", "H"] }, { round: 3, court: 2, teamA: ["D", "A"], teamB: ["E", "F"] }] },
  { round: 4, rests: ["A", "B", "C", "D"], matches: [{ round: 4, court: 1, teamA: ["F", "G"], teamB: ["J", "I"] }, { round: 4, court: 2, teamA: ["H", "E"], teamB: ["K", "L"] }] },
  { round: 5, rests: ["E", "F", "G", "H"], matches: [{ round: 5, court: 1, teamA: ["L", "J"], teamB: ["A", "B"] }, { round: 5, court: 2, teamA: ["K", "I"], teamB: ["D", "C"] }] },
  { round: 6, rests: ["I", "J", "K", "L"], matches: [{ round: 6, court: 1, teamA: ["D", "E"], teamB: ["C", "H"] }, { round: 6, court: 2, teamA: ["A", "F"], teamB: ["G", "B"] }] },
]
export function normalizeTournamentName(value: string) {
  return value.trim().replace(/\s+/g, " ")
}
export function validateTournamentParticipants(values: unknown, expectedCount: number = RAPID_TOURNAMENT.players) {
  if (!Array.isArray(values) || values.length < 4 || values.length > 32 || values.length !== expectedCount) {
    return { ok: false as const, error: "invalid_player_count" }
  }
  const names = values.map((value) => typeof value === "string" ? normalizeTournamentName(value) : "")
  if (names.some((name) => !name)) return { ok: false as const, error: "all_player_names_required" }
  const normalized = names.map((name) => name.toLocaleLowerCase("es"))
  if (new Set(normalized).size !== names.length) return { ok: false as const, error: "duplicate_player_names" }
  if (names.some((name) => name.length > 80)) return { ok: false as const, error: "player_name_too_long" }
  return { ok: true as const, names }
}
export function shuffleTournamentNames(names: readonly string[], random = Math.random) {
  return shuffleTournamentEntries(names, random)
}
export function shuffleTournamentEntries<T>(entries: readonly T[], random = Math.random) {
  const shuffled = [...entries]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}
export function buildRapidFixtures() {
  return template.flatMap((round) => round.matches)
}
export function generateBalancedAmericanaFixtures(playerCount: number, courtCount: number, roundCount: number, random = Math.random) {
  if (![playerCount, courtCount, roundCount].every(Number.isSafeInteger) || playerCount < 4 || playerCount > 32 || courtCount < 1 || courtCount > 4 || roundCount < 1 || roundCount > 100) throw new Error("invalid_tournament_configuration")
  if (playerCount === 12 && courtCount === 2 && roundCount === 6) return buildRapidFixtures()
  const players = RAPID_TOURNAMENT_SLOTS.slice(0, playerCount), courtsPerRound = Math.min(courtCount, Math.floor(playerCount / 4)), played = new Map(players.map((id) => [id, 0])), restStreaks = new Map(players.map((id) => [id, 0])), partnerCounts = new Map<string, number>(), rivalCounts = new Map<string, number>(), courtCounts = new Map(players.map((id) => [id, new Map<number, number>()]))
  const fixtures: RapidFixture[] = []
  for (let round = 1; round <= roundCount; round++) {
    const selected = [...players].sort((a, b) => restStreaks.get(b)! - restStreaks.get(a)! || played.get(a)! - played.get(b)! || random() - 0.5).slice(0, courtsPerRound * 4)
    for (const id of players) restStreaks.set(id, selected.includes(id) ? 0 : restStreaks.get(id)! + 1)
    let best: { matches: RapidFixture[]; score: number } | null = null
    for (let attempt = 0; attempt < 160; attempt++) {
      const order = shuffleTournamentEntries(selected, random), candidate: RapidFixture[] = []
      for (let court = 0; court < courtsPerRound; court++) {
        const four = order.slice(court * 4, court * 4 + 4), splits: [[string, string], [string, string]][] = [[[four[0], four[1]], [four[2], four[3]]], [[four[0], four[2]], [four[1], four[3]]], [[four[0], four[3]], [four[1], four[2]]]]
        const [teamA, teamB] = splits.sort((a, b) => (pairCost(a[0], partnerCounts) + pairCost(a[1], partnerCounts) + opponentCost(a[0], a[1], rivalCounts)) - (pairCost(b[0], partnerCounts) + pairCost(b[1], partnerCounts) + opponentCost(b[0], b[1], rivalCounts)))[0]
        candidate.push({ round, court: court + 1, teamA, teamB })
      }
      const score = players.reduce((total, id) => total + Array.from({ length: courtsPerRound }, (_, index) => { const court = index + 1, current = courtCounts.get(id)?.get(court) ?? 0, added = candidate.some((match) => match.court === court && [...match.teamA, ...match.teamB].includes(id)) ? 1 : 0; return (current + added) ** 2 }).reduce((sum, value) => sum + value, 0), 0)
      if (!best || score < best.score) best = { matches: candidate, score }
      if (score === 0) break
    }
    for (const match of best!.matches) { fixtures.push(match); for (const [team, rivals] of [[match.teamA, match.teamB], [match.teamB, match.teamA]] as const) for (const id of team) { played.set(id, played.get(id)! + 1); courtCounts.get(id)!.set(match.court, (courtCounts.get(id)!.get(match.court) ?? 0) + 1); partnerCounts.set([id, team.find((other) => other !== id)!].sort().join("|"), (partnerCounts.get([id, team.find((other) => other !== id)!].sort().join("|")) ?? 0) + 1); for (const rival of rivals) rivalCounts.set([id, rival].sort().join("|"), (rivalCounts.get([id, rival].sort().join("|")) ?? 0) + 1) } }
  }
  const courtHistory = new Map(players.map((id) => [id, Array(courtsPerRound).fill(0) as number[]])), permutations = (values: number[]): number[][] => values.length < 2 ? [values] : values.flatMap((value, index) => permutations(values.filter((_, itemIndex) => itemIndex !== index)).map((tail) => [value, ...tail]))
  for (let round = 1; round <= roundCount; round += 1) {
    const roundMatches = fixtures.filter((match) => match.round === round), assignments = permutations(shuffleTournamentEntries(Array.from({ length: courtsPerRound }, (_, index) => index + 1)))
    let bestAssignment = assignments[0], bestScore = Number.POSITIVE_INFINITY
    for (const assignment of assignments) { const score = roundMatches.reduce((total, match, index) => total + [...match.teamA, ...match.teamB].reduce((sum, id) => sum + (courtHistory.get(id)![assignment[index] - 1] + 1) ** 2, 0), 0); if (score < bestScore) { bestScore = score; bestAssignment = assignment } }
    roundMatches.forEach((match, index) => { match.court = bestAssignment[index]; for (const id of [...match.teamA, ...match.teamB]) courtHistory.get(id)![match.court - 1] += 1 })
  }
  return fixtures
}
function pairCost(team: readonly string[], counts: Map<string, number>) { return (counts.get([...team].sort().join("|")) ?? 0) * 12 }
function opponentCost(teamA: readonly string[], teamB: readonly string[], counts: Map<string, number>) { return teamA.reduce((sum, a) => sum + teamB.reduce((score, b) => score + (counts.get([a, b].sort().join("|")) ?? 0) * 4, 0), 0) }
export type RapidScheduleCheck = { id: string; passed: boolean }
export type RapidPlayerScheduleCheck = {
  id: string
  name: string
  played: number
  rested: number
  playedMinutes: number
  maxConsecutivePlayed: number
  maxConsecutiveRested: number
  uniquePartners: number
  uniqueOpponents: number
  courts: number[]
}
export function buildRapidScheduleChecks(
  players: readonly { id: string; name: string }[],
  matches: readonly { round: number; court: number; teamAIds: readonly string[]; teamBIds: readonly string[] }[],
  config: RapidTournamentConfig = RAPID_TOURNAMENT,
) {
  const ids = new Set(players.map((player) => player.id))
  const stats = new Map(players.map((player) => [player.id, {
    playedRounds: [] as number[], rests: [] as number[], partners: new Set<string>(),
    opponents: new Set<string>(), courts: Array(config.courts).fill(0) as number[],
  }]))
  let validRounds = ids.size === players.length && matches.every(match => Number.isInteger(match.round) && match.round >= 1 && match.round <= config.rounds)
  const courtMatchCounts = Array(config.courts).fill(0) as number[]
  const courtsPerRound = getRapidActiveCourtCount(config.players, config.courts), expectedGames = Math.floor(config.rounds * courtsPerRound * 4 / config.players)
  for (let round = 1; round <= config.rounds; round += 1) {
    const roundMatches = matches.filter((match) => match.round === round)
    const participants = roundMatches.flatMap((match) => [...match.teamAIds, ...match.teamBIds])
    if (roundMatches.length !== courtsPerRound || new Set(roundMatches.map(match => match.court)).size !== roundMatches.length || new Set(participants).size !== participants.length || participants.some((id) => !ids.has(id))) validRounds = false
    for (const match of roundMatches) {
      if (!Number.isInteger(match.court) || match.court < 1 || match.court > courtsPerRound) validRounds = false
      else courtMatchCounts[match.court - 1] += 1
      if (match.teamAIds.length !== 2 || match.teamBIds.length !== 2) validRounds = false
      for (const [team, rivals] of [[match.teamAIds, match.teamBIds], [match.teamBIds, match.teamAIds]] as const) {
        for (const id of team) {
          const item = stats.get(id)
          if (!item) continue
          item.playedRounds.push(round)
          const partner = team.find((other) => other !== id)
          if (partner) item.partners.add(partner)
          for (const rival of rivals) item.opponents.add(rival)
          if (match.court >= 1 && match.court <= config.courts) item.courts[match.court - 1] += 1
        }
      }
    }
    for (const player of players) if (!participants.includes(player.id)) stats.get(player.id)?.rests.push(round)
  }
  const playerChecks: RapidPlayerScheduleCheck[] = players.map((player) => {
    const item = stats.get(player.id)!
    const playedSet = new Set(item.playedRounds)
    let maxConsecutivePlayed = 0, maxConsecutiveRested = 0, playingRun = 0, restingRun = 0
    for (let round = 1; round <= config.rounds; round += 1) {
      if (playedSet.has(round)) { playingRun += 1; restingRun = 0 }
      else { restingRun += 1; playingRun = 0 }
      maxConsecutivePlayed = Math.max(maxConsecutivePlayed, playingRun)
      maxConsecutiveRested = Math.max(maxConsecutiveRested, restingRun)
    }
    return {
      id: player.id, name: player.name, played: item.playedRounds.length,
      rested: item.rests.length, playedMinutes: item.playedRounds.length * config.roundMinutes,
      maxConsecutivePlayed, maxConsecutiveRested, courts: item.courts,
      uniquePartners: item.partners.size, uniqueOpponents: item.opponents.size,
    }
  })
  const checks: RapidScheduleCheck[] = [
    { id: "complete-calendar", passed: players.length === config.players && matches.length === config.rounds * courtsPerRound && validRounds },
    { id: "equal-participation", passed: Math.max(...playerChecks.map((p) => p.played)) - Math.min(...playerChecks.map((p) => p.played)) <= 1 && playerChecks.every((p) => p.played >= expectedGames) },
    { id: "breaks-and-streaks", passed: playerChecks.every((player) => player.maxConsecutiveRested <= Math.ceil(player.rested / (player.played + 1)) + 1 && player.maxConsecutivePlayed <= config.rounds) },
    { id: "partners-and-opponents", passed: playerChecks.every((player) => player.uniquePartners >= Math.min(config.players - 1, player.played, Math.max(2, Math.ceil(player.played / 2))) && player.uniqueOpponents >= Math.min(config.players - 1, Math.ceil(player.played / 2))) },
    { id: "court-balance", passed: Math.max(...courtMatchCounts.slice(0, courtsPerRound)) - Math.min(...courtMatchCounts.slice(0, courtsPerRound)) <= 1 },
    { id: "player-court-balance", passed: playerChecks.every(player => Math.max(...player.courts.slice(0,courtsPerRound))-Math.min(...player.courts.slice(0,courtsPerRound))<=1) },
  ]
  // Integrity/participation are mandatory. Variety and streaks are audited
  // optimizations, not proof that a mathematically viable tournament is impossible.
  return { passed: checks.filter(check => check.id === "complete-calendar" || check.id === "equal-participation").every(check => check.passed), allPassed: checks.every(check => check.passed), checks, players: playerChecks }
}
export function buildRapidRounds(startAt: string | Date, config: Pick<RapidTournamentConfig, "rounds" | "roundMinutes" | "transitionMinutes"> & RapidBreakConfig = RAPID_TOURNAMENT) {
  const start = startAt instanceof Date ? startAt.getTime() : Date.parse(startAt)
  if (!Number.isFinite(start)) throw new Error("invalid_tournament_start")
  return Array.from({ length: config.rounds }, (_, index) => {
    const startTime = start + (index * (config.roundMinutes + config.transitionMinutes) + getRapidBreakOffsetMinutes(index+1,config)) * 60_000
    return { round: index + 1, startsAt: new Date(startTime).toISOString(), endsAt: new Date(startTime + config.roundMinutes * 60_000).toISOString() }
  })
}
export function getRapidRoundAt(rounds: readonly { round: number; startsAt: string; endsAt: string }[], now = new Date()) {
  const timestamp = now.getTime()
  const current = rounds.find((round) => timestamp >= Date.parse(round.startsAt) && timestamp < Date.parse(round.endsAt))
  if (current) return { round: current.round, phase: "playing" as const, endsAt: current.endsAt }
  const next = rounds.find((round) => timestamp < Date.parse(round.startsAt))
  if (next) return { round: next.round, phase: "upcoming" as const, startsAt: next.startsAt, endsAt: next.endsAt }
  return null
}
export type RapidTournamentMatch = {
  id: string
  round: number
  court: number
  teamA: [string, string]
  teamB: [string, string]
  scoreA: number | null
  scoreB: number | null
}
export type RapidStanding = {
  player: string
  played: number
  pending: number
  wins: number
  pointsFor: number
  pointsAgainst: number
  averagePercent: number
  globalPercent: number
  position: number
}
function greatestCommonDivisor(a: bigint, b: bigint): bigint {
  while (b !== BigInt(0)) [a, b] = [b, a % b]
  return a || BigInt(1)
}
function addPercentage(stats: { percentNumerator: bigint; percentDenominator: bigint }, points: number, total: number) {
  const numerator = stats.percentNumerator * BigInt(total) + BigInt(points) * stats.percentDenominator
  const denominator = stats.percentDenominator * BigInt(total)
  const divisor = greatestCommonDivisor(numerator, denominator)
  stats.percentNumerator = numerator / divisor
  stats.percentDenominator = denominator / divisor
}
function finiteRatio(numerator: bigint, denominator: bigint) {
  // Ranking keeps the exact fractions. Convert only the display ratio, without
  // overflowing Number when many different score totals multiply denominators.
  const scale = BigInt(1_000_000_000_000_000)
  return Number(numerator / denominator) + Number((numerator % denominator) * scale / denominator) / Number(scale)
}
export function calculateRapidStandings(names: readonly string[], matches: readonly { id?: string; round?: number; court?: number; teamA: readonly string[]; teamB: readonly string[]; scoreA: number | null; scoreB: number | null }[]) {
  const stats = new Map(names.map((player) => [player, { played: 0, wins: 0, pointsFor: 0, pointsAgainst: 0, percentNumerator: BigInt(0), percentDenominator: BigInt(1) }]))
  const scheduled = new Map(names.map((player) => [player, 0]))
  for (const match of matches) {
    for (const player of [...match.teamA, ...match.teamB]) scheduled.set(player, (scheduled.get(player) ?? 0) + 1)
    if (!parseTournamentPoints(match.scoreA, match.scoreB) || match.scoreA === null || match.scoreB === null) continue
    const total = match.scoreA + match.scoreB
    if (total <= 0 || !Number.isInteger(match.scoreA) || !Number.isInteger(match.scoreB)) continue
    for (const player of match.teamA) {
      const item = stats.get(player)
      if (!item) continue
      item.played += 1; addPercentage(item, match.scoreA, total); item.pointsFor += match.scoreA; item.pointsAgainst += match.scoreB
      if (match.scoreA > match.scoreB) item.wins += 1
    }
    for (const player of match.teamB) {
      const item = stats.get(player)
      if (!item) continue
      item.played += 1; addPercentage(item, match.scoreB, total); item.pointsFor += match.scoreB; item.pointsAgainst += match.scoreA
      if (match.scoreB > match.scoreA) item.wins += 1
    }
  }
  const sorted = [...stats].map(([player, item]) => ({
    player, played: item.played, pending: Math.max(0, (scheduled.get(player) ?? 0) - item.played), wins: item.wins,
    pointsFor: item.pointsFor, pointsAgainst: item.pointsAgainst,
    averagePercent: item.played ? finiteRatio(item.percentNumerator, item.percentDenominator) / item.played * 100 : 0,
    globalPercent: item.pointsFor + item.pointsAgainst ? item.pointsFor / (item.pointsFor + item.pointsAgainst) * 100 : 0,
    rankNumerator: item.percentNumerator,
    rankDenominator: item.percentDenominator,
    position: 0,
  })).sort((a, b) => {
    const averageLeft = a.rankNumerator * b.rankDenominator * BigInt(b.played || 1)
    const averageRight = b.rankNumerator * a.rankDenominator * BigInt(a.played || 1)
    if (averageLeft !== averageRight) return averageLeft > averageRight ? -1 : 1
    if (a.wins !== b.wins) return b.wins - a.wins
    const aTotal = a.pointsFor + a.pointsAgainst, bTotal = b.pointsFor + b.pointsAgainst
    const globalLeft = BigInt(a.pointsFor) * BigInt(bTotal || 1)
    const globalRight = BigInt(b.pointsFor) * BigInt(aTotal || 1)
    if (globalLeft !== globalRight) return globalLeft > globalRight ? -1 : 1
    return b.pointsFor - a.pointsFor || a.player.localeCompare(b.player, "es")
  })
  sorted.forEach((item, index) => {
    const previous = sorted[index - 1]
    const sameAverage = previous && item.rankNumerator * previous.rankDenominator * BigInt(previous.played || 1) === previous.rankNumerator * item.rankDenominator * BigInt(item.played || 1)
    const sameGlobal = previous && BigInt(item.pointsFor) * BigInt(previous.pointsFor + previous.pointsAgainst || 1) === BigInt(previous.pointsFor) * BigInt(item.pointsFor + item.pointsAgainst || 1)
    item.position = previous && sameAverage && item.wins === previous.wins && sameGlobal && item.pointsFor === previous.pointsFor
      ? previous.position : index + 1
  })
  return sorted.map(item => ({
    player: item.player, played: item.played, pending: item.pending, wins: item.wins,
    pointsFor: item.pointsFor, pointsAgainst: item.pointsAgainst,
    averagePercent: item.averagePercent, globalPercent: item.globalPercent, position: item.position,
  }))
}
export function getTournamentChampions(standings: readonly RapidStanding[], status: string, completedMatches: number, expectedMatches = 12) {
  if (status !== "finished" || completedMatches !== expectedMatches || !standings.length) return []
  return standings.filter((item) => item.position === 1)
}
