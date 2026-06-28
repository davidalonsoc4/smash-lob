export type LeagueMemberRole = "creator" | "admin" | "player"

export type League = {
  id: string
  slug: string
  name: string
  description: string
  activeSeasonId: string
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
  slug: string
  displayName: string
  avatarInitials: string
}

export type LeagueMember = {
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
}

export type SeasonRoundSettings = {
  leagueId: string
  seasonId: string
  roundWindowMode: "none" | "fixed-days"
  seasonStartsAt: string | null
  roundWindowDays: number | null
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
    locations: ["Pádel Indoor", "Club Pádel Norte", "Pádel Derio"],
  },
  {
    id: "league-work",
    slug: "liga-curro",
    name: "Liga del curro",
    description: "Liga privada de padel del trabajo.",
    activeSeasonId: "season-work-1",
    locations: ["Club Pádel Work", "Pádel Indoor", "Club Pádel Norte"],
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
    completedRounds: 2,
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
    slug: "davo",
    displayName: "Davo",
    avatarInitials: "DA",
  },
  {
    id: "alvaro",
    slug: "alvaro",
    displayName: "Álvaro",
    avatarInitials: "ÁL",
  },
  {
    id: "alain",
    slug: "alain",
    displayName: "Alain",
    avatarInitials: "AL",
  },
  {
    id: "julen",
    slug: "julen",
    displayName: "Julen",
    avatarInitials: "JU",
  },
  {
    id: "bea",
    slug: "bea",
    displayName: "Bea",
    avatarInitials: "BE",
  },
  {
    id: "carlos",
    slug: "carlos",
    displayName: "Carlos",
    avatarInitials: "CA",
  },
  {
    id: "irene",
    slug: "irene",
    displayName: "Irene",
    avatarInitials: "IR",
  },
  {
    id: "marcos",
    slug: "marcos",
    displayName: "Marcos",
    avatarInitials: "MA",
  },
]

export const leagueMembers: LeagueMember[] = [
  {
    leagueId: "league-smash-lob",
    playerId: "davo",
    role: "creator",
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
    leagueId: "league-work",
    playerId: "davo",
    role: "creator",
  },
  {
    leagueId: "league-work",
    playerId: "bea",
    role: "player",
  },
  {
    leagueId: "league-work",
    playerId: "carlos",
    role: "player",
  },
  {
    leagueId: "league-work",
    playerId: "irene",
    role: "player",
  },
  {
    leagueId: "league-work",
    playerId: "marcos",
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
    seasonId: "season-work-1",
    playerId: "davo",
  },
  {
    seasonId: "season-work-1",
    playerId: "bea",
  },
  {
    seasonId: "season-work-1",
    playerId: "carlos",
  },
  {
    seasonId: "season-work-1",
    playerId: "irene",
  },
  {
    seasonId: "season-work-1",
    playerId: "marcos",
  },
]

export const seasonRoundSettings: SeasonRoundSettings[] = [
  {
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    roundWindowMode: "fixed-days",
    seasonStartsAt: "2026-06-14",
    roundWindowDays: 15,
  },
  {
    leagueId: "league-work",
    seasonId: "season-work-1",
    roundWindowMode: "fixed-days",
    seasonStartsAt: "2026-06-18",
    roundWindowDays: 15,
  },
]

export const allMatches: Match[] = [
  {
    id: "match-001",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 1,
    status: "finished",
    teamA: ["davo", "alvaro"],
    teamB: ["alain", "julen"],
    pointsA: 2,
    pointsB: 1,
    sets: [
      {
        a: 6,
        b: 4,
      },
      {
        a: 3,
        b: 6,
      },
      {
        a: 6,
        b: 2,
      },
    ],
    scheduledAt: "2026-06-28T22:00",
    dateLabel: "Domingo, 22:00",
    location: "Pádel Indoor",
  },
  {
    id: "match-002",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 2,
    status: "scheduling",
    teamA: ["davo", "alain"],
    teamB: ["alvaro", "julen"],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: null,
    dateLabel: null,
    location: null,
  },
  {
    id: "match-003",
    leagueId: "league-smash-lob",
    seasonId: "season-2",
    round: 3,
    status: "scheduled",
    teamA: ["davo", "julen"],
    teamB: ["alvaro", "alain"],
    pointsA: null,
    pointsB: null,
    sets: [],
    scheduledAt: "2026-07-16T20:00",
    dateLabel: "Viernes, 20:00",
    location: "Club Pádel Norte",
  },
  {
    id: "work-match-001",
    leagueId: "league-work",
    seasonId: "season-work-1",
    round: 1,
    status: "finished",
    teamA: ["davo", "bea"],
    teamB: ["carlos", "irene"],
    pointsA: 2,
    pointsB: 1,
    sets: [
      {
        a: 6,
        b: 3,
      },
      {
        a: 4,
        b: 6,
      },
      {
        a: 6,
        b: 4,
      },
    ],
    scheduledAt: "2026-06-24T19:00",
    dateLabel: "Miércoles, 19:00",
    location: "Club Pádel Work",
  },
]
