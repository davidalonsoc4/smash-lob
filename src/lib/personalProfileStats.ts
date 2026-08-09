import {
  getPersonalMatchEventAt,
  getPersonalMatchOutcome,
  getPersonalMatchTeam,
  type PersonalMatchItem,
  type PersonalMatchParticipant,
} from "@/lib/personalMatches"

export type PersonalProfileOriginFilter = "all" | "friendly" | "league"

export type PersonalProfileFilters = {
  origin: PersonalProfileOriginFilter
  leagueId: string | null
  seasonId: string | null
}

export type PersonalProfileRelation = {
  key: string
  name: string
  avatarUrl: string | null
  matches: number
  wins: number
  losses: number
  winRate: number
  setsFor: number
  setsAgainst: number
  setsDiff: number
  gamesFor: number
  gamesAgainst: number
  gamesDiff: number
  averageGamesDiff: number
}

export type PersonalProfileMatchRecord = {
  id: string
  origin: PersonalMatchItem["origin"]
  leagueName: string | null
  seasonName: string | null
  round: number | null
  eventAt: string | null
  setsFor: number
  setsAgainst: number
  gamesFor: number
  gamesAgainst: number
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
  setWinRate: number
  gamesFor: number
  gamesAgainst: number
  gamesDiff: number
  gamesWinRate: number
  averageSetsFor: number
  averageSetsAgainst: number
  averageGamesFor: number
  averageGamesAgainst: number
  averageGamesDiff: number
  bestWinStreak: number
  currentWinStreak: number
  bestLossStreak: number
  currentLossStreak: number
  currentForm: Array<"win" | "loss">
  bestGameDiff: number | null
  toughestGameDiff: number | null
  bestMatch: PersonalProfileMatchRecord | null
  toughestMatch: PersonalProfileMatchRecord | null
  uniqueTeammates: number
  uniqueRivals: number
  teammateRelations: PersonalProfileRelation[]
  rivalRelations: PersonalProfileRelation[]
  mostFrequentTeammate: PersonalProfileRelation | null
  mostFrequentRival: PersonalProfileRelation | null
  bestTeammate: PersonalProfileRelation | null
  worstTeammate: PersonalProfileRelation | null
  mostBeatenRival: PersonalProfileRelation | null
  nemesis: PersonalProfileRelation | null
  bestRivalRecord: PersonalProfileRelation | null
  toughestRival: PersonalProfileRelation | null
  straightSetWins: number
  straightSetLosses: number
  decidingSetMatches: number
  decidingSetWins: number
  decidingSetLosses: number
  decidingSetWinRate: number
  comebackWins: number
  firstSetLeadLosses: number
  leagueMatches: number
  leagueWins: number
  leagueLosses: number
  leagueWinRate: number
  friendlyMatches: number
  friendlyWins: number
  friendlyLosses: number
  friendlyWinRate: number
}

export type PersonalProfileHeadToHead = {
  person: {
    key: string
    name: string
    avatarUrl: string | null
  }
  sharedMatches: number
  teammateMatches: number
  rivalMatches: number
  teammate: PersonalProfileRelation | null
  rivalry: PersonalProfileRelation | null
  recentRivalry: Array<"win" | "loss">
}

type MutableRelation = Omit<
  PersonalProfileRelation,
  "winRate" | "setsDiff" | "gamesDiff" | "averageGamesDiff"
>

