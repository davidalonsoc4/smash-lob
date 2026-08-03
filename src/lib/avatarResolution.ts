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
  linkedUserId,
  users,
}: {
  linkedUserId?: string | null
  users: UserAvatarLookup
}) {
  const linkedUser = linkedUserId ? users.byId.get(linkedUserId) : null

  return normalizeSafeAvatarUrl(linkedUser?.avatarUrl)
}
