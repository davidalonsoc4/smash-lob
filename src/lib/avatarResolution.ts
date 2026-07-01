export type AvatarSourceUser = {
  id: string
  email?: string | null
  displayName?: string | null
  avatarUrl?: string | null
}

type UserAvatarLookup = {
  byId: Map<string, AvatarSourceUser>
  byDisplayName: Map<string, AvatarSourceUser>
}

export function normalizeAvatarDisplayName(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

function hasAvatarUrl(user: AvatarSourceUser) {
  return typeof user.avatarUrl === "string" && user.avatarUrl.trim().length > 0
}

export function buildUserAvatarLookup(users: AvatarSourceUser[]): UserAvatarLookup {
  const byId = new Map<string, AvatarSourceUser>()
  const byDisplayName = new Map<string, AvatarSourceUser>()

  users.forEach((user) => {
    byId.set(user.id, user)

    if (!hasAvatarUrl(user)) {
      return
    }

    const displayNameKey = normalizeAvatarDisplayName(user.displayName)

    if (displayNameKey && !byDisplayName.has(displayNameKey)) {
      byDisplayName.set(displayNameKey, user)
    }
  })

  return { byId, byDisplayName }
}

export function resolvePlayerAvatarUrl({
  linkedUserId,
  playerDisplayName,
  playerAvatarUrl,
  users,
}: {
  linkedUserId?: string | null
  playerDisplayName: string
  playerAvatarUrl?: string | null
  users: UserAvatarLookup
}) {
  const linkedUser = linkedUserId ? users.byId.get(linkedUserId) : null

  if (linkedUser?.avatarUrl) {
    return linkedUser.avatarUrl
  }

  if (playerAvatarUrl) {
    return playerAvatarUrl
  }

  const displayNameUser = users.byDisplayName.get(
    normalizeAvatarDisplayName(playerDisplayName)
  )

  return displayNameUser?.avatarUrl ?? null
}
