const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function hasScheduledStartChanged(current: string | null, requested: string | null) {
  const currentTime = current ? Date.parse(current) : null
  const requestedTime = requested ? Date.parse(requested) : null
  return currentTime !== requestedTime
}

export function buildBallsAssignmentPriorityEntries({
  players,
  newPlayerNames,
  newPlayerLabels,
  appPlayers,
  selfPlayerName,
}: {
  players: Array<{ id: string; name: string }>
  newPlayerNames: string[]
  newPlayerLabels: string[]
  appPlayers: Array<{ userId: string; name: string }>
  selfPlayerName: string | null
}) {
  return [
    ...players.map(({ id, name }) => ({ ref: id, name })),
    ...newPlayerNames.map((name, index) => ({
      ref: `new:${index}`,
      name: name.trim() || newPlayerLabels[index] || `Jugador ${index + 1}`,
    })),
    ...appPlayers.map(({ userId, name }) => ({ ref: `app:${userId}`, name })),
    ...(selfPlayerName ? [{ ref: "self:creator", name: selfPlayerName }] : []),
  ]
}

export function isBallsAssignmentPriorityRef(value: unknown): value is string {
  if (typeof value !== "string") return false
  return (
    uuidPattern.test(value) ||
    /^new:(0|[1-9]\d*)$/.test(value) ||
    (value.startsWith("app:") && uuidPattern.test(value.slice(4))) ||
    value === "self:creator"
  )
}

export function resolveBallsAssignmentPriority({
  refs,
  finalPlayerIds,
  newPlayerIds,
  appUserIds,
  appPlayerIds,
  selfPlayerId,
}: {
  refs: string[]
  finalPlayerIds: string[]
  newPlayerIds: string[]
  appUserIds: string[]
  appPlayerIds: string[]
  selfPlayerId: string | null
}): string[] | null {
  const resolved: string[] = []

  for (const ref of refs) {
    let playerId: string | null = null

    if (finalPlayerIds.includes(ref)) {
      playerId = ref
    } else if (ref.startsWith("new:")) {
      const index = Number(ref.slice(4))
      playerId = Number.isSafeInteger(index) ? newPlayerIds[index] ?? null : null
    } else if (ref.startsWith("app:")) {
      const index = appUserIds.indexOf(ref.slice(4))
      playerId = index >= 0 ? appPlayerIds[index] ?? null : null
    } else if (ref === "self:creator") {
      playerId = selfPlayerId
    }

    if (!playerId || !finalPlayerIds.includes(playerId) || resolved.includes(playerId)) {
      return null
    }
    resolved.push(playerId)
  }

  return resolved
}
