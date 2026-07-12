import type { MatchResultConfirmation } from "@/lib/supabaseMatchConfirmations"

export type ResultConfirmationMode = "required" | "optional" | "none"

export const resultConfirmationAutoValidationHours = 24
export const resultConfirmationReminderHours = [2, 3, 4] as const

export type ResultConfirmationState =
  | "disabled"
  | "pending"
  | "validated"
  | "auto_validated"
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
  resultRecordedAt,
  confirmations,
  mode,
  now = new Date(),
}: {
  matchId: string
  participantIds: string[]
  resultRecordedAt: string | null
  confirmations: MatchResultConfirmation[]
  mode: ResultConfirmationMode
  now?: Date
}) {
  const uniqueParticipantIds = Array.from(new Set(participantIds))
  const participantIdSet = new Set(uniqueParticipantIds)
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
  const confirmedCount = uniqueParticipantIds.filter((playerId) =>
    confirmedPlayerIds.has(playerId),
  ).length
  const allConfirmed =
    uniqueParticipantIds.length > 0 &&
    confirmedCount === uniqueParticipantIds.length
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

  if (mode === "none") {
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
    requiredCount: uniqueParticipantIds.length,
    allConfirmed,
    disputed,
    autoValidated,
    autoValidationAt,
    countsForRanking:
      mode !== "required" || allConfirmed || autoValidated,
  }
}
