import type { MatchResultConfirmation } from "@/lib/supabaseMatchConfirmations"

export type ResultConfirmationMode = "required" | "optional" | "none"

export const resultConfirmationAutoValidationHours = 24
export const resultConfirmationReminderHours = [2, 3, 4] as const

export type ResultConfirmationState =
  | "disabled"
  | "pending"
  | "validated"
  | "auto_validated"
  | "locked"
  | "disputed"

export function normalizeResultConfirmationMode(
  value: unknown,
): ResultConfirmationMode {
  if (value === "required" || value === "none") {
    return value
  }

  return "optional"
}

export function getMatchResultConfirmationState({
  matchId,
  participantIds,
  reporterPlayerId,
  resultRecordedAt,
  resultLocked,
  confirmations,
  mode,
  now = new Date(),
}: {
  matchId: string
  participantIds: string[]
  reporterPlayerId?: string | null
  resultRecordedAt: string | null
  resultLocked?: boolean
  confirmations: MatchResultConfirmation[]
  mode: ResultConfirmationMode
  now?: Date
}) {
  const uniqueParticipantIds = Array.from(new Set(participantIds))
  const participantIdSet = new Set(uniqueParticipantIds)
  const requiredPlayerIds = uniqueParticipantIds.filter(
    (playerId) => playerId !== reporterPlayerId,
  )
  const matchConfirmations = confirmations.filter(
    (confirmation) =>
      confirmation.matchId === matchId &&
      participantIdSet.has(confirmation.playerId),
  )
  const disputed = matchConfirmations.some(
    (confirmation) => confirmation.status === "disputed",
  )
  const confirmedPlayerIds = new Set(
    matchConfirmations
      .filter((confirmation) => confirmation.status === "confirmed")
      .map((confirmation) => confirmation.playerId),
  )
  const confirmedCount = requiredPlayerIds.filter((playerId) =>
    confirmedPlayerIds.has(playerId),
  ).length
  const allConfirmed =
    requiredPlayerIds.length > 0 && confirmedCount === requiredPlayerIds.length
  const recordedAtTime = resultRecordedAt
    ? new Date(resultRecordedAt).getTime()
    : Number.NaN
  const autoValidationAt = Number.isFinite(recordedAtTime)
    ? recordedAtTime +
      resultConfirmationAutoValidationHours * 60 * 60 * 1000
    : null
  const autoValidated = Boolean(
    mode === "required" &&
      !disputed &&
      autoValidationAt !== null &&
      now.getTime() >= autoValidationAt,
  )

  let state: ResultConfirmationState

  if (resultLocked) {
    state = "locked"
  } else if (mode === "none") {
    state = "disabled"
  } else if (disputed) {
    state = "disputed"
  } else if (allConfirmed) {
    state = "validated"
  } else if (autoValidated) {
    state = "auto_validated"
  } else {
    state = "pending"
  }

  return {
    state,
    confirmedCount,
    requiredCount: requiredPlayerIds.length,
    requiredPlayerIds,
    allConfirmed,
    disputed,
    autoValidated,
    autoValidationAt,
    countsForRanking:
      Boolean(resultLocked) ||
      mode !== "required" ||
      allConfirmed ||
      autoValidated,
  }
}
