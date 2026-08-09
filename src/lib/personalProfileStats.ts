import {
  getPersonalMatchEventAt,
  getPersonalMatchOutcome,
  getPersonalMatchTeam,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

export type PersonalProfileOriginFilter = "all" | "friendly" | "league"

export type PersonalProfileFilters = {
  origin: PersonalProfileOriginFilter
  leagueId: string | null
  seasonId: string | null
}

export type PersonalProfileRelation = {
  name: string
  matches: number
  wins: number
  losses: number
  gamesDiff: number
}

export type PersonalProfileStats = {
  matchesPlayed: number
  wins: number
  losses: number
  winRate: number
  setsFor: number
  setsAgainst: number
  setsDiff: number
  gamesFor: number
  gamesAgainst: number
  gamesDiff: number
  bestWinStreak: number
  currentWinStreak: number
  bestGameDiff: number | null
  toughestGameDiff: number | null
  mostFrequentTeammate: PersonalProfileRelation | null
  mostFrequentRival: PersonalProfileRelation | null
}

export function filterPersonalProfileMatches(
  items: PersonalMatchItem[],
  filters: PersonalProfileFilters,
) {
  return items.filter((match) => {
    if (match.status !== "finished" || match.sets.length === 0) return false
    if (filters.origin !== "all" && match.origin !== filters.origin) return false
    if (filters.leagueId && match.leagueId !== filters.leagueId) return false
    if (filters.seasonId && match.seasonId !== filters.seasonId) return false
    return true
  })
}

function updateRelation(
  map: Map<string, PersonalProfileRelation>,
  name: string,
  won: boolean,
  gamesDiff: number,
) {
  const key = name.trim().toLocaleLowerCase("es-ES")
  if (!key) return

  const current = map.get(key) ?? {
    name: name.trim(),
    matches: 0,
    wins: 0,
    losses: 0,
    gamesDiff: 0,
  }

  current.matches += 1
  current.gamesDiff += gamesDiff
  if (won) current.wins += 1
  else current.losses += 1
  map.set(key, current)
}

function mostFrequent(map: Map<string, PersonalProfileRelation>) {
  return (
    [...map.values()].sort((a, b) => {
      if (b.matches !== a.matches) return b.matches - a.matches
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
      return a.name.localeCompare(b.name, "es")
    })[0] ?? null
  )
}

export function getPersonalProfileStats(
  items: PersonalMatchItem[],
): PersonalProfileStats {
  const finished = items.filter(
    (match) => match.status === "finished" && match.sets.length > 0,
  )
  const teammateRelations = new Map<string, PersonalProfileRelation>()
  const rivalRelations = new Map<string, PersonalProfileRelation>()

  let wins = 0
  let losses = 0
  let setsFor = 0
  let setsAgainst = 0
  let gamesFor = 0
  let gamesAgainst = 0
  let bestGameDiff: number | null = null
  let toughestGameDiff: number | null = null

  for (const match of finished) {
    const ownTeam = getPersonalMatchTeam(match)
    if (!ownTeam) continue

    const won = getPersonalMatchOutcome(match) === "win"
    if (won) wins += 1
    else losses += 1

    let ownSets = 0
    let opponentSets = 0
    let ownGames = 0
    let opponentGames = 0

    for (const set of match.sets) {
      const own = ownTeam === 1 ? set.a : set.b
      const opponent = ownTeam === 1 ? set.b : set.a
      ownGames += own
      opponentGames += opponent
      if (own > opponent) ownSets += 1
      if (opponent > own) opponentSets += 1
    }

    setsFor += ownSets
    setsAgainst += opponentSets
    gamesFor += ownGames
    gamesAgainst += opponentGames

    const gamesDiff = ownGames - opponentGames
    bestGameDiff =
      bestGameDiff === null ? gamesDiff : Math.max(bestGameDiff, gamesDiff)
    toughestGameDiff =
      toughestGameDiff === null
        ? gamesDiff
        : Math.min(toughestGameDiff, gamesDiff)

    for (const participant of match.participants) {
      if (participant.isCurrentUser) continue
      if (participant.team === ownTeam) {
        updateRelation(teammateRelations, participant.displayName, won, gamesDiff)
      } else {
        updateRelation(rivalRelations, participant.displayName, won, gamesDiff)
      }
    }
  }

  let currentWinStreak = 0
  let bestWinStreak = 0
  ;[...finished]
    .sort((a, b) => {
      const aTime = Date.parse(getPersonalMatchEventAt(a) ?? "") || 0
      const bTime = Date.parse(getPersonalMatchEventAt(b) ?? "") || 0
      return aTime - bTime
    })
    .forEach((match) => {
      if (getPersonalMatchOutcome(match) === "win") {
        currentWinStreak += 1
        bestWinStreak = Math.max(bestWinStreak, currentWinStreak)
      } else {
        currentWinStreak = 0
      }
    })

  const matchesPlayed = wins + losses

  return {
    matchesPlayed,
    wins,
    losses,
    winRate: matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0,
    setsFor,
    setsAgainst,
    setsDiff: setsFor - setsAgainst,
    gamesFor,
    gamesAgainst,
    gamesDiff: gamesFor - gamesAgainst,
    bestWinStreak,
    currentWinStreak,
    bestGameDiff,
    toughestGameDiff,
    mostFrequentTeammate: mostFrequent(teammateRelations),
    mostFrequentRival: mostFrequent(rivalRelations),
  }
}
