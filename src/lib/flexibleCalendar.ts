export type FlexibleCalendarTeam = [number, number]

export type FlexibleCalendarGame = {
  teamA: FlexibleCalendarTeam
  teamB: FlexibleCalendarTeam
}

export type FlexibleCalendarRound = {
  round: number
  games: FlexibleCalendarGame[]
  byePlayerIndexes: number[]
}

type FlexibleCalendarStarter = {
  byes: number[]
  games: Array<[FlexibleCalendarTeam, FlexibleCalendarTeam]>
}

/**
 * Cyclic starters for season sizes that need byes.
 *
 * Every starter is translated once per round modulo playerCount. This keeps
 * the schedule deterministic while guaranteeing, within a single leg:
 * - exactly playerCount rounds,
 * - the same number of byes for every player,
 * - no consecutive byes,
 * - no repeated teammate pair,
 * - no repeated four-player group,
 * - at most three meetings against the same opponent pair (only 9 players
 *   needs three; every other supported size stays at two or fewer).
 */
const flexibleCalendarStarters: Record<number, FlexibleCalendarStarter> = {
  9: {
    byes: [0],
    games: [
      [[4, 8], [1, 3]],
      [[2, 5], [6, 7]],
    ],
  },
  10: {
    byes: [0, 3],
    games: [
      [[1, 9], [6, 7]],
      [[4, 8], [2, 5]],
    ],
  },
  11: {
    byes: [0, 3, 7],
    games: [
      [[5, 10], [6, 8]],
      [[1, 4], [2, 9]],
    ],
  },
  13: {
    byes: [0],
    games: [
      [[4, 11], [2, 3]],
      [[7, 12], [6, 9]],
      [[8, 10], [1, 5]],
    ],
  },
  14: {
    byes: [0, 2],
    games: [
      [[5, 8], [1, 13]],
      [[6, 12], [10, 11]],
      [[3, 7], [4, 9]],
    ],
  },
  15: {
    byes: [0, 5, 10],
    games: [
      [[4, 13], [2, 12]],
      [[8, 11], [3, 14]],
      [[1, 9], [6, 7]],
    ],
  },
  17: {
    byes: [0],
    games: [
      [[8, 16], [9, 14]],
      [[10, 12], [6, 7]],
      [[5, 11], [2, 15]],
      [[1, 4], [3, 13]],
    ],
  },
  18: {
    byes: [0, 9],
    games: [
      [[10, 17], [11, 15]],
      [[12, 13], [2, 8]],
      [[5, 7], [1, 4]],
      [[3, 16], [6, 14]],
    ],
  },
  19: {
    byes: [0, 6, 12],
    games: [
      [[9, 18], [11, 14]],
      [[7, 13], [15, 16]],
      [[10, 17], [1, 5]],
      [[3, 8], [2, 4]],
    ],
  },
  21: {
    byes: [0],
    games: [
      [[3, 9], [7, 18]],
      [[1, 2], [10, 15]],
      [[5, 8], [11, 19]],
      [[13, 17], [12, 14]],
      [[6, 20], [4, 16]],
    ],
  },
  22: {
    byes: [0, 2],
    games: [
      [[1, 17], [11, 21]],
      [[5, 10], [7, 14]],
      [[4, 6], [15, 18]],
      [[9, 13], [8, 16]],
      [[19, 20], [3, 12]],
    ],
  },
  23: {
    byes: [0, 2, 4],
    games: [
      [[15, 18], [1, 13]],
      [[3, 9], [17, 22]],
      [[7, 11], [10, 12]],
      [[8, 16], [6, 19]],
      [[20, 21], [5, 14]],
    ],
  },
  // New 25–31 starters are verified by the full calendar audit. The 29-player
  // seed is from https://www.durangobill.com/BridgeCyclicSolutions.html.
  25: {
    byes: [23],
    games: [
      [[20,18],[16,8]],
      [[12,24],[7,0]],
      [[9,13],[14,15]],
      [[6,21],[17,3]],
      [[4,1],[10,19]],
      [[5,11],[22,2]],
    ],
  },
  26: {
    byes: [12,5],
    games: [
      [[11,15],[19,17]],
      [[25,0],[13,22]],
      [[18,21],[6,1]],
      [[9,20],[2,10]],
      [[14,7],[16,4]],
      [[24,8],[3,23]],
    ],
  },
  27: {
    byes: [21,13,6],
    games: [
      [[4,12],[20,10]],
      [[8,26],[16,11]],
      [[1,15],[0,24]],
      [[2,14],[9,3]],
      [[18,7],[25,5]],
      [[19,17],[23,22]],
    ],
  },
  29: {
    byes: [0],
    games: [
      [[24,25],[7,11]],
      [[20,22],[1,15]],
      [[9,12],[8,18]],
      [[23,28],[2,14]],
      [[21,27],[26,4]],
      [[5,13],[3,16]],
      [[10,19],[6,17]],
    ],
  },
  30: {
    byes: [16,6],
    games: [
      [[19,1],[26,12]],
      [[20,21],[4,8]],
      [[29,10],[5,2]],
      [[9,11],[7,0]],
      [[17,25],[3,23]],
      [[22,28],[13,18]],
      [[24,15],[14,27]],
    ],
  },
  31: {
    byes: [18,11,9],
    games: [
      [[5,15],[20,25]],
      [[12,26],[8,17]],
      [[30,24],[22,23]],
      [[19,0],[28,13]],
      [[10,7],[3,27]],
      [[29,16],[6,14]],
      [[1,21],[2,4]],
    ],
  },
}

function translateIndex(index: number, roundIndex: number, playerCount: number) {
  return (index + roundIndex) % playerCount
}

export function generateFlexibleCalendarRounds(playerCount: number): FlexibleCalendarRound[] {
  const starter = flexibleCalendarStarters[playerCount]

  if (!starter) {
    return []
  }

  return Array.from({ length: playerCount }, (_, roundIndex) => ({
    round: roundIndex + 1,
    byePlayerIndexes: starter.byes.map((index) =>
      translateIndex(index, roundIndex, playerCount),
    ),
    games: starter.games.map(([teamA, teamB]) => ({
      teamA: teamA.map((index) =>
        translateIndex(index, roundIndex, playerCount),
      ) as FlexibleCalendarTeam,
      teamB: teamB.map((index) =>
        translateIndex(index, roundIndex, playerCount),
      ) as FlexibleCalendarTeam,
    })),
  }))
}
