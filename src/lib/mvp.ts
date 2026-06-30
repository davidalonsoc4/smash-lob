export type MvpScope = "round" | "season"
export type MvpSelectionSource = "automatic" | "manual" | "votes"

export type MvpVote = {
  leagueId: string
  seasonId: string
  round: number
  voterPlayerId: string
  selectedPlayerId: string
  createdAt: string
}

export type MvpManualSelection = {
  leagueId: string
  seasonId: string
  scope: MvpScope
  round: number | null
  selectedPlayerId: string
  updatedAt: string
}

export type MvpMatch = {
  id?: string
  leagueId: string
  seasonId: string
  round: number
  status: string
  teamA: string[]
  teamB: string[]
  pointsA: number | null
  pointsB: number | null
  sets: { a: number; b: number }[]
}

export type MvpPlayer = {
  id: string
  displayName: string
  avatarInitials?: string | null
  avatarUrl?: string | null
}

export type MvpResult = {
  leagueId: string
  seasonId: string
  scope: MvpScope
  round: number | null
  playerId: string
  playerIds: string[]
  source: MvpSelectionSource
  votes: number
  gamesFor?: number
  gamesAgainst?: number
  gamesDiff?: number
  setsFor?: number
  setsAgainst?: number
  tied?: boolean
}

export type MvpVoteRow = {
  playerId: string
  votes: number
}

export type PlayerMvpSummary = {
  roundMvpCount: number
  roundMvpRounds: number[]
  seasonMvpCount: number
  votesReceived: number
}

type MvpLookup = {
  leagueId: string
  seasonId: string
  round?: number | null
}

type RoundMvpCandidate = {
  playerIds: string[]
  gamesFor: number
  gamesAgainst: number
  gamesDiff: number
  setsFor: number
  setsAgainst: number
  matchId: string
}

function belongsToLeagueSeason(item: MvpLookup, leagueId: string, seasonId: string) {
  return item.leagueId === leagueId && item.seasonId === seasonId
}

function getTeamGames(match: MvpMatch, team: "A" | "B") {
  return match.sets.reduce((total, set) => total + (team === "A" ? set.a : set.b), 0)
}

function getTeamSetPoints(match: MvpMatch, team: "A" | "B") {
  if (team === "A" && match.pointsA !== null) {
    return match.pointsA
  }

  if (team === "B" && match.pointsB !== null) {
    return match.pointsB
  }

  return match.sets.filter((set) => (team === "A" ? set.a > set.b : set.b > set.a)).length
}

function getRoundMatches(matches: MvpMatch[], leagueId: string, seasonId: string, round: number) {
  return matches.filter(
    (match) =>
      match.leagueId === leagueId &&
      match.seasonId === seasonId &&
      match.round === round
  )
}

function isRoundComplete(matches: MvpMatch[], leagueId: string, seasonId: string, round: number) {
  const roundMatches = getRoundMatches(matches, leagueId, seasonId, round)

  return roundMatches.length > 0 && roundMatches.every((match) => match.status === "finished")
}

function getRoundWinnerCandidate(match: MvpMatch): RoundMvpCandidate | null {
  if (match.status !== "finished") {
    return null
  }

  const setsA = getTeamSetPoints(match, "A")
  const setsB = getTeamSetPoints(match, "B")

  if (setsA === setsB) {
    return null
  }

  const winningTeam = setsA > setsB ? "A" : "B"
  const gamesFor = getTeamGames(match, winningTeam)
  const gamesAgainst = getTeamGames(match, winningTeam === "A" ? "B" : "A")

  return {
    playerIds: winningTeam === "A" ? match.teamA : match.teamB,
    gamesFor,
    gamesAgainst,
    gamesDiff: gamesFor - gamesAgainst,
    setsFor: winningTeam === "A" ? setsA : setsB,
    setsAgainst: winningTeam === "A" ? setsB : setsA,
    matchId: match.id ?? `${match.round}-${match.teamA.join("-")}-${match.teamB.join("-")}`,
  }
}

