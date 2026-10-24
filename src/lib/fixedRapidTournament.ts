import { calculateMexicanoStandings, type MexicanoMatch, type MexicanoRound } from "./dynamicMexicano"
import { calculateRapidStandings } from "./rapidTournament"
import { parseTournamentPoints } from "./tournamentResult"

export type FixedTournamentTeam = { id: string; playerIds: readonly [string, string] }
type FixedFormat = "balanced_americana" | "dynamic_mexicano"

export function fixedTeamsFromPlayers(players: readonly { id: string; pairNumber?: number | null }[]): FixedTournamentTeam[] {
  const groups = new Map<number, string[]>()
  for (const player of players) {
    if (!Number.isInteger(player.pairNumber) || player.pairNumber! < 1 || player.pairNumber! > Math.min(16, players.length/2)) throw new Error("invalid_fixed_teams")
    groups.set(player.pairNumber!, [...(groups.get(player.pairNumber!) ?? []), player.id])
  }
  const teams = [...groups].sort(([a],[b]) => a-b).map(([number, ids]) => ({ id: `pair-${number}`, playerIds: ids as [string,string] }))
  if (!validateFixedTournamentTeams(players.map(player => player.id), teams)) throw new Error("invalid_fixed_teams")
  return teams
}

export function validateFixedTournamentTeams(playerIds: readonly string[], teams: readonly FixedTournamentTeam[]) {
  const members = teams.flatMap(team => [...team.playerIds])
  return playerIds.length >= 4 && playerIds.length <= 32 && playerIds.length % 2 === 0 &&
    teams.length * 2 === playerIds.length && new Set(playerIds).size === playerIds.length &&
    teams.every(team => Boolean(team.id) && team.playerIds.length === 2) && new Set(teams.map(team => team.id)).size === teams.length &&
    new Set(members).size === playerIds.length && members.every(id => Boolean(id) && playerIds.includes(id))
}

const key = (ids: readonly string[]) => [...ids].sort().join("\u0000")
function hash(seed: number, text: string) {
  let value = seed >>> 0
  for (const character of text) value = Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0
  return value
}
function compare(a: readonly number[], b: readonly number[]) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]
  return 0
}
function teamMatches(teams: readonly FixedTournamentTeam[], history: readonly MexicanoMatch[]) {
  if (!validateFixedTournamentTeams(teams.flatMap(team => [...team.playerIds]), teams)) throw new Error("invalid_fixed_teams")
  const byMembers = new Map(teams.map(team => [key(team.playerIds), team.id]))
  const occupied = new Set<string>(), courts = new Set<string>()
  return history.map(match => {
    const a = byMembers.get(key(match.teamAIds)), b = byMembers.get(key(match.teamBIds))
    if (!a || !b || a === b || !Number.isSafeInteger(match.round) || match.round < 1 || !Number.isSafeInteger(match.court) || match.court < 1 || match.court > 4 ||
      occupied.has(`${match.round}:${a}`) || occupied.has(`${match.round}:${b}`) || courts.has(`${match.round}:${match.court}`)) throw new Error("invalid_fixed_history")
    occupied.add(`${match.round}:${a}`); occupied.add(`${match.round}:${b}`); courts.add(`${match.round}:${match.court}`)
    return { ...match, a, b }
  })
}

// Count a fixed pair once, reusing the exact existing sport-specific ranking rules.
export function calculateFixedRapidStandings(teams: readonly FixedTournamentTeam[], history: readonly MexicanoMatch[], format: FixedFormat, generatedRounds = Math.max(0, ...history.map(match => match.round))) {
  if (format !== "balanced_americana" && format !== "dynamic_mexicano") throw new Error("invalid_fixed_configuration")
  const matches = teamMatches(teams, history)
  const percentages = calculateRapidStandings(teams.map(team => team.id), matches.map(match => ({ ...match, teamA: [match.a], teamB: [match.b] })))
  const ratings = calculateMexicanoStandings(teams.map(team => ({ id: team.id, name: team.id })), matches.map(match => ({ ...match, teamAIds: [match.a], teamBIds: [match.b] })), generatedRounds)
  const percentById = new Map(percentages.map(row => [row.player, row])), ratingById = new Map(ratings.map(row => [row.id, row]))
  const order = format === "dynamic_mexicano" ? ratings.map(row => row.id) : percentages.map(row => row.player)
  return order.map(id => ({ ...percentById.get(id)!, id, playerIds: teams.find(team => team.id === id)!.playerIds,
    rating: ratingById.get(id)!.rating, rests: ratingById.get(id)!.rests, draws: ratingById.get(id)!.draws, losses: ratingById.get(id)!.losses, difference: ratingById.get(id)!.difference,
    position: format === "dynamic_mexicano" ? ratingById.get(id)!.position : percentById.get(id)!.position }))
}

type Pair = readonly [string, string]
function pairings(ids: readonly string[]): Pair[][] {
  if (!ids.length) return [[]]
  const [first, ...remaining] = ids
  return remaining.flatMap((other, index) => pairings(remaining.filter((_, i) => i !== index)).map(rest => [[first, other] as Pair, ...rest]))
}
function permutations(values: readonly number[]): number[][] {
  return values.length < 2 ? [[...values]] : values.flatMap((value, index) => permutations(values.filter((_, i) => i !== index)).map(rest => [value, ...rest]))
}

