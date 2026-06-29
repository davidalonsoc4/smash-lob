import { currentUserId, leagueMembers } from "@/data/fakeData"

export type LeagueRole = "creator" | "admin" | "player"

const adminRoles: LeagueRole[] = ["creator", "admin"]

export function getCurrentUserLeagueRole(
  leagueId: string,
  userId = currentUserId
): LeagueRole | null {
  const membership = leagueMembers.find(
    (member) => member.leagueId === leagueId && member.playerId === userId
  )

  if (!membership) {
    return null
  }

  return membership.role as LeagueRole
}

export function isCurrentUserLeagueCreator(
  leagueId: string,
  userId = currentUserId
) {
  return getCurrentUserLeagueRole(leagueId, userId) === "creator"
}

export function isCurrentUserLeagueAdmin(
  leagueId: string,
  userId = currentUserId
) {
  const role = getCurrentUserLeagueRole(leagueId, userId)

  if (!role) {
    return false
  }

  return adminRoles.includes(role)
}
