import { parseTournamentPoints } from "./tournamentResult"

export type MexicanoPlayer = { id: string; name: string }
export type MexicanoMatch = {
  round: number
  court: number
  teamAIds: [string, string]
  teamBIds: [string, string]
  scoreA: number | null
  scoreB: number | null
}
export type MexicanoStanding = {
  id: string
  name: string
  played: number
  wins: number
  draws: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  difference: number
  rests: number
  rating: number
  position: number
}
export type MexicanoRound = {
  round: number
  matches: Array<{ court: number; teamAIds: [string, string]; teamBIds: [string, string]; imbalance: number }>
  restingIds: string[]
}

function seededHash(seed: number, value: string) {
  let hash = (seed ^ 0x9e3779b9) >>> 0
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x85ebca6b) >>> 0
    hash ^= hash >>> 13
  }
  return hash >>> 0
}

function pairKey(left: string, right: string) {
  return left < right ? `${left}|${right}` : `${right}|${left}`
}

export function calculateMexicanoStandings(players: readonly MexicanoPlayer[], matches: readonly MexicanoMatch[], generatedRounds = Math.max(0, ...matches.map((match) => match.round))) {
  const stats = new Map(players.map((player) => [player.id, { ...player, played: 0, wins: 0, draws: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, rests: generatedRounds }]))
  for (const match of matches) {
    const participants = [...match.teamAIds, ...match.teamBIds]
    for (const id of participants) { const item = stats.get(id); if (item) item.rests = Math.max(0, item.rests - 1) }
    if (!parseTournamentPoints(match.scoreA, match.scoreB) || match.scoreA === null || match.scoreB === null) continue
    const update = (ids: readonly string[], pointsFor: number, pointsAgainst: number) => ids.forEach((id) => {
      const item = stats.get(id); if (!item) return
      item.played += 1; item.pointsFor += pointsFor; item.pointsAgainst += pointsAgainst
      if (pointsFor > pointsAgainst) item.wins += 1
      else if (pointsFor === pointsAgainst) item.draws += 1
      else item.losses += 1
    })
    update(match.teamAIds, match.scoreA, match.scoreB)
    update(match.teamBIds, match.scoreB, match.scoreA)
  }
  const sorted = [...stats.values()].map((item) => ({
    ...item,
    difference: item.pointsFor - item.pointsAgainst,
    rating: 100 * (item.pointsFor + 3) / (item.pointsFor + item.pointsAgainst + 6),
    position: 0,
  })).sort((left, right) => right.rating - left.rating || right.wins - left.wins || right.difference - left.difference || right.pointsFor - left.pointsFor || left.id.localeCompare(right.id))
  sorted.forEach((item, index) => {
    const previous = sorted[index - 1]
    item.position = previous && item.rating === previous.rating && item.wins === previous.wins && item.difference === previous.difference && item.pointsFor === previous.pointsFor ? previous.position : index + 1
  })
  return sorted
}

function combinations<T>(items: readonly T[], size: number) {
  const result: T[][] = [], picked: T[] = []
  const visit = (offset: number) => {
    if (picked.length === size) { result.push([...picked]); return }
    for (let index = offset; index <= items.length - (size - picked.length); index += 1) { picked.push(items[index]); visit(index + 1); picked.pop() }
  }
  visit(0)
  return result
}

function selectRoundPlayers(players: readonly MexicanoPlayer[], history: readonly MexicanoMatch[], required: number, round: number, seed: number) {
  const played = new Map(players.map((player) => [player.id, 0])), rested = new Map(players.map((player) => [player.id, 0]))
  const previousPlaying = new Set(history.filter((match) => match.round === round - 1).flatMap((match) => [...match.teamAIds, ...match.teamBIds]))
  for (let generatedRound = 1; generatedRound < round; generatedRound += 1) {
    const playing = new Set(history.filter((match) => match.round === generatedRound).flatMap((match) => [...match.teamAIds, ...match.teamBIds]))
    for (const player of players) {
      if (playing.has(player.id)) played.set(player.id, (played.get(player.id) ?? 0) + 1)
      else rested.set(player.id, (rested.get(player.id) ?? 0) + 1)
    }
  }
  const candidates = combinations(players, required).map((selected) => {
    const selectedIds = new Set(selected.map((player) => player.id))
    const projected = players.map((player) => (played.get(player.id) ?? 0) + (selectedIds.has(player.id) ? 1 : 0))
    const consecutiveRests = players.filter((player) => !selectedIds.has(player.id) && !previousPlaying.has(player.id) && round > 1).length
    const restPriority = selected.reduce((sum, player) => sum + (rested.get(player.id) ?? 0), 0)
    const tie = selected.reduce((sum, player) => sum + seededHash(seed + round, player.id), 0) >>> 0
    return { selected, score: [Math.max(...projected) - Math.min(...projected), consecutiveRests, -restPriority, tie] }
  })
  candidates.sort((left, right) => compareNumbers(left.score, right.score))
  return candidates[0]?.selected ?? []
}

type PairingState = { remaining: string[]; matches: MexicanoRound["matches"]; score: number[]; tie: number }