type MatchPerformance = {
  ownTeam: 1 | 2
  won: boolean
  setsFor: number
  setsAgainst: number
  gamesFor: number
  gamesAgainst: number
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

function normalizeNameKey(value: string) {
  return value.trim().toLocaleLowerCase("es-ES").replace(/\s+/g, " ")
}

export function getPersonalProfileParticipantKey(
  participant: Pick<PersonalMatchParticipant, "personKey" | "displayName" | "isCurrentUser">,
) {
  if (participant.personKey?.trim()) return participant.personKey.trim()
  return participant.isCurrentUser
    ? "self"
    : `name:${normalizeNameKey(participant.displayName)}`
}

function getPerformance(match: PersonalMatchItem): MatchPerformance | null {
  const ownTeam = getPersonalMatchTeam(match)
  if (!ownTeam) return null

  let setsFor = 0
  let setsAgainst = 0
  let gamesFor = 0
  let gamesAgainst = 0

  for (const set of match.sets) {
    const own = ownTeam === 1 ? set.a : set.b
    const opponent = ownTeam === 1 ? set.b : set.a
    gamesFor += own
    gamesAgainst += opponent
    if (own > opponent) setsFor += 1
    if (opponent > own) setsAgainst += 1
  }

  return {
    ownTeam,
    won: getPersonalMatchOutcome(match) === "win",
    setsFor,
    setsAgainst,
    gamesFor,
    gamesAgainst,
  }
}

function upsertRelation(
  map: Map<string, MutableRelation>,
  participant: PersonalMatchParticipant,
  performance: MatchPerformance,
) {
  const key = getPersonalProfileParticipantKey(participant)
  const current = map.get(key) ?? {
    key,
    name: participant.displayName.trim() || "Jugador",
    avatarUrl: participant.avatarUrl ?? null,
    matches: 0,
    wins: 0,
    losses: 0,
    setsFor: 0,
    setsAgainst: 0,
    gamesFor: 0,
    gamesAgainst: 0,
  }

  current.name = participant.displayName.trim() || current.name
  if (participant.avatarUrl) current.avatarUrl = participant.avatarUrl
  current.matches += 1
  current.setsFor += performance.setsFor
  current.setsAgainst += performance.setsAgainst
  current.gamesFor += performance.gamesFor
  current.gamesAgainst += performance.gamesAgainst
  if (performance.won) current.wins += 1
  else current.losses += 1
  map.set(key, current)
}

function finishRelation(row: MutableRelation): PersonalProfileRelation {
  const gamesDiff = row.gamesFor - row.gamesAgainst
  return {
    ...row,
    winRate: row.matches > 0 ? (row.wins / row.matches) * 100 : 0,
    setsDiff: row.setsFor - row.setsAgainst,
    gamesDiff,
    averageGamesDiff: row.matches > 0 ? gamesDiff / row.matches : 0,
  }
}

function relationRows(map: Map<string, MutableRelation>) {
  return [...map.values()].map(finishRelation)
}

function sortMostFrequent(rows: PersonalProfileRelation[]) {
  return [...rows].sort((a, b) => {
    if (b.matches !== a.matches) return b.matches - a.matches
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
    return a.name.localeCompare(b.name, "es")
  })
}

function eligibleRelationRows(rows: PersonalProfileRelation[]) {
  const repeated = rows.filter((row) => row.matches >= 2)
  return repeated.length > 0 ? repeated : rows
}

function sortBest(rows: PersonalProfileRelation[]) {
  return [...eligibleRelationRows(rows)].sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
    if (b.matches !== a.matches) return b.matches - a.matches
    return a.name.localeCompare(b.name, "es")
  })
}

function sortWorst(rows: PersonalProfileRelation[]) {
  return [...eligibleRelationRows(rows)].sort((a, b) => {
    if (a.winRate !== b.winRate) return a.winRate - b.winRate
    if (b.losses !== a.losses) return b.losses - a.losses
    if (a.gamesDiff !== b.gamesDiff) return a.gamesDiff - b.gamesDiff
    if (b.matches !== a.matches) return b.matches - a.matches
    return a.name.localeCompare(b.name, "es")
  })
}

function mostBeaten(rows: PersonalProfileRelation[]) {
  return (
    [...rows]
      .filter((row) => row.wins > 0)
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        if (b.matches !== a.matches) return b.matches - a.matches
        if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff
        return a.name.localeCompare(b.name, "es")
      })[0] ?? null
  )
}

function nemesis(rows: PersonalProfileRelation[]) {
  return (
    [...rows]
      .filter((row) => row.losses > 0)
      .sort((a, b) => {
        if (b.losses !== a.losses) return b.losses - a.losses
        if (b.matches !== a.matches) return b.matches - a.matches
        if (a.gamesDiff !== b.gamesDiff) return a.gamesDiff - b.gamesDiff
        return a.name.localeCompare(b.name, "es")
      })[0] ?? null
  )
}

function toMatchRecord(
  match: PersonalMatchItem,
  performance: MatchPerformance,
): PersonalProfileMatchRecord {
  return {
    id: match.id,
    origin: match.origin,
    leagueName: match.leagueName,
    seasonName: match.seasonName,
    round: match.round,
    eventAt: getPersonalMatchEventAt(match),
    setsFor: performance.setsFor,
    setsAgainst: performance.setsAgainst,
    gamesFor: performance.gamesFor,
    gamesAgainst: performance.gamesAgainst,
    gamesDiff: performance.gamesFor - performance.gamesAgainst,
  }
}

