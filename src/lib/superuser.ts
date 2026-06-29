function parseEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function parsePlayerIds(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((playerId) => playerId.trim())
    .filter(Boolean)
}

const appOwnerSuperuserEmails = ["smashlobadmin@gmail.com"]

const superuserEmails = Array.from(
  new Set([
    ...appOwnerSuperuserEmails,
    ...parseEmails(process.env.NEXT_PUBLIC_SUPERUSER_EMAILS),
  ])
)
const superuserPlayerIds = parsePlayerIds(
  process.env.NEXT_PUBLIC_SUPERUSER_PLAYER_IDS
)

export function isSuperuserEmail(email: string | null | undefined) {
  return Boolean(
    email && superuserEmails.includes(email.trim().toLowerCase())
  )
}

export function isSuperuserPlayerId(playerId: string | null | undefined) {
  return Boolean(playerId && superuserPlayerIds.includes(playerId))
}