function sortRoundMvpCandidates(firstCandidate: RoundMvpCandidate, secondCandidate: RoundMvpCandidate) {
  if (secondCandidate.gamesDiff !== firstCandidate.gamesDiff) {
    return secondCandidate.gamesDiff - firstCandidate.gamesDiff
  }

  if (secondCandidate.setsFor !== firstCandidate.setsFor) {
    return secondCandidate.setsFor - firstCandidate.setsFor
  }

  if (firstCandidate.setsAgainst !== secondCandidate.setsAgainst) {
    return firstCandidate.setsAgainst - secondCandidate.setsAgainst
  }

  if (secondCandidate.gamesFor !== firstCandidate.gamesFor) {
    return secondCandidate.gamesFor - firstCandidate.gamesFor
  }

  if (firstCandidate.gamesAgainst !== secondCandidate.gamesAgainst) {
    return firstCandidate.gamesAgainst - secondCandidate.gamesAgainst
  }

  return firstCandidate.playerIds.join("|").localeCompare(secondCandidate.playerIds.join("|"))
}

function sortVoteRows(firstRow: MvpVoteRow, secondRow: MvpVoteRow) {
  if (secondRow.votes !== firstRow.votes) {
    return secondRow.votes - firstRow.votes
  }

  return firstRow.playerId.localeCompare(secondRow.playerId)
}

export function getRoundPlayerIds(matches: MvpMatch[], round: number) {
  return Array.from(
    new Set(
      matches
        .filter((match) => match.round === round)
        .flatMap((match) => [...match.teamA, ...match.teamB])
    )
  )
}

export function getCompletedRoundNumbers(matches: MvpMatch[], leagueId: string, seasonId: string) {
  const roundNumbers = Array.from(
    new Set(
      matches
        .filter((match) => belongsToLeagueSeason(match, leagueId, seasonId))
        .map((match) => match.round)
    )
  )

  return roundNumbers
    .filter((round) => isRoundComplete(matches, leagueId, seasonId, round))
    .sort((firstRound, secondRound) => firstRound - secondRound)
}

export function getFinishedRoundNumbers(matches: MvpMatch[]) {
  return Array.from(
    new Set(
      matches
        .filter((match) => match.status === "finished")
        .map((match) => match.round)
    )
  ).sort((firstRound, secondRound) => firstRound - secondRound)
}

export function getLatestCompletedRound(matches: MvpMatch[], leagueId: string, seasonId: string) {
  return getCompletedRoundNumbers(matches, leagueId, seasonId).at(-1) ?? null
}

export function getLatestFinishedRound(matches: MvpMatch[]) {
  return getFinishedRoundNumbers(matches).at(-1) ?? null
}

export function getRoundMvpSelection({
  leagueId,
  seasonId,
  round,
  matches,
}: {
  votes?: MvpVote[]
  manualSelections?: MvpManualSelection[]
  leagueId: string
  seasonId: string
  round: number
  matches: MvpMatch[]
}): MvpResult | null {
  if (!isRoundComplete(matches, leagueId, seasonId, round)) {
    return null
  }

  const topCandidate = getRoundMatches(matches, leagueId, seasonId, round)
    .map(getRoundWinnerCandidate)
    .filter((candidate): candidate is RoundMvpCandidate => Boolean(candidate))
    .sort(sortRoundMvpCandidates)[0]

  if (!topCandidate) {
    return null
  }

  return {
    leagueId,
    seasonId,
    scope: "round",
    round,
    playerId: topCandidate.playerIds[0],
    playerIds: topCandidate.playerIds,
    source: "automatic",
    votes: 1,
    gamesFor: topCandidate.gamesFor,
    gamesAgainst: topCandidate.gamesAgainst,
    gamesDiff: topCandidate.gamesDiff,
    setsFor: topCandidate.setsFor,
    setsAgainst: topCandidate.setsAgainst,
  }
}

