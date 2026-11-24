export type PairingPlayer = { key: string; rate: number | null }
// Four players in slot order: [team1 slot1, team1 slot2, team2 slot1, team2 slot2].
const NEUTRAL = 50

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

const average = (a: PairingPlayer, b: PairingPlayer) => ((a.rate ?? NEUTRAL) + (b.rate ?? NEUTRAL)) / 2

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

// Next best split different from the current one; wraps around once every option was shown.
export function nextBalanced(players: readonly PairingPlayer[], shown: readonly string[]) {
  const splits = balancedSplits(players)
  const pending = splits.find((split) => !shown.includes(pairId(split.order))) ?? splits[0]
  return { order: pending.order, id: pairId(pending.order), exhausted: !splits.some((split) => !shown.includes(pairId(split.order)) && pairId(split.order) !== pairId(pending.order)) }
}
export { pairId }
