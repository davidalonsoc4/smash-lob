export type MatchChatCoordinationStatus =
  | "unscheduled"
  | "coordinating"
  | "awaiting_booking"
  | "scheduled"

export type MatchChatCoordinationDateOption = {
  messageId: string
  optionKey: string
  startsAt: string
}

export type MatchChatCoordinationLocationOption = {
  messageId: string
  optionKey: string
  name: string
  locationId: string | null
}

export type MatchChatCoordination = {
  status: MatchChatCoordinationStatus
  participantCount: number
  linkedParticipantCount: number
  approvedDates: MatchChatCoordinationDateOption[]
  approvedLocations: MatchChatCoordinationLocationOption[]
  rejectedLocations: MatchChatCoordinationLocationOption[]
  hasProposals: boolean
}

type MessageLike = {
  id: string
  kind: string
  payload: unknown
  responses: Array<{ userId: string; optionKey: string; response: string }>
}

type ParticipantLike = { userId: string | null }

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function allLinkedParticipantsResponded({
  responses,
  optionKey,
  participantUserIds,
  response,
}: {
  responses: MessageLike["responses"]
  optionKey: string
  participantUserIds: string[]
  response: "available" | "unavailable"
}) {
  if (participantUserIds.length === 0) return false
  const voters = new Set(
    responses
      .filter(
        (item) => item.optionKey === optionKey && item.response === response,
      )
      .map((item) => item.userId),
  )
  return participantUserIds.every((userId) => voters.has(userId))
}

export function buildMatchChatCoordination({
  matchStatus,
  participants,
  messages,
}: {
  matchStatus: string
  participants: ParticipantLike[]
  messages: MessageLike[]
}): MatchChatCoordination {
  const participantUserIds = participants
    .map((item) => item.userId)
    .filter((userId): userId is string => Boolean(userId))
  const fullyLinked = participantUserIds.length === participants.length
  const structured = messages.filter(
    (message) =>
      message.kind === "date_proposal" || message.kind === "location_proposal",
  )
  const approvedDates: MatchChatCoordinationDateOption[] = []
  const approvedLocations: MatchChatCoordinationLocationOption[] = []
  const rejectedLocations: MatchChatCoordinationLocationOption[] = []
  const seenDates = new Set<string>()
  const seenApprovedLocations = new Set<string>()
  const seenRejectedLocations = new Set<string>()

  if (fullyLinked) {
    for (const message of structured) {
      const payload = toRecord(message.payload)
      if (message.kind === "date_proposal") {
        const options = Array.isArray(payload.options) ? payload.options : []
        for (const raw of options) {
          const option = toRecord(raw)
          const optionKey = clean(option.key)
          const startsAt = clean(option.startsAt)
          if (
            !optionKey ||
            !startsAt ||
            Number.isNaN(Date.parse(startsAt)) ||
            seenDates.has(startsAt) ||
            option.invalidated === true ||
            !allLinkedParticipantsResponded({
              responses: message.responses,
              optionKey,
              participantUserIds,
              response: "available",
            })
          ) {
            continue
          }
          seenDates.add(startsAt)
          approvedDates.push({ messageId: message.id, optionKey, startsAt })
        }
      } else if (message.kind === "location_proposal") {
        const optionKey = clean(payload.key)
        const name = clean(payload.name)
        const locationId = clean(payload.locationId) || null
        const identity = locationId ?? name.toLocaleLowerCase("es-ES")
        if (!optionKey || !name) continue

        if (
          !seenApprovedLocations.has(identity) &&
          allLinkedParticipantsResponded({
            responses: message.responses,
            optionKey,
            participantUserIds,
            response: "available",
          })
        ) {
          seenApprovedLocations.add(identity)
          approvedLocations.push({
            messageId: message.id,
            optionKey,
            name,
            locationId,
          })
        }

        if (
          !seenRejectedLocations.has(identity) &&
          allLinkedParticipantsResponded({
            responses: message.responses,
            optionKey,
            participantUserIds,
            response: "unavailable",
          })
        ) {
          seenRejectedLocations.add(identity)
          rejectedLocations.push({
            messageId: message.id,
            optionKey,
            name,
            locationId,
          })
        }
      }
    }
  }

  const status: MatchChatCoordinationStatus =
    matchStatus === "scheduled"
      ? "scheduled"
      : approvedDates.length > 0
        ? "awaiting_booking"
        : structured.length > 0
          ? "coordinating"
          : "unscheduled"

  return {
    status,
    participantCount: participants.length,
    linkedParticipantCount: participantUserIds.length,
    approvedDates,
    approvedLocations,
    rejectedLocations,
    hasProposals: structured.length > 0,
  }
}
