import { currentUserId, leagueMembers } from "@/data/fakeData"
import { isSuperuserPlayerId } from "@/lib/superuser"

export type LeagueRole = "creator" | "admin" | "player"

const adminRoles: LeagueRole[] = ["creator", "admin"]

export function getCurrentUserLeagueRole(
  leagueId: string,
  userId = currentUserId
): LeagueRole | null {
  if (isSuperuserPlayerId(userId)) {
    return "creator"
  }

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
  if (isSuperuserPlayerId(userId)) {
    return true
  }

  return getCurrentUserLeagueRole(leagueId, userId) === "creator"
}

export function isCurrentUserLeagueAdmin(
  leagueId: string,
  userId = currentUserId
) {
  if (isSuperuserPlayerId(userId)) {
    return true
  }

  const role = getCurrentUserLeagueRole(leagueId, userId)

  if (!role) {
    return false
  }

  return adminRoles.includes(role)
}
