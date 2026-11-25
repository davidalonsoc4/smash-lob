export type PairingPlayer = { key: string; elo: number | null }
// Four players in slot order: [team1 slot1, team1 slot2, team2 slot1, team2 slot2].
const NEUTRAL = 1000

function randomInt(limit: number) {
  const bytes = new Uint32Array(1)
  const max = Math.floor(0x100000000 / limit) * limit
  do crypto.getRandomValues(bytes)
  while (bytes[0] >= max)
  return bytes[0] % limit
}

export function shuffleList<T>(items: readonly T[]): T[] {
  const list = [...items]
  for (let index = list.length - 1; index > 0; index -= 1) {
    const other = randomInt(index + 1)
    ;[list[index], list[other]] = [list[other], list[index]]
  }
  return list
}

const average = (a: PairingPlayer, b: PairingPlayer) => ((a.elo ?? NEUTRAL) + (b.elo ?? NEUTRAL)) / 2

// The three ways to split four players into two pairs, best balanced first, with the gap between pairs.
export function balancedSplits(players: readonly PairingPlayer[]) {
  const [p0, p1, p2, p3] = players
  const splits: Array<{ order: PairingPlayer[]; gap: number }> = [
    [p0, p1, p2, p3], [p0, p2, p1, p3], [p0, p3, p1, p2],
  ].map((order) => ({ order, gap: Math.abs(average(order[0], order[1]) - average(order[2], order[3])) }))
  return splits.sort((left, right) => left.gap - right.gap)
}

export function pairingGap(players: readonly PairingPlayer[]) {
  return Math.abs(average(players[0], players[1]) - average(players[2], players[3]))
}

const pairId = (players: readonly PairingPlayer[]) => [[players[0].key, players[1].key].sort().join("+"), [players[2].key, players[3].key].sort().join("+")].sort().join("|")

// The single most balanced split. If the current pairs already are that split, they are kept as they are.
export function bestBalanced<T extends PairingPlayer>(players: readonly T[]): T[] {
  const [best] = balancedSplits(players)
  return (pairId(best.order) === pairId(players) ? [...players] : best.order) as T[]
}

// Random split into different pairs: never one that keeps the current pairs, so players always change pair.
export function shufflePairs<T extends PairingPlayer>(players: readonly T[]): T[] {
  const [p0, p1, p2, p3] = players
  const options = [[p0, p2, p1, p3], [p0, p3, p1, p2]]
  const [a, b, c, d] = options[randomInt(options.length)]
  const first = randomInt(2) === 0 ? [a, b] : [b, a]
  const second = randomInt(2) === 0 ? [c, d] : [d, c]
  return (randomInt(2) === 0 ? [...first, ...second] : [...second, ...first]) as T[]
}
export { pairId }
