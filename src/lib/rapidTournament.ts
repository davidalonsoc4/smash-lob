export const RAPID_TOURNAMENT = {
  players: 12,
  courts: 2,
  reservationMinutes: 120,
  rounds: 6,
  roundMinutes: 16,
  transitionMinutes: 3,
  safetyMinutes: 9,
  matchesPerPlayer: 4,
  restsPerPlayer: 2,
} as const

export const RAPID_TOURNAMENT_SLOTS = "ABCDEFGHIJKL".split("")

export type RapidFixture = {
  round: number
  court: 1 | 2
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

export function validateTournamentParticipants(values: unknown) {
  if (!Array.isArray(values) || values.length !== RAPID_TOURNAMENT.players) {
    return { ok: false as const, error: "exactly_twelve_players_required" }
  }
  const names = values.map((value) => typeof value === "string" ? normalizeTournamentName(value) : "")
  if (names.some((name) => !name)) return { ok: false as const, error: "all_player_names_required" }
  const normalized = names.map((name) => name.toLocaleLowerCase("es"))
  if (new Set(normalized).size !== names.length) return { ok: false as const, error: "duplicate_player_names" }
  if (names.some((name) => name.length > 80)) return { ok: false as const, error: "player_name_too_long" }
  return { ok: true as const, names }
}

export function shuffleTournamentNames(names: readonly string[], random = Math.random) {
  const shuffled = [...names]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

export function buildRapidFixtures() {
  return template.flatMap((round) => round.matches)
}

export function buildRapidRounds(startAt: string | Date) {
  const start = startAt instanceof Date ? startAt.getTime() : Date.parse(startAt)
  if (!Number.isFinite(start)) throw new Error("invalid_tournament_start")
  return Array.from({ length: RAPID_TOURNAMENT.rounds }, (_, index) => {
    const startTime = start + index * (RAPID_TOURNAMENT.roundMinutes + RAPID_TOURNAMENT.transitionMinutes) * 60_000
    return { round: index + 1, startsAt: new Date(startTime).toISOString(), endsAt: new Date(startTime + RAPID_TOURNAMENT.roundMinutes * 60_000).toISOString() }
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
  court: 1 | 2
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

export function calculateRapidStandings(names: readonly string[], matches: readonly RapidTournamentMatch[]) {
  const stats = new Map(names.map((player) => [player, { played: 0, wins: 0, pointsFor: 0, pointsAgainst: 0, percentNumerator: BigInt(0), percentDenominator: BigInt(1) }]))
  for (const match of matches) {
    if (match.scoreA === null || match.scoreB === null) continue
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
    player, played: item.played, pending: RAPID_TOURNAMENT.matchesPerPlayer - item.played, wins: item.wins,
    pointsFor: item.pointsFor, pointsAgainst: item.pointsAgainst,
    averagePercent: item.played ? Number(item.percentNumerator) / Number(item.percentDenominator) / item.played * 100 : 0,
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

export function getTournamentChampions(standings: readonly RapidStanding[], status: string, completedMatches: number) {
  if (status !== "finished" || completedMatches !== 12 || !standings.length) return []
  return standings.filter((item) => item.position === 1)
}
