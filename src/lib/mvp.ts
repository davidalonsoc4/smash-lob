export type MvpScope = "round" | "season"
export type MvpSelectionSource = "automatic" | "manual" | "votes"
export type SeasonMvpMode = "none" | "automatic" | "voting"

export type MvpVote = {
  leagueId: string
  seasonId: string
  round: number
  matchId?: string | null
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
  slug?: string
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
  matchId?: string
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

type MvpModeInput = {
  mvpMode?: SeasonMvpMode
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

function getVoteRows(votes: MvpVote[]) {
  const counts = new Map<string, number>()

  votes.forEach((vote) => {
    counts.set(vote.selectedPlayerId, (counts.get(vote.selectedPlayerId) ?? 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([playerId, voteCount]) => ({ playerId, votes: voteCount }))
    .sort(sortVoteRows)
}

function getTopVotePlayerIds(voteRows: MvpVoteRow[]) {
  const topCount = voteRows[0]?.votes ?? 0

  if (topCount === 0) {
    return []
  }

  return voteRows
    .filter((row) => row.votes === topCount)
    .map((row) => row.playerId)
    .sort((firstPlayerId, secondPlayerId) => firstPlayerId.localeCompare(secondPlayerId))
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
  votes = [],
  mvpMode = "automatic",
}: {
  votes?: MvpVote[]
  manualSelections?: MvpManualSelection[]
  leagueId: string
  seasonId: string
  round: number
  matches: MvpMatch[]
} & MvpModeInput): MvpResult | null {
  if (mvpMode === "none") {
    return null
  }

  if (!isRoundComplete(matches, leagueId, seasonId, round)) {
    return null
  }

  if (mvpMode === "voting") {
    const rows = getRoundVoteRows({ votes, leagueId, seasonId, round })
    const topPlayerIds = getTopVotePlayerIds(rows)

    if (topPlayerIds.length === 0) {
      return null
    }

    return {
      leagueId,
      seasonId,
      scope: "round",
      round,
      playerId: topPlayerIds[0],
      playerIds: topPlayerIds,
      source: "votes",
      votes: rows[0]?.votes ?? 0,
      tied: topPlayerIds.length > 1,
    }
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
    matchId: topCandidate.matchId,
  }
}

export function getSeasonMvpSelection({
  leagueId,
  seasonId,
  matches,
  votes = [],
  mvpMode = "automatic",
}: {
  votes?: MvpVote[]
  manualSelections?: MvpManualSelection[]
  leagueId: string
  seasonId: string
  matches: MvpMatch[]
} & MvpModeInput): MvpResult | null {
  if (mvpMode === "none") {
    return null
  }

  const roundMvpCounts = new Map<string, number>()
  const completedRounds = getCompletedRoundNumbers(matches, leagueId, seasonId)

  completedRounds.forEach((round) => {
    const roundMvp = getRoundMvpSelection({
      leagueId,
      seasonId,
      round,
      matches,
      votes,
      mvpMode,
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
  seasonIds,
  matches,
  playerId,
  votes = [],
  mvpMode = "automatic",
}: {
  votes?: MvpVote[]
  manualSelections?: MvpManualSelection[]
  leagueId: string
  seasonId?: string
  seasonIds?: string[]
  matches: MvpMatch[]
  playerId: string
} & MvpModeInput): PlayerMvpSummary {
  const scopedSeasonIds = seasonIds ?? (seasonId ? [seasonId] : [])

  const roundMvpRounds = scopedSeasonIds.flatMap((scopedSeasonId) =>
    getCompletedRoundNumbers(matches, leagueId, scopedSeasonId)
      .filter((round) => {
        const roundMvp = getRoundMvpSelection({
          leagueId,
          seasonId: scopedSeasonId,
          round,
          matches,
          votes,
          mvpMode,
        })

        return roundMvp?.playerIds.includes(playerId)
      })
  )
  const seasonMvpCount = scopedSeasonIds.filter((scopedSeasonId) => {
    const seasonMvp = getSeasonMvpSelection({
      leagueId,
      seasonId: scopedSeasonId,
      matches,
      votes,
      mvpMode,
    })

    return seasonMvp?.playerIds.includes(playerId)
  }).length

  return {
    roundMvpCount: roundMvpRounds.length,
    roundMvpRounds,
    seasonMvpCount,
    votesReceived: scopedSeasonIds.reduce(
      (total, scopedSeasonId) =>
        total + getPlayerVotesReceived({ votes, leagueId, seasonId: scopedSeasonId, playerId }),
      0
    ),
  }
}

export function getPlayerRoundMvpMatches({
  leagueId,
  seasonIds,
  matches,
  playerId,
  votes = [],
  mvpMode = "automatic",
}: {
  leagueId: string
  seasonIds: string[]
  matches: MvpMatch[]
  playerId: string
  votes?: MvpVote[]
} & MvpModeInput) {
  return seasonIds.flatMap((seasonId) =>
    getCompletedRoundNumbers(matches, leagueId, seasonId)
      .map((round) => {
        const roundMvp = getRoundMvpSelection({
          leagueId,
          seasonId,
          round,
          matches,
          votes,
          mvpMode,
        })

        if (!roundMvp?.playerIds.includes(playerId) || !roundMvp.matchId) {
          return null
        }

        const match = matches.find((item) => item.id === roundMvp.matchId)

        if (!match) {
          return null
        }

        return {
          seasonId,
          round,
          mvp: roundMvp,
          match,
        }
      })
      .filter((item): item is {
        seasonId: string
        round: number
        mvp: MvpResult
        match: MvpMatch
      } => Boolean(item))
  )
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
  votes = [],
  mvpMode = "automatic",
}: {
  leagueId: string
  seasonId: string
  round: number
  matches: MvpMatch[]
  votes?: MvpVote[]
} & MvpModeInput) {
  return getRoundMvpSelection({
    leagueId,
    seasonId,
    round,
    matches,
    votes,
    mvpMode,
  })?.playerIds ?? []
}

export function getSeasonVotes(votes: MvpVote[], leagueId: string, seasonId: string) {
  return votes.filter((vote) => belongsToLeagueSeason(vote, leagueId, seasonId))
}

export function getMatchVoteRows({
  votes,
  leagueId,
  seasonId,
  matchId,
}: {
  votes: MvpVote[]
  leagueId: string
  seasonId: string
  matchId: string
}) {
  return getVoteRows(
    getSeasonVotes(votes, leagueId, seasonId).filter(
      (vote) => vote.matchId === matchId
    )
  )
}

export function getRoundVoteRows({
  votes,
  leagueId,
  seasonId,
  round,
}: {
  votes: MvpVote[]
  leagueId: string
  seasonId: string
  round: number
}) {
  return getVoteRows(
    getSeasonVotes(votes, leagueId, seasonId).filter((vote) => vote.round === round)
  )
}

export function getPlayerMatchVote({
  votes,
  leagueId,
  seasonId,
  matchId,
  voterPlayerId,
}: {
  votes: MvpVote[]
  leagueId: string
  seasonId: string
  matchId: string
  voterPlayerId: string
}) {
  return getSeasonVotes(votes, leagueId, seasonId).find(
    (vote) => vote.matchId === matchId && vote.voterPlayerId === voterPlayerId
  )
}

export function getMatchMvpSelection({
  votes,
  leagueId,
  seasonId,
  match,
}: {
  votes: MvpVote[]
  leagueId: string
  seasonId: string
  match: MvpMatch
}): MvpResult | null {
  if (!match.id || match.status !== "finished") {
    return null
  }

  const rows = getMatchVoteRows({ votes, leagueId, seasonId, matchId: match.id })
  const topPlayerIds = getTopVotePlayerIds(rows)

  if (topPlayerIds.length === 0) {
    return null
  }

  return {
    leagueId,
    seasonId,
    scope: "round",
    round: match.round,
    playerId: topPlayerIds[0],
    playerIds: topPlayerIds,
    source: "votes",
    votes: rows[0]?.votes ?? 0,
    tied: topPlayerIds.length > 1,
    matchId: match.id,
  }
}

export function getMissingMatchMvpVoterIds({
  votes,
  match,
}: {
  votes: MvpVote[]
  match: MvpMatch
}) {
  if (!match.id || match.status !== "finished") {
    return []
  }

  const participantIds = Array.from(new Set([...match.teamA, ...match.teamB]))
  const voters = new Set(
    votes
      .filter((vote) => vote.matchId === match.id)
      .map((vote) => vote.voterPlayerId)
  )

  return participantIds.filter((playerId) => !voters.has(playerId))
}