export function generateFixedRapidRound(input: { teams: readonly FixedTournamentTeam[]; history: readonly MexicanoMatch[]; courts: number; round: number; seed: number; format: FixedFormat }): MexicanoRound {
  const { teams, history, courts, round, seed, format } = input
  if (!Number.isSafeInteger(courts) || courts < 1 || courts > 4 || !Number.isSafeInteger(round) || round < 1 || round > 100 || !Number.isSafeInteger(seed) ||
    (format !== "balanced_americana" && format !== "dynamic_mexicano")) throw new Error("invalid_fixed_configuration")
  const past = teamMatches(teams, history)
  if (past.some(match => match.round >= round)) throw new Error("invalid_fixed_history")
  const active = Math.min(courts, Math.floor(teams.length / 2))
  for (let previous = 1; previous < round; previous++) if (past.filter(match => match.round === previous).length !== active) throw new Error("invalid_fixed_history")
  // A new dynamic round requires the complete previous round, never a partial history.
  if (format === "dynamic_mexicano" && round > 1 && past.some(match => !parseTournamentPoints(match.scoreA, match.scoreB))) throw new Error("previous_round_incomplete")
  const played = new Map(teams.map(team => [team.id, 0])), lastPlayed = new Map(teams.map(team => [team.id, 0]))
  const usage = new Map(teams.map(team => [team.id, Array(active).fill(0) as number[]])), rivals = new Map<string, number>()
  for (const match of past) {
    if (match.court > active) throw new Error("invalid_fixed_history")
    for (const id of [match.a, match.b]) { played.set(id, played.get(id)! + 1); lastPlayed.set(id, Math.max(lastPlayed.get(id)!, match.round)); usage.get(id)![match.court - 1]++ }
    const pair = key([match.a, match.b]); rivals.set(pair, (rivals.get(pair) ?? 0) + 1)
  }
  const selected = [...teams].sort((a, b) => played.get(a.id)! - played.get(b.id)! || lastPlayed.get(a.id)! - lastPlayed.get(b.id)! || hash(seed + round, a.id) - hash(seed + round, b.id) || a.id.localeCompare(b.id, "en")).slice(0, active * 2)
  const rating = new Map(calculateFixedRapidStandings(teams, history, format, round - 1).map(row => [row.id, row.rating]))
  const candidates = pairings(selected.map(team => team.id)).map(pairs => {
    const differences = pairs.map(([a, b]) => Math.abs(rating.get(a)! - rating.get(b)!))
    return { pairs, maximum: Math.max(...differences), difference: differences.reduce((a, b) => a + b, 0), repeats: pairs.reduce((sum, pair) => sum + (rivals.get(key(pair)) ?? 0), 0), tie: hash(seed + round, pairs.flat().join("|")) }
  })
  const minimum = Math.min(...candidates.map(candidate => candidate.maximum))
  const eligible = format === "dynamic_mexicano" ? candidates.filter(candidate => candidate.maximum <= minimum + 3) : candidates
  eligible.sort((a, b) => compare(format === "dynamic_mexicano" ? [a.repeats, a.difference, a.maximum, a.tie] : [a.repeats, a.tie], format === "dynamic_mexicano" ? [b.repeats, b.difference, b.maximum, b.tie] : [b.repeats, b.tie]))
  const pairs = eligible[0].pairs
  const layouts = permutations(Array.from({ length: active }, (_, i) => i + 1)).map(assignment => ({ assignment, cost: pairs.reduce((sum, pair, i) => sum + pair.reduce((total, id) => total + (usage.get(id)![assignment[i] - 1] + 1) ** 2, 0), 0) }))
  layouts.sort((a, b) => a.cost - b.cost || hash(seed + round, a.assignment.join()) - hash(seed + round, b.assignment.join()))
  const byId = new Map(teams.map(team => [team.id, team])), playing = new Set(selected.flatMap(team => [...team.playerIds]))
  return { round, matches: pairs.map(([a, b], i) => ({ court: layouts[0].assignment[i], teamAIds: [...byId.get(a)!.playerIds], teamBIds: [...byId.get(b)!.playerIds], imbalance: Math.abs(rating.get(a)! - rating.get(b)!) })), restingIds: teams.flatMap(team => [...team.playerIds]).filter(id => !playing.has(id)) }
}

export function generateFixedAmericanaFixtures(teams: readonly FixedTournamentTeam[], courts: number, rounds: number, seed: number) {
  if (!Number.isSafeInteger(rounds) || rounds < 1 || rounds > 100) throw new Error("invalid_fixed_configuration")
  const history: MexicanoMatch[] = []
  for (let round = 1; round <= rounds; round++) {
    const generated = generateFixedRapidRound({ teams, courts, round, seed, history, format: "balanced_americana" })
    history.push(...generated.matches.map(match => ({ ...match, round, scoreA: null, scoreB: null })))
  }
  return history
}
