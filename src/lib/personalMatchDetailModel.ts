import type { PlayerProfile } from "@/data/fakeData"
import {
  sortPersonalMatchParticipants,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

function initials(displayName: string) {
  return (
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "JG"
  )
}

export function buildPersonalMatchDetailModel(match: PersonalMatchItem) {
  const participants = sortPersonalMatchParticipants(match.participants)
  const players: PlayerProfile[] = participants.map((participant) => {
    const id =
      participant.bookingParticipantId ??
      `personal-${participant.team}-${participant.slot}`

    return {
      id,
      leagueId: "personal",
      slug: `personal-${participant.team}-${participant.slot}`,
      displayName: participant.displayName,
      avatarInitials: initials(participant.displayName),
      avatarUrl: participant.avatarUrl ?? null,
      userId: null,
      preferredSide: participant.preferredSide ?? null,
      dominantHand: participant.dominantHand ?? null,
    }
  })
  const teamA = participants
    .filter((participant) => participant.team === 1)
    .map(
      (participant) =>
        participant.bookingParticipantId ??
        `personal-${participant.team}-${participant.slot}`,
    )
  const teamB = participants
    .filter((participant) => participant.team === 2)
    .map(
      (participant) =>
        participant.bookingParticipantId ??
        `personal-${participant.team}-${participant.slot}`,
    )
  const currentUserId =
    participants.find((participant) => participant.isCurrentUser)
      ?.bookingParticipantId ?? ""
  const pointsA =
    match.status === "finished"
      ? match.sets.filter((set) => set.a > set.b).length
      : null
  const pointsB =
    match.status === "finished"
      ? match.sets.filter((set) => set.b > set.a).length
      : null

  return {
    participants,
    players,
    teamA,
    teamB,
    currentUserId,
    pointsA,
    pointsB,
  }
}
