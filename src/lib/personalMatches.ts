export type PersonalMatchSet = {
  a: number
  b: number
}

export type PersonalMatchTeam = 1 | 2
export type PersonalMatchSlot = 1 | 2

export type PersonalMatchParticipant = {
  team: PersonalMatchTeam
  slot: PersonalMatchSlot
  displayName: string
  isCurrentUser: boolean
}

export type PersonalMatchItem = {
  id: string
  playedAt: string
  locationName: string | null
  sets: PersonalMatchSet[]
  participants: PersonalMatchParticipant[]
  canDelete: boolean
}

export type PersonalMatchPerson = {
  key: string
  displayName: string
  avatarUrl: string | null
  sourceLeagueNames: string[]
  isSelf: boolean
}

export type PersonalMatchParticipantDraft = {
  team: PersonalMatchTeam
  slot: PersonalMatchSlot
  personKey: string | null
  displayName: string
}

export function sortPersonalMatchParticipants<T extends { team: number; slot: number }>(
  participants: T[],
) {
  return [...participants].sort(
    (left, right) => left.team - right.team || left.slot - right.slot,
  )
}

export function getPersonalMatchTeam(
  match: Pick<PersonalMatchItem, "participants">,
): PersonalMatchTeam | null {
  return (
    match.participants.find((participant) => participant.isCurrentUser)?.team ??
    null
  )
}

export function getPersonalMatchSetWins(sets: PersonalMatchSet[]) {
  return sets.reduce(
    (wins, set) => {
      if (set.a > set.b) wins.a += 1
      if (set.b > set.a) wins.b += 1
      return wins
    },
    { a: 0, b: 0 },
  )
}

export function getPersonalMatchOutcome(
  match: Pick<PersonalMatchItem, "participants" | "sets">,
) {
  const team = getPersonalMatchTeam(match)
  const wins = getPersonalMatchSetWins(match.sets)
  const winner: PersonalMatchTeam | null =
    wins.a === wins.b ? null : wins.a > wins.b ? 1 : 2

  if (!team || !winner) return "unknown" as const
  return team === winner ? ("win" as const) : ("loss" as const)
}

export function formatPersonalMatchDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Fecha desconocida"

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatPersonalMatchScore(sets: PersonalMatchSet[]) {
  return sets.map((set) => `${set.a}-${set.b}`).join(" · ")
}

export function getPersonalMatchTeamNames(
  participants: PersonalMatchParticipant[],
  team: PersonalMatchTeam,
) {
  return sortPersonalMatchParticipants(
    participants.filter((participant) => participant.team === team),
  )
    .map((participant) => participant.displayName)
    .join(" / ")
}
