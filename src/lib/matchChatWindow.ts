export const MATCH_CHAT_POST_MATCH_WRITE_HOURS = 24
export const PERSONAL_MATCH_CHAT_RETENTION_MONTHS = 2

type MatchChatWindowInput = {
  status: string
  resultRecordedAt?: string | null
}

function parseResultRecordedAt(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getMatchChatWriteUntil({
  status,
  resultRecordedAt,
}: MatchChatWindowInput) {
  if (status !== "finished" && !resultRecordedAt) return null

  const resultDate = parseResultRecordedAt(resultRecordedAt)
  if (!resultDate) return null

  return new Date(
    resultDate.getTime() + MATCH_CHAT_POST_MATCH_WRITE_HOURS * 60 * 60 * 1000,
  )
}

export function isMatchChatReadOnly({
  status,
  resultRecordedAt,
  now = new Date(),
}: MatchChatWindowInput & { now?: Date }) {
  if (status !== "finished" && !resultRecordedAt) return false

  const writeUntil = getMatchChatWriteUntil({ status, resultRecordedAt })
  if (!writeUntil) return true

  return now.getTime() >= writeUntil.getTime()
}

export function getPersonalMatchChatDeleteAfter({
  status,
  resultRecordedAt,
}: MatchChatWindowInput) {
  if (status !== "finished" && !resultRecordedAt) return null

  const resultDate = parseResultRecordedAt(resultRecordedAt)
  if (!resultDate) return null

  const deleteAfter = new Date(resultDate)
  deleteAfter.setUTCMonth(
    deleteAfter.getUTCMonth() + PERSONAL_MATCH_CHAT_RETENTION_MONTHS,
  )
  return deleteAfter
}

export function isPersonalMatchChatExpired({
  status,
  resultRecordedAt,
  now = new Date(),
}: MatchChatWindowInput & { now?: Date }) {
  const deleteAfter = getPersonalMatchChatDeleteAfter({
    status,
    resultRecordedAt,
  })
  return Boolean(deleteAfter && now.getTime() >= deleteAfter.getTime())
}
