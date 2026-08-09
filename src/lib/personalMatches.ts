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
  seasonName: string | null
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

const friendlyBadgeStyle = "border-slate-200 bg-slate-100 text-slate-700"

const safeLeagueHues = [
  30, 38, 46, 54,
  188, 196, 204, 212, 220, 228,
  236, 244, 252, 260, 268, 276,
  286, 296, 306, 316, 326,
] as const

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
  return match.origin === "friendly" ? friendlyBadgeStyle : "border"
}

export function getPersonalMatchOriginBadgeStyle(
  match: Pick<PersonalMatchItem, "origin" | "leagueId" | "leagueName">,
) {
  if (match.origin === "friendly") {
    return undefined
  }

  const key = match.leagueId ?? match.leagueName ?? "league"
  const primaryHash = stableStringHash(key)
  const secondaryHash = stableStringHash(`${key}|smash-lob-origin`)
  const hue = safeLeagueHues[primaryHash % safeLeagueHues.length]
  const saturation = 64 + (secondaryHash % 20)
  const backgroundLightness = 91 + ((secondaryHash >>> 6) % 5)
  const borderLightness = 64 + ((secondaryHash >>> 11) % 12)
  const textLightness = 24 + ((secondaryHash >>> 16) % 10)

  return {
    borderColor: `hsl(${hue}, ${saturation}%, ${borderLightness}%)`,
    backgroundColor: `hsl(${hue}, ${saturation}%, ${backgroundLightness}%)`,
    color: `hsl(${hue}, ${Math.max(50, saturation - 8)}%, ${textLightness}%)`,
  }
}
