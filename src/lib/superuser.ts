function parsePlayerIds(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((playerId) => playerId.trim())
    .filter(Boolean)
}

const superuserPlayerIds = parsePlayerIds(
  process.env.NEXT_PUBLIC_SUPERUSER_PLAYER_IDS
)

export function isSuperuserPlayerId(playerId: string | null | undefined) {
  return Boolean(playerId && superuserPlayerIds.includes(playerId))
}
