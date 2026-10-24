import type { GeneratedMatch, SeasonScheduleMode } from "@/lib/calendar"

export type LeagueModality = "individual" | "fixed_pairs"
export type LeaguePair = [string, string]

export function isLeaguePlayerCountValid(count: number, modality: LeagueModality = "individual") {
  return Number.isInteger(count) && count <= 32 && (modality === "fixed_pairs" ? count >= 4 && count % 2 === 0 : count >= 8)
}

export function fixedPairBaseRounds(playerCount: number) {
  const pairs = playerCount / 2
  return pairs % 2 === 0 ? pairs - 1 : pairs
}

export function validateLeaguePairs(pairs: unknown, playerIds: string[]): pairs is LeaguePair[] {
  if (!Array.isArray(pairs) || !isLeaguePlayerCountValid(playerIds.length, "fixed_pairs") || pairs.length * 2 !== playerIds.length) return false
  const members = pairs.flatMap(pair => Array.isArray(pair) && pair.length === 2 && pair.every(id => typeof id === "string" && playerIds.includes(id)) ? pair : [])
  return members.length === playerIds.length && new Set(members).size === playerIds.length
}

/** Circle method. Odd team counts receive one bye per complete leg. */
export function generateFixedPairLeagueCalendar({ leagueId, seasonId, pairs, scheduleMode = "single", targetRoundCount }: {
  leagueId: string; seasonId: string; pairs: LeaguePair[]; scheduleMode?: SeasonScheduleMode; targetRoundCount?: number
}): GeneratedMatch[] {
  const ids = pairs.flat()
  if (!validateLeaguePairs(pairs, ids)) throw new Error("invalid_fixed_pairs")
  const baseRounds = fixedPairBaseRounds(ids.length)
  const rounds = targetRoundCount ?? baseRounds * (scheduleMode === "single" ? 1 : 2)
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > baseRounds * 6 || (scheduleMode === "single" && rounds !== baseRounds) || (scheduleMode === "double" && rounds !== baseRounds * 2)) throw new Error("invalid_target_round_count")
  const ring: (LeaguePair | null)[] = [...pairs, ...(pairs.length % 2 ? [null] : [])]
  const leg: { teamA: string[]; teamB: string[] }[][] = []
  for (let round = 0; round < baseRounds; round++) {
    const matches = []
    for (let index = 0; index < ring.length / 2; index++) {
      const a = ring[index], b = ring[ring.length - 1 - index]
      if (a && b) matches.push(round % 2 ? { teamA: [...b], teamB: [...a] } : { teamA: [...a], teamB: [...b] })
    }
    leg.push(matches)
    ring.splice(1, 0, ring.pop()!)
  }
  return Array.from({ length: rounds }, (_, index) => leg[index % baseRounds].map((match, matchIndex): GeneratedMatch => ({
    id: `${seasonId}-round-${index + 1}-match-${matchIndex + 1}`, leagueId, seasonId, round: index + 1,
    ...(Math.floor(index / baseRounds) % 2 ? { teamA: [...match.teamB], teamB: [...match.teamA] } : match),
    status: "scheduling", pointsA: null, pointsB: null, sets: [], scheduledAt: null, dateLabel: null, location: null,
    resultRecordedAt: null, resultReportedByPlayerId: null, resultLocked: false,
  }))).flat()
}

export function areLeagueMatchesPaired(matches: { teamA: string[]; teamB: string[] }[], pairs: LeaguePair[]) {
  const key = (ids: string[]) => [...ids].sort().join("|")
  const allowed = new Set(pairs.map(key))
  return matches.every(match => allowed.has(key(match.teamA)) && allowed.has(key(match.teamB)) && key(match.teamA) !== key(match.teamB))
}

export function auditFixedPairLeagueCalendar(matches: { round: number; teamA: string[]; teamB: string[] }[], pairs: LeaguePair[], rounds: number) {
  const players = pairs.flat()
  const perPlayer = players.map(id => matches.filter(match => [...match.teamA, ...match.teamB].includes(id)).length)
  const structure = validateLeaguePairs(pairs, players) && areLeagueMatchesPaired(matches, pairs)
  const roundStructure = Array.from({ length: rounds }, (_, index) => {
    const round = matches.filter(match => match.round === index + 1)
    const appearances = round.flatMap(match => [...match.teamA, ...match.teamB])
    return round.length === Math.floor(pairs.length / 2) && new Set(appearances).size === appearances.length
  }).every(Boolean) && matches.every(match => Number.isInteger(match.round) && match.round >= 1 && match.round <= rounds)
  const balance = Math.max(...perPlayer) - Math.min(...perPlayer) <= 1
  const key = (team: string[]) => [...team].sort().join("|")
  const counts = new Map<string, number>()
  for (const match of matches) {
    const rivals = [key(match.teamA), key(match.teamB)].sort().join(":")
    counts.set(rivals, (counts.get(rivals) ?? 0) + 1)
  }
  const base = fixedPairBaseRounds(players.length)
  const opponents = pairs.every((pair, i) => pairs.slice(i + 1).every(other => {
    const count = counts.get([key(pair), key(other)].sort().join(":")) ?? 0
    return count >= Math.floor(rounds / base) && count <= Math.ceil(rounds / base)
  }))
  return { structure, roundStructure, balance, opponents, valid: structure && roundStructure && balance && opponents }
}