function percentage(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0
}

export function getPersonalProfileStats(
  items: PersonalMatchItem[],
): PersonalProfileStats {
  const finished = items.filter(
    (match) => match.status === "finished" && match.sets.length > 0,
  )
  const teammateMap = new Map<string, MutableRelation>()
  const rivalMap = new Map<string, MutableRelation>()

  let wins = 0
  let losses = 0
  let setsFor = 0
  let setsAgainst = 0
  let gamesFor = 0
  let gamesAgainst = 0
  let bestMatch: PersonalProfileMatchRecord | null = null
  let toughestMatch: PersonalProfileMatchRecord | null = null
  let straightSetWins = 0
  let straightSetLosses = 0
  let decidingSetMatches = 0
  let decidingSetWins = 0
  let decidingSetLosses = 0
  let comebackWins = 0
  let firstSetLeadLosses = 0
  let leagueMatches = 0
  let leagueWins = 0
  let friendlyMatches = 0
  let friendlyWins = 0

  const chronology: Array<{ match: PersonalMatchItem; won: boolean }> = []

  for (const match of finished) {
    const performance = getPerformance(match)
    if (!performance) continue

    const record = toMatchRecord(match, performance)
    chronology.push({ match, won: performance.won })
    if (performance.won) wins += 1
    else losses += 1
    setsFor += performance.setsFor
    setsAgainst += performance.setsAgainst
    gamesFor += performance.gamesFor
    gamesAgainst += performance.gamesAgainst

    if (!bestMatch || record.gamesDiff > bestMatch.gamesDiff) bestMatch = record
    if (!toughestMatch || record.gamesDiff < toughestMatch.gamesDiff) toughestMatch = record

    if (match.origin === "league") {
      leagueMatches += 1
      if (performance.won) leagueWins += 1
    } else {
      friendlyMatches += 1
      if (performance.won) friendlyWins += 1
    }

    if (performance.setsFor === 2 && performance.setsAgainst === 0) straightSetWins += 1
    if (performance.setsFor === 0 && performance.setsAgainst === 2) straightSetLosses += 1
    if (match.sets.length >= 3) {
      decidingSetMatches += 1
      if (performance.won) decidingSetWins += 1
      else decidingSetLosses += 1
    }

    const firstSet = match.sets[0]
    if (firstSet) {
      const ownFirst = performance.ownTeam === 1 ? firstSet.a : firstSet.b
      const opponentFirst = performance.ownTeam === 1 ? firstSet.b : firstSet.a
      if (performance.won && ownFirst < opponentFirst) comebackWins += 1
      if (!performance.won && ownFirst > opponentFirst) firstSetLeadLosses += 1
    }

    for (const participant of match.participants) {
      if (participant.isCurrentUser) continue
      if (participant.team === performance.ownTeam) {
        upsertRelation(teammateMap, participant, performance)
      } else {
        upsertRelation(rivalMap, participant, performance)
      }
    }
  }

  chronology.sort((a, b) => {
    const aTime = Date.parse(getPersonalMatchEventAt(a.match) ?? "") || 0
    const bTime = Date.parse(getPersonalMatchEventAt(b.match) ?? "") || 0
    return aTime - bTime
  })

  let currentWinStreak = 0
  let bestWinStreak = 0
  let currentLossStreak = 0
  let bestLossStreak = 0
  for (const row of chronology) {
    if (row.won) {
      currentWinStreak += 1
      currentLossStreak = 0
      bestWinStreak = Math.max(bestWinStreak, currentWinStreak)
    } else {
      currentLossStreak += 1
      currentWinStreak = 0
      bestLossStreak = Math.max(bestLossStreak, currentLossStreak)
    }
  }

  const currentForm = chronology
    .slice(-5)
    .reverse()
    .map((row) => (row.won ? ("win" as const) : ("loss" as const)))
  const teammateRelations = sortMostFrequent(relationRows(teammateMap))
  const rivalRelations = sortMostFrequent(relationRows(rivalMap))
  const matchesPlayed = wins + losses
  const gamesTotal = gamesFor + gamesAgainst
  const setsTotal = setsFor + setsAgainst
  const leagueLosses = leagueMatches - leagueWins
  const friendlyLosses = friendlyMatches - friendlyWins

  return {
    matchesPlayed,
    wins,
    losses,
    winRate: percentage(wins, matchesPlayed),
    setsFor,
    setsAgainst,
    setsDiff: setsFor - setsAgainst,
    setWinRate: percentage(setsFor, setsTotal),
    gamesFor,
    gamesAgainst,
    gamesDiff: gamesFor - gamesAgainst,
    gamesWinRate: percentage(gamesFor, gamesTotal),
    averageSetsFor: matchesPlayed > 0 ? setsFor / matchesPlayed : 0,
    averageSetsAgainst: matchesPlayed > 0 ? setsAgainst / matchesPlayed : 0,
    averageGamesFor: matchesPlayed > 0 ? gamesFor / matchesPlayed : 0,
    averageGamesAgainst: matchesPlayed > 0 ? gamesAgainst / matchesPlayed : 0,
    averageGamesDiff: matchesPlayed > 0 ? (gamesFor - gamesAgainst) / matchesPlayed : 0,
    bestWinStreak,
    currentWinStreak,
    bestLossStreak,
    currentLossStreak,
    currentForm,
    bestGameDiff: bestMatch?.gamesDiff ?? null,
    toughestGameDiff: toughestMatch?.gamesDiff ?? null,
    bestMatch,
    toughestMatch,
    uniqueTeammates: teammateRelations.length,
    uniqueRivals: rivalRelations.length,
    teammateRelations,
    rivalRelations,
    mostFrequentTeammate: teammateRelations[0] ?? null,
    mostFrequentRival: rivalRelations[0] ?? null,
    bestTeammate: sortBest(teammateRelations)[0] ?? null,
    worstTeammate: sortWorst(teammateRelations)[0] ?? null,
    mostBeatenRival: mostBeaten(rivalRelations),
    nemesis: nemesis(rivalRelations),
    bestRivalRecord: sortBest(rivalRelations)[0] ?? null,
    toughestRival: sortWorst(rivalRelations)[0] ?? null,
    straightSetWins,
    straightSetLosses,
    decidingSetMatches,
    decidingSetWins,
    decidingSetLosses,
    decidingSetWinRate: percentage(decidingSetWins, decidingSetMatches),
    comebackWins,
    firstSetLeadLosses,
    leagueMatches,
    leagueWins,
    leagueLosses,
    leagueWinRate: percentage(leagueWins, leagueMatches),
    friendlyMatches,
    friendlyWins,
    friendlyLosses,
    friendlyWinRate: percentage(friendlyWins, friendlyMatches),
  }
}

