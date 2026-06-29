const superuserEmails = ["davidalonsoc4@gmail.com"]
const superuserPlayerIds = ["davo"]

export function isSuperuserEmail(email: string | null | undefined) {
  return Boolean(
    email &&
      superuserEmails.includes(email.trim().toLowerCase())
  )
}

export function isSuperuserPlayerId(playerId: string | null | undefined) {
  return Boolean(playerId && superuserPlayerIds.includes(playerId))
}
