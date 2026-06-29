import { playerProfiles, type PlayerProfile } from "@/data/fakeData"

export function getPlayerById(
  playerId: string,
  players: PlayerProfile[] = playerProfiles
) {
  return players.find((player) => player.id === playerId)
}

export function getPlayerDisplayName(
  playerId: string,
  players: PlayerProfile[] = playerProfiles
) {
  return getPlayerById(playerId, players)?.displayName ?? playerId
}

export function getTeamDisplayName(
  playerIds: string[],
  players: PlayerProfile[] = playerProfiles
) {
  return playerIds.map((playerId) => getPlayerDisplayName(playerId, players)).join(" / ")
}