export function getSeasonMvpSelection({
  leagueId,
  seasonId,
  matches,
}: {
  votes?: MvpVote[]
  manualSelections?: MvpManualSelection[]
  leagueId: string
  seasonId: string
  matches: MvpMatch[]
}): MvpResult | null {
  const roundMvpCounts = new Map<string, number>()
  const completedRounds = getCompletedRoundNumbers(matches, leagueId, seasonId)

  completedRounds.forEach((round) => {
    const roundMvp = getRoundMvpSelection({
      leagueId,
      seasonId,
      round,
      matches,
    })

    roundMvp?.playerIds.forEach((playerId) => {
      roundMvpCounts.set(playerId, (roundMvpCounts.get(playerId) ?? 0) + 1)
    })
  })

  const rows = Array.from(roundMvpCounts.entries())
    .map(([playerId, voteCount]) => ({ playerId, votes: voteCount }))
    .sort(sortVoteRows)

  const topCount = rows[0]?.votes ?? 0

  if (topCount === 0) {
    return null
  }

  const topPlayerIds = rows
    .filter((row) => row.votes === topCount)
    .map((row) => row.playerId)
    .sort((firstPlayerId, secondPlayerId) => firstPlayerId.localeCompare(secondPlayerId))

  return {
    leagueId,
    seasonId,
    scope: "season",
    round: null,
    playerId: topPlayerIds[0],
    playerIds: topPlayerIds,
    source: "automatic",
    votes: topCount,
    tied: topPlayerIds.length > 1,
  }
}

export function getPlayerVotesReceived({
  votes,
  leagueId,
  seasonId,
  playerId,
}: {
  votes: MvpVote[]
  leagueId: string
  seasonId: string
  playerId: string
}) {
  return votes.filter(
    (vote) =>
      vote.leagueId === leagueId &&
      vote.seasonId === seasonId &&
      vote.selectedPlayerId === playerId
  ).length
}

export function getPlayerMvpSummary({
  leagueId,
  seasonId,
  matches,
  playerId,
}: {
  votes?: MvpVote[]
  manualSelections?: MvpManualSelection[]
  leagueId: string
  seasonId: string
  matches: MvpMatch[]
  playerId: string
}): PlayerMvpSummary {
  const roundMvpRounds = getCompletedRoundNumbers(matches, leagueId, seasonId).filter((round) => {
    const roundMvp = getRoundMvpSelection({
      leagueId,
      seasonId,
      round,
      matches,
    })

    return roundMvp?.playerIds.includes(playerId)
  })
  const seasonMvp = getSeasonMvpSelection({
    leagueId,
    seasonId,
    matches,
  })

  return {
    roundMvpCount: roundMvpRounds.length,
    roundMvpRounds,
    seasonMvpCount: seasonMvp?.playerIds.includes(playerId) ? 1 : 0,
    votesReceived: 0,
  }
}

export function getPlayerById(players: MvpPlayer[], playerId: string | null) {
  if (!playerId) {
    return null
  }

  return players.find((player) => player.id === playerId) ?? null
}

export function getPlayersByIds(players: MvpPlayer[], playerIds: string[]) {
  return playerIds
    .map((playerId) => getPlayerById(players, playerId))
    .filter((player): player is MvpPlayer => Boolean(player))
}

export function getRoundMvpPlayerIds({
  leagueId,
  seasonId,
  round,
  matches,
}: {
  leagueId: string
  seasonId: string
  round: number
  matches: MvpMatch[]
}) {
  return getRoundMvpSelection({ leagueId, seasonId, round, matches })?.playerIds ?? []
}

export function getSeasonVotes(votes: MvpVote[], leagueId: string, seasonId: string) {
  return votes.filter((vote) => belongsToLeagueSeason(vote, leagueId, seasonId))
}

export function getRoundVoteRows() {
  return [] as MvpVoteRow[]
}

export function getPlayerRoundVote() {
  return undefined
}
