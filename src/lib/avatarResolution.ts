import { isSafeImageUrl, normalizeImageUrl } from "@/lib/imageUrl"

export type AvatarSourceUser = {
  id: string
  email?: string | null
  displayName?: string | null
  avatarUrl?: string | null
}

type UserAvatarLookup = {
  byId: Map<string, AvatarSourceUser>
}

function normalizeSafeAvatarUrl(value: string | null | undefined) {
  return isSafeImageUrl(value) ? normalizeImageUrl(value) : null
}

export function buildUserAvatarLookup(users: AvatarSourceUser[]): UserAvatarLookup {
  return {
    byId: new Map(users.map((user) => [user.id, user])),
  }
}

export function resolvePlayerAvatarUrl({
  leagueAvatarUrl,
  linkedUserId,
  playerAvatarUrl,
  users,
}: {
  leagueAvatarUrl?: string | null
  linkedUserId?: string | null
  playerAvatarUrl?: string | null
  users: UserAvatarLookup
}) {
  const customLeagueAvatar = normalizeSafeAvatarUrl(leagueAvatarUrl)

  if (customLeagueAvatar) {
    return customLeagueAvatar
  }

  const linkedUser = linkedUserId ? users.byId.get(linkedUserId) : null
  const linkedAccountAvatar = normalizeSafeAvatarUrl(linkedUser?.avatarUrl)

  if (linkedAccountAvatar) {
    return linkedAccountAvatar
  }

  return normalizeSafeAvatarUrl(playerAvatarUrl)
}
