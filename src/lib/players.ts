import { playerProfiles } from "@/data/fakeData"

export function getPlayerById(playerId: string) {
  return playerProfiles.find((player) => player.id === playerId)
}

export function getPlayerDisplayName(playerId: string) {
  return getPlayerById(playerId)?.displayName ?? playerId
}

export function getTeamDisplayName(playerIds: string[]) {
  return playerIds.map(getPlayerDisplayName).join(" / ")
}