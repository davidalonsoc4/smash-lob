export type PersonalMatchSet = {
  a: number
  b: number
}

export type PersonalMatchTeam = 1 | 2
export type PersonalMatchSlot = 1 | 2
export type PersonalMatchOrigin = "friendly" | "league"
export type PersonalMatchStatus = "scheduled" | "finished"
export type PersonalMatchNextScope = "league" | "friendly"

export type PersonalMatchParticipant = {
  team: PersonalMatchTeam
  slot: PersonalMatchSlot
  displayName: string
  isCurrentUser: boolean
}

export type PersonalMatchItem = {
  id: string
  origin: PersonalMatchOrigin
  status: PersonalMatchStatus
  scheduledAt: string | null
  resultRecordedAt: string | null
  locationName: string | null
  sets: PersonalMatchSet[]
  participants: PersonalMatchParticipant[]
  canManage: boolean
  canDelete: boolean
  leagueId: string | null
  leagueName: string | null
  seasonId: string | null
  round: number | null
}

export type PersonalMatchesDashboardPayload = {
  items: PersonalMatchItem[]
  hasMore: boolean
  nextOffset: number | null
  upcoming: {
    league: PersonalMatchItem | null
    friendly: PersonalMatchItem | null
  }
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

const leagueBadgeStyles = [
  "border-blue-200 bg-blue-50 text-blue-800",
  "border-violet-200 bg-violet-50 text-violet-800",
  "border-amber-200 bg-amber-50 text-amber-800",
  "border-cyan-200 bg-cyan-50 text-cyan-800",
  "border-indigo-200 bg-indigo-50 text-indigo-800",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
  "border-orange-200 bg-orange-50 text-orange-800",
  "border-sky-200 bg-sky-50 text-sky-800",
  "border-purple-200 bg-purple-50 text-purple-800",
] as const

const friendlyBadgeStyle = "border-slate-200 bg-slate-100 text-slate-700"

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
  match: Pick<PersonalMatchItem, "participants" | "sets" | "status">,
) {
  if (match.status !== "finished") return "unknown" as const

  const team = getPersonalMatchTeam(match)
  const wins = getPersonalMatchSetWins(match.sets)
  const winner: PersonalMatchTeam | null =
    wins.a === wins.b ? null : wins.a > wins.b ? 1 : 2

  if (!team || !winner) return "unknown" as const
  return team === winner ? ("win" as const) : ("loss" as const)
}

export function getPersonalMatchOverallScore(sets: PersonalMatchSet[]) {
  const wins = getPersonalMatchSetWins(sets)
  return `${wins.a}-${wins.b}`
}

export function getPersonalMatchEventAt(
  match: Pick<PersonalMatchItem, "scheduledAt" | "resultRecordedAt">,
) {
  return match.scheduledAt ?? match.resultRecordedAt
}

export function formatPersonalMatchDate(value: string | null) {
  if (!value) return "Fecha pendiente"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Fecha desconocida"

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatPersonalMatchTime(value: string | null) {
  if (!value) return "Hora pendiente"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Hora pendiente"

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatPersonalMatchDateTime(value: string | null) {
  if (!value) return "Fecha pendiente"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Fecha desconocida"

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatPersonalMatchScore(sets: PersonalMatchSet[]) {
  return sets.map((set) => `${set.a}-${set.b}`).join(" · ")
}

export function getPersonalMatchTeamPlayers(
  participants: PersonalMatchParticipant[],
  team: PersonalMatchTeam,
) {
  return sortPersonalMatchParticipants(
    participants.filter((participant) => participant.team === team),
  )
}

export function getPersonalMatchTeamNames(
  participants: PersonalMatchParticipant[],
  team: PersonalMatchTeam,
) {
  return getPersonalMatchTeamPlayers(participants, team)
    .map((participant) => participant.displayName)
    .join(" / ")
}

export function getPersonalMatchOriginLabel(
  match: Pick<PersonalMatchItem, "origin" | "leagueName">,
) {
  return match.origin === "league" ? match.leagueName || "Liga" : "Amistoso"
}

function stableStringHash(value: string) {
  let hash = 0
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return hash
}

export function getPersonalMatchOriginBadgeClass(
  match: Pick<PersonalMatchItem, "origin" | "leagueId" | "leagueName">,
) {
  if (match.origin === "friendly") {
    return friendlyBadgeStyle
  }

  const key = match.leagueId ?? match.leagueName ?? "league"
  return leagueBadgeStyles[stableStringHash(key) % leagueBadgeStyles.length]
}
