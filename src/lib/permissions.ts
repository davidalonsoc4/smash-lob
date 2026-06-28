import { currentUserId, leagueMembers } from "@/data/fakeData"

export type LeagueRole = "creator" | "admin" | "player"

const adminRoles: LeagueRole[] = ["creator", "admin"]

export function getCurrentUserLeagueRole(leagueId: string): LeagueRole | null {
  const membership = leagueMembers.find(
    (member) =>
      member.leagueId === leagueId && member.playerId === currentUserId
  )

  if (!membership) {
    return null
  }

  return membership.role as LeagueRole
}

export function isCurrentUserLeagueCreator(leagueId: string) {
  return getCurrentUserLeagueRole(leagueId) === "creator"
}

export function isCurrentUserLeagueAdmin(leagueId: string) {
  const role = getCurrentUserLeagueRole(leagueId)

  if (!role) {
    return false
  }

  return adminRoles.includes(role)
}