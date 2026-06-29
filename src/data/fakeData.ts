export type LeagueMemberRole = "creator" | "admin" | "player"

export type League = {
  id: string
  slug: string
  name: string
  description: string
  activeSeasonId: string
  inviteCode: string
  joinMode: "closed" | "open"
  locations: string[]
}

export type Season = {
  id: string
  leagueId: string
  name: string
  status: "active" | "finished"
  totalRounds: number
  completedRounds: number
}

export type PlayerProfile = {
  id: string
  leagueId: string
  slug: string
  displayName: string
  avatarInitials: string
}

export type LeagueMember = {
  leagueId: string
  playerId: string
  role: LeagueMemberRole
}

export type UserLeagueMembership = {
  userId: string
  leagueId: string
  playerId: string
  role: LeagueMemberRole
}

export type SeasonPlayer = {
  seasonId: string
  playerId: string
}

export type MatchStatus = "finished" | "scheduling" | "scheduled" | "postponed"

export type Match = {
  id: string
  leagueId: string
  seasonId: string
  round: number
  status: MatchStatus
  teamA: string[]
  teamB: string[]
  pointsA: number | null
  pointsB: number | null
  sets: { a: number; b: number }[]
  scheduledAt: string | null
  dateLabel: string | null
  location: string | null
  resultRecordedAt?: string | null
}

export type SeasonRoundSettings = {
  leagueId: string
  seasonId: string
  roundWindowMode: "none" | "fixed-days"
  seasonStartsAt: string | null
  roundWindowDays: number | null
  requiresThreeSets: boolean
}

export const currentUserId = "davo"

export const activeLeagueId = "league-smash-lob"

export const leagues: League[] = [
  {
    id: "league-smash-lob",
    slug: "smash-lob",
    name: "Smash & Lob",
    description: "Liga privada de padel entre amigos.",
    activeSeasonId: "season-2",
    inviteCode: "SL-8KQ4-P7M2-X9RA",
    joinMode: "closed",
    locations: ["Padel Indoor", "Club Padel Norte", "Padel Derio"],
  },
  {
    id: "league-work",
    slug: "liga-curro",
    name: "Liga del curro",
    description: "Liga privada de padel del trabajo.",
    activeSeasonId: "season-work-1",
    inviteCode: "WK-3T9Z-L6Q8-V2BN",
    joinMode: "closed",
    locations: ["Club Padel Work", "Padel Indoor", "Club Padel Norte"],
  },
]

export const seasons: Season[] = [
  {
    id: "season-1",
    leagueId: "league-smash-lob",
    name: "Temporada 1",
    status: "finished",
    totalRounds: 7,
    completedRounds: 7,
  },
  {
    id: "season-2",
    leagueId: "league-smash-lob",
    name: "Temporada 2",
    status: "active",
    totalRounds: 7,
    completedRounds: 3,
  },
  {
    id: "season-work-1",
    leagueId: "league-work",
    name: "Temporada 1",
    status: "active",
    totalRounds: 5,
    completedRounds: 1,
  },
]

export const playerProfiles: PlayerProfile[] = [
  {
    id: "davo",
    leagueId: "league-smash-lob",
    slug: "davo",
    displayName: "Davo",
    avatarInitials: "DA",
  },
  {
    id: "alvaro",
    leagueId: "league-smash-lob",
    slug: "alvaro",
    displayName: "Alvaro",
    avatarInitials: "AL",
  },
  {
    id: "alain",
    leagueId: "league-smash-lob",
    slug: "alain",
    displayName: "Alain",
    avatarInitials: "AL",
  },
  {
    id: "julen",
    leagueId: "league-smash-lob",
    slug: "julen",
    displayName: "Julen",
    avatarInitials: "JU",
  },
  {
    id: "bea",
    leagueId: "league-smash-lob",
    slug: "bea",
    displayName: "Bea",
    avatarInitials: "BE",
  },
  {
    id: "carlos",
    leagueId: "league-smash-lob",
    slug: "carlos",
    displayName: "Carlos",
    avatarInitials: "CA",
  },
  {
    id: "irene",
    leagueId: "league-smash-lob",
    slug: "irene",
    displayName: "Irene",
    avatarInitials: "IR",
  },
  {
    id: "marcos",
    leagueId: "league-smash-lob",
    slug: "marcos",
    displayName: "Marcos",
    avatarInitials: "MA",
  },
  {
    id: "work-davo",
    leagueId: "league-work",
    slug: "davo-curro",
    displayName: "Davo",
    avatarInitials: "DA",
  },
  {
    id: "work-bea",
    leagueId: "league-work",
    slug: "bea-curro",
    displayName: "Bea",
    avatarInitials: "BE",
  },
  {
    id: "work-carlos",
    leagueId: "league-work",
    slug: "carlos-curro",
    displayName: "Carlos",
    avatarInitials: "CA",
  },
  {
    id: "work-irene",
    leagueId: "league-work",
    slug: "irene-curro",
    displayName: "Irene",
    avatarInitials: "IR",
  },
  {
    id: "work-marcos",
    leagueId: "league-work",
    slug: "marcos-curro",
    displayName: "Marcos",
    avatarInitials: "MA",
  },
]

export const defaultUserLeagueMemberships: UserLeagueMembership[] = [
  {
    userId: "davidalonsoc4@gmail.com",
    leagueId: "league-smash-lob",
    playerId: "davo",
    role: "admin",
  },
  {
    userId: "davidalonsoc4@gmail.com",
    leagueId: "league-work",
    playerId: "work-davo",
    role: "creator",
  },
]

export const leagueMembers: LeagueMember[] = [
  {
    leagueId: "league-smash-lob",
    playerId: "davo",
    role: "admin",
  },
  {
    leagueId: "league-smash-lob",
    playerId: "alvaro",
    role: "player",
  },
  {
    leagueId: "league-smash-lob",
    playerId: "alain",
    role: "player",
  },
  {
    leagueId: "league-smash-lob",
    playerId: "julen",
    role: "player",
  },
  {
    leagueId: "league-smash-lob",
    playerId: "bea",
    role: "player",
  },
  {
    leagueId: "league-smash-lob",
    playerId: "carlos",
    role: "player",
  },
  {
    leagueId: "league-smash-lob",
    playerId: "irene",
    role: "player",
  },
  {
    leagueId: "league-smash-lob",
    playerId: "marcos",
    role: "player",
  },
  {
    leagueId: "league-work",
    playerId: "work-davo",
    role: "creator",
  },
  {
    leagueId: "league-work",
    playerId: "work-bea",
    role: "player",
  },
  {
    leagueId: "league-work",
    playerId: "work-carlos",
    role: "player",
  },
  {
    leagueId: "league-work",
    playerId: "work-irene",
    role: "player",
  },
  {
    leagueId: "league-work",
    playerId: "work-marcos",
    role: "player",
  },
]

export const seasonPlayers: SeasonPlayer[] = [
  {
    seasonId: "season-2",
    playerId: "davo",
  },
  {
    seasonId: "season-2",
    playerId: "alvaro",
  },
  {
    seasonId: "season-2",
    playerId: "alain",
  },
  {
    seasonId: "season-2",
    playerId: "julen",
  },
  {
    seasonId: "season-2",
    playerId: "bea",
  },
  {
    seasonId: "season-2",
    playerId: "carlos",
  },
  {
    seasonId: "season-2",
    playerId: "irene",
  },
  {
    seasonId: "season-2",
    playerId: "marcos",
  },
  {
    seasonId: "season-work-1",
    playerId: "work-davo",
  },
  {
    seasonId: "season-work-1",
    playerId: "work-bea",
  },
  {
    seasonId: "season-work-1",
    playerId: "work-carlos",
  },
  {
    seasonId: "season-work-1",
    playerId: "work-irene",
  },
  {
    seasonId: "season-work-1",
    playerId: "work-marcos",
  },
]

export const seasonRoundSettings: SeasonRoundSettings[] = [
  {
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    roundWindowMode: "fixed-days",
    seasonStartsAt: "2026-06-14",
    roundWindowDays: 15,
    requiresThreeSets: true,
  },
  {
    leagueId: "league-work",
    seasonId: "season-work-1",
    roundWindowMode: "fixed-days",
    seasonStartsAt: "2026-06-18",
    roundWindowDays: 15,
    requiresThreeSets: true,
  },
]

export const allMatches: Match[] = [
  {
    id: "season-2-round-1-match-1",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 1,
    status: "finished",
    teamA: ["davo", "alvaro"],
    teamB: ["alain", "julen"],
    pointsA: 2,
    pointsB: 1,
    sets: [
      { a: 6, b: 4 },
      { a: 3, b: 6 },
      { a: 6, b: 2 },
    ],
    scheduledAt: "2026-06-28T22:00",
    dateLabel: "Domingo, 22:00",
    location: "Padel Indoor",
  },
  {
    id: "season-2-round-1-match-2",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 1,
    status: "finished",
    teamA: ["bea", "carlos"],
    teamB: ["irene", "marcos"],
    pointsA: 2,
    pointsB: 1,
    sets: [
      { a: 6, b: 3 },
      { a: 5, b: 7 },
      { a: 6, b: 4 },
    ],
    scheduledAt: "2026-06-29T19:30",
    dateLabel: "Lunes, 19:30",
    location: "Club Padel Norte",
  },
  {
    id: "season-2-round-2-match-1",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 2,
    status: "finished",
    teamA: ["davo", "alain"],
    teamB: ["alvaro", "julen"],
    pointsA: 0,
    pointsB: 3,
    sets: [
      { a: 3, b: 6 },
      { a: 4, b: 6 },
      { a: 2, b: 6 },
    ],
    scheduledAt: "2026-07-05T20:00",
    dateLabel: "Domingo, 20:00",
    location: "Club Padel Norte",
  },
  {
    id: "season-2-round-2-match-2",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 2,
    status: "finished",
    teamA: ["bea", "irene"],
    teamB: ["carlos", "marcos"],
    pointsA: 2,
    pointsB: 1,
    sets: [
      { a: 6, b: 4 },
      { a: 4, b: 6 },
      { a: 7, b: 5 },
    ],
    scheduledAt: "2026-07-06T19:30",
    dateLabel: "Lunes, 19:30",
    location: "Padel Derio",
  },
  {
    id: "season-2-round-3-match-1",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 3,
    status: "finished",
    teamA: ["davo", "julen"],
    teamB: ["bea", "marcos"],
    pointsA: 3,
    pointsB: 0,
    sets: [
      { a: 6, b: 3 },
      { a: 6, b: 2 },
      { a: 6, b: 4 },
    ],
    scheduledAt: "2026-07-16T20:00",
    dateLabel: "Viernes, 20:00",
    location: "Club Padel Norte",
  },
  {
    id: "season-2-round-3-match-2",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 3,
    status: "finished",
    teamA: ["alvaro", "irene"],
    teamB: ["alain", "carlos"],
    pointsA: 2,
    pointsB: 1,
    sets: [
      { a: 6, b: 3 },
      { a: 3, b: 6 },
      { a: 6, b: 4 },
    ],
    scheduledAt: "2026-07-17T19:30",
    dateLabel: "Sabado, 19:30",
    location: "Padel Indoor",
  },
  {
    id: "season-2-round-4-match-1",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 4,
    status: "scheduling",
    teamA: ["davo", "alvaro"],
    teamB: ["alain", "julen"],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: null,
    dateLabel: null,
    location: null,
  },
  {
    id: "season-2-round-4-match-2",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 4,
    status: "scheduling",
    teamA: ["bea", "irene"],
    teamB: ["carlos", "marcos"],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: null,
    dateLabel: null,
    location: null,
  },
  {
    id: "season-2-round-5-match-1",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 5,
    status: "scheduled",
    teamA: ["davo", "bea"],
    teamB: ["alvaro", "carlos"],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: "2026-08-14T20:00",
    dateLabel: "Viernes, 20:00",
    location: "Padel Derio",
  },
  {
    id: "season-2-round-5-match-2",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 5,
    status: "scheduled",
    teamA: ["alain", "irene"],
    teamB: ["julen", "marcos"],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: "2026-08-15T19:30",
    dateLabel: "Sabado, 19:30",
    location: "Club Padel Norte",
  },
  {
    id: "season-2-round-6-match-1",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 6,
    status: "scheduled",
    teamA: ["davo", "carlos"],
    teamB: ["julen", "irene"],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: "2026-08-29T18:30",
    dateLabel: "Sabado, 18:30",
    location: "Padel Indoor",
  },
  {
    id: "season-2-round-6-match-2",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 6,
    status: "postponed",
    teamA: ["alvaro", "bea"],
    teamB: ["alain", "marcos"],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: null,
    dateLabel: null,
    location: null,
  },
  {
    id: "season-2-round-7-match-1",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 7,
    status: "scheduling",
    teamA: ["davo", "irene"],
    teamB: ["alvaro", "marcos"],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: null,
    dateLabel: null,
    location: null,
  },
  {
    id: "season-2-round-7-match-2",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 7,
    status: "scheduling",
    teamA: ["alain", "bea"],
    teamB: ["julen", "carlos"],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: null,
    dateLabel: null,
    location: null,
  },
  {
    id: "work-match-001",
    leagueId: "league-work",
    seasonId: "season-work-1",
    round: 1,
    status: "finished",
    teamA: ["work-davo", "work-bea"],
    teamB: ["work-carlos", "work-irene"],
    pointsA: 2,
    pointsB: 1,
    sets: [
      { a: 6, b: 3 },
      { a: 4, b: 6 },
      { a: 6, b: 4 },
    ],
    scheduledAt: "2026-06-24T19:00",
    dateLabel: "Miercoles, 19:00",
    location: "Club Padel Work",
  },
]