export function getPersonalProfileHeadToHead(
  items: PersonalMatchItem[],
  personKey: string,
): PersonalProfileHeadToHead | null {
  if (!personKey) return null

  const teammateMap = new Map<string, MutableRelation>()
  const rivalMap = new Map<string, MutableRelation>()
  const recentRivalry: Array<{ at: number; outcome: "win" | "loss" }> = []

  for (const match of items) {
    if (match.status !== "finished" || match.sets.length === 0) continue
    const performance = getPerformance(match)
    if (!performance) continue

    const participant = match.participants.find(
      (candidate) =>
        !candidate.isCurrentUser &&
        getPersonalProfileParticipantKey(candidate) === personKey,
    )
    if (!participant) continue

    if (participant.team === performance.ownTeam) {
      upsertRelation(teammateMap, participant, performance)
    } else {
      upsertRelation(rivalMap, participant, performance)
      recentRivalry.push({
        at: Date.parse(getPersonalMatchEventAt(match) ?? "") || 0,
        outcome: performance.won ? "win" : "loss",
      })
    }
  }

  const teammate = relationRows(teammateMap)[0] ?? null
  const rivalry = relationRows(rivalMap)[0] ?? null
  const personRelation = teammate ?? rivalry
  if (!personRelation) return null
  const person: PersonalProfileHeadToHead["person"] = {
    key: personKey,
    name: rivalry?.name ?? teammate?.name ?? personRelation.name,
    avatarUrl: teammate?.avatarUrl ?? rivalry?.avatarUrl ?? null,
  }

  return {
    person,
    sharedMatches: (teammate?.matches ?? 0) + (rivalry?.matches ?? 0),
    teammateMatches: teammate?.matches ?? 0,
    rivalMatches: rivalry?.matches ?? 0,
    teammate,
    rivalry,
    recentRivalry: recentRivalry
      .sort((a, b) => b.at - a.at)
      .slice(0, 5)
      .map((row) => row.outcome),
  }
}
