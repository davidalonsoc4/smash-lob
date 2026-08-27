export const MIN_SEASON_PLAYER_COUNT = 8
export const MAX_SEASON_PLAYER_COUNT = 24

export function isSeasonPlayerCountInRange(playerCount: number) {
  return (
    Number.isInteger(playerCount) &&
    playerCount >= MIN_SEASON_PLAYER_COUNT &&
    playerCount <= MAX_SEASON_PLAYER_COUNT
  )
}

export function supportsPerfectlyBalancedSeason(playerCount: number) {
  return isSeasonPlayerCountInRange(playerCount) && playerCount % 4 === 0
}

export function seasonRequiresByes(playerCount: number) {
  return isSeasonPlayerCountInRange(playerCount) && playerCount % 4 !== 0
}

export function getSeasonByeCountPerRound(playerCount: number) {
  return isSeasonPlayerCountInRange(playerCount) ? playerCount % 4 : 0
}

export function getSeasonMatchesPerRound(playerCount: number) {
  return isSeasonPlayerCountInRange(playerCount) ? Math.floor(playerCount / 4) : 0
}

export function getSeasonBaseRoundCount(playerCount: number) {
  if (!isSeasonPlayerCountInRange(playerCount)) {
    return Math.max(playerCount - 1, 1)
  }

  return seasonRequiresByes(playerCount) ? playerCount : playerCount - 1
}

export function getDefaultSeasonPlayerCount(currentCount: number) {
  const normalizedCount = Number.isFinite(currentCount)
    ? Math.trunc(currentCount)
    : MIN_SEASON_PLAYER_COUNT

  return Math.min(
    Math.max(normalizedCount, MIN_SEASON_PLAYER_COUNT),
    MAX_SEASON_PLAYER_COUNT,
  )
}

export function getNextPerfectlyBalancedSeasonPlayerCount(currentCount: number) {
  const normalizedCount = Number.isFinite(currentCount)
    ? Math.max(Math.trunc(currentCount), MIN_SEASON_PLAYER_COUNT)
    : MIN_SEASON_PLAYER_COUNT
  const nextMultipleOfFour = Math.ceil(normalizedCount / 4) * 4

  return Math.min(
    Math.max(nextMultipleOfFour, MIN_SEASON_PLAYER_COUNT),
    MAX_SEASON_PLAYER_COUNT,
  )
}