function compareNumbers(left: readonly number[], right: readonly number[]) {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) if ((left[index] ?? 0) !== (right[index] ?? 0)) return (left[index] ?? 0) - (right[index] ?? 0)
  return 0
}

function buildPairings(selected: readonly MexicanoPlayer[], standings: readonly MexicanoStanding[], history: readonly MexicanoMatch[], round: number, seed: number) {
  const rating = new Map(standings.map((item) => [item.id, item.rating])), rank = new Map(standings.map((item, index) => [item.id, index]))
  const partners = new Map<string, number>(), rivals = new Map<string, number>(), previousPartners = new Set<string>()
  for (const match of history) {
    for (const team of [match.teamAIds, match.teamBIds] as const) partners.set(pairKey(...team), (partners.get(pairKey(...team)) ?? 0) + 1)
    for (const left of match.teamAIds) for (const right of match.teamBIds) rivals.set(pairKey(left, right), (rivals.get(pairKey(left, right)) ?? 0) + 1)
    if (match.round === round - 1) for (const team of [match.teamAIds, match.teamBIds] as const) previousPartners.add(pairKey(...team))
  }
  const ordered = selected.map((player) => player.id).sort((left, right) => seededHash(seed + round, left) - seededHash(seed + round, right) || left.localeCompare(right))
  let beam: PairingState[] = [{ remaining: ordered, matches: [], score: [0, 0, 0, 0, 0, 0], tie: 0 }]
  const width = selected.length <= 8 ? Number.MAX_SAFE_INTEGER : 450
  while (beam[0]?.remaining.length) {
    const next: PairingState[] = []
    for (const state of beam) {
      const [anchor, ...rest] = state.remaining
      for (const trio of combinations(rest, 3)) {
        const layouts: Array<[[string, string], [string, string]]> = [
          [[anchor, trio[0]], [trio[1], trio[2]]], [[anchor, trio[1]], [trio[0], trio[2]]], [[anchor, trio[2]], [trio[0], trio[1]]],
        ]
        for (const [teamA, teamB] of layouts) {
          const strengthA = (rating.get(teamA[0]) ?? 50) + (rating.get(teamA[1]) ?? 50), strengthB = (rating.get(teamB[0]) ?? 50) + (rating.get(teamB[1]) ?? 50)
          const imbalance = Math.abs(strengthA - strengthB) / 2
          const previousRepeat = Number(previousPartners.has(pairKey(...teamA))) + Number(previousPartners.has(pairKey(...teamB)))
          const partnerRepeats = (partners.get(pairKey(...teamA)) ?? 0) + (partners.get(pairKey(...teamB)) ?? 0)
          const rivalRepeats = teamA.reduce((sum, left) => sum + teamB.reduce((inner, right) => inner + (rivals.get(pairKey(left, right)) ?? 0), 0), 0)
          const inverse = [teamA, teamB].reduce((sum, team) => sum + Math.abs((rank.get(team[0]) ?? 0) + (rank.get(team[1]) ?? 0) - (selected.length - 1)), 0)
          const score = [Math.max(state.score[0], imbalance), state.score[1] + previousRepeat, state.score[2] + partnerRepeats, state.score[3] + imbalance, state.score[4] + rivalRepeats, state.score[5] + inverse]
          const used = new Set([anchor, ...trio])
          next.push({ remaining: state.remaining.filter((id) => !used.has(id)), matches: [...state.matches, { court: state.matches.length + 1, teamAIds: teamA, teamBIds: teamB, imbalance }], score, tie: (state.tie + seededHash(seed + round, `${teamA.join("-")}:${teamB.join("-")}`)) >>> 0 })
        }
      }
    }
    next.sort((left, right) => compareNumbers(left.score, right.score) || left.tie - right.tie)
    beam = next.slice(0, width)
  }
  const minimumMaximum = Math.min(...beam.map((state) => state.score[0]))
  const finalists = beam.filter((state) => state.score[0] <= minimumMaximum + 3)
  finalists.sort((left, right) => compareNumbers(left.score.slice(1), right.score.slice(1)) || left.score[0] - right.score[0] || left.tie - right.tie)
  return finalists[0]?.matches ?? []
}

export function generateDynamicMexicanoRound(input: { players: readonly MexicanoPlayer[]; history: readonly MexicanoMatch[]; courts: number; round: number; seed: number }) {
  const activeCourts = Math.min(input.courts, Math.floor(input.players.length / 4)), required = activeCourts * 4
  if (!Number.isInteger(input.round) || input.round < 1 || activeCourts < 1 || new Set(input.players.map((player) => player.id)).size !== input.players.length) throw new Error("invalid_mexicano_configuration")
  const standing = calculateMexicanoStandings(input.players, input.history, input.round - 1)
  const selected = selectRoundPlayers(input.players, input.history, required, input.round, input.seed)
  const matches = buildPairings(selected, standing, input.history, input.round, input.seed)
  const playing = new Set(matches.flatMap((match) => [...match.teamAIds, ...match.teamBIds]))
  return { round: input.round, matches, restingIds: input.players.filter((player) => !playing.has(player.id)).map((player) => player.id) } satisfies MexicanoRound
}
