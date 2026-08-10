export type MvpSystem = "none" | "automatic" | "automatic_advanced" | "voting"
export type MvpScope = "match" | "round" | "season"
export type MvpSelectionSource = "automatic" | "automatic_advanced" | "manual" | "votes"

export type MvpVote = {
  leagueId: string
  seasonId: string
  matchId: string | null
  round: number
  voterPlayerId: string
  selectedPlayerId: string
  createdAt: string
}

export type MvpManualSelection = {
  leagueId: string
  seasonId: string
  scope: Exclude<MvpScope, "match">
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
  resultCounts?: boolean
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
  adjustedRating?: number
  ratingGap?: number
  candidateRatings?: { playerId: string; rating: number }[]
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

const ADVANCED_MVP_RIDGE_LAMBDA = 1.5
const ADVANCED_MVP_SHARED_RATING_EPSILON = 0.03

type AdvancedMvpRatingRow = {
  playerId: string
  rating: number
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

function getTeamSetsWon(match: MvpMatch, team: "A" | "B") {
  return match.sets.filter((set) => (team === "A" ? set.a > set.b : set.b > set.a)).length
}

function getAdvancedMatchPerformance(match: MvpMatch) {
  const setsA = getTeamSetsWon(match, "A")
  const setsB = getTeamSetsWon(match, "B")

  if (setsA === setsB) {
    return 0
  }

  const gamesA = getTeamGames(match, "A")
  const gamesB = getTeamGames(match, "B")
  const resultScore = setsA > setsB ? 1 : -1
  const setMargin = (setsA - setsB) / Math.max(match.sets.length, 1)
  const gameMargin = (gamesA - gamesB) / Math.max(gamesA + gamesB, 1)

  // Resultado > sets > juegos. El índice queda aproximadamente entre -1 y 1.
  return resultScore * 0.6 + setMargin * 0.25 + gameMargin * 0.15
}

function solveLinearSystem(matrix: number[][], vector: number[]) {
  const size = vector.length
  const augmented = matrix.map((row, rowIndex) => [...row, vector[rowIndex]])

  for (let pivot = 0; pivot < size; pivot += 1) {
    let bestRow = pivot

    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[bestRow][pivot])) {
        bestRow = row
      }
    }

    if (Math.abs(augmented[bestRow][pivot]) < 1e-10) {
      continue
    }

    if (bestRow !== pivot) {
      ;[augmented[pivot], augmented[bestRow]] = [augmented[bestRow], augmented[pivot]]
    }

    const pivotValue = augmented[pivot][pivot]
    for (let column = pivot; column <= size; column += 1) {
      augmented[pivot][column] /= pivotValue
    }

    for (let row = 0; row < size; row += 1) {
      if (row === pivot) {
        continue
      }

      const factor = augmented[row][pivot]
      if (Math.abs(factor) < 1e-12) {
        continue
      }

      for (let column = pivot; column <= size; column += 1) {
        augmented[row][column] -= factor * augmented[pivot][column]
      }
    }
  }

  return augmented.map((row, index) =>
    Number.isFinite(row[size]) ? row[size] : vector[index] * 0,
  )
}

export function getAdvancedAutomaticMvpRatings({
  leagueId,
  seasonId,
  round,
  matches,
}: {
  leagueId: string
  seasonId: string
  round: number
  matches: MvpMatch[]
}): AdvancedMvpRatingRow[] {
  const ratingMatches = matches.filter(
    (match) =>
      match.leagueId === leagueId &&
      match.seasonId === seasonId &&
      match.round <= round &&
      match.status === "finished" &&
      match.resultCounts !== false &&
      match.sets.length > 0 &&
      getTeamSetsWon(match, "A") !== getTeamSetsWon(match, "B"),
  )
  const playerIds = Array.from(
    new Set(ratingMatches.flatMap((match) => [...match.teamA, ...match.teamB])),
  ).sort((firstPlayerId, secondPlayerId) => firstPlayerId.localeCompare(secondPlayerId))

  if (playerIds.length === 0) {
    return []
  }

  const playerIndex = new Map(playerIds.map((playerId, index) => [playerId, index]))
  const matrix = Array.from({ length: playerIds.length }, (_, row) =>
    Array.from({ length: playerIds.length }, (_, column) =>
      row === column ? ADVANCED_MVP_RIDGE_LAMBDA : 0,
    ),
  )
  const vector = Array.from({ length: playerIds.length }, () => 0)

  ratingMatches.forEach((match) => {
    const features = Array.from({ length: playerIds.length }, () => 0)

    match.teamA.forEach((playerId) => {
      const index = playerIndex.get(playerId)
      if (index !== undefined) features[index] += 1
    })
    match.teamB.forEach((playerId) => {
      const index = playerIndex.get(playerId)
      if (index !== undefined) features[index] -= 1
    })

    const target = getAdvancedMatchPerformance(match)

    for (let row = 0; row < features.length; row += 1) {
      if (features[row] === 0) continue
      vector[row] += features[row] * target

      for (let column = 0; column < features.length; column += 1) {
        if (features[column] === 0) continue
        matrix[row][column] += features[row] * features[column]
      }
    }
  })

  const ratings = solveLinearSystem(matrix, vector)

  return playerIds
    .map((playerId, index) => ({
      playerId,
      rating: Math.round(ratings[index] * 10000) / 10000,
    }))
    .sort((firstRow, secondRow) => {
      if (secondRow.rating !== firstRow.rating) {
        return secondRow.rating - firstRow.rating
      }
      return firstRow.playerId.localeCompare(secondRow.playerId)
    })
}

function getRoundMatches(matches: MvpMatch[], leagueId: string, seasonId: string, round: number) {
  return matches.filter(
    (match) =>
      match.leagueId === leagueId &&
      match.seasonId === seasonId &&
      match.round === round
  )
}

function isRoundFinished(matches: MvpMatch[], leagueId: string, seasonId: string, round: number) {
  const roundMatches = getRoundMatches(matches, leagueId, seasonId, round)

  return roundMatches.length > 0 && roundMatches.every((match) => match.status === "finished")
}

function isRoundComplete(matches: MvpMatch[], leagueId: string, seasonId: string, round: number) {
  const roundMatches = getRoundMatches(matches, leagueId, seasonId, round)

  return (
    roundMatches.length > 0 &&
    roundMatches.every(
      (match) => match.status === "finished" && match.resultCounts !== false,
    )
  )
}

function getRoundWinnerCandidate(match: MvpMatch): RoundMvpCandidate | null {
  if (match.status !== "finished" || match.resultCounts === false) {
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

function getSeasonMvpSystem({
  seasonId,
  mvpSystem = "automatic",
  mvpSystemBySeasonId,
}: {
  seasonId: string
  mvpSystem?: MvpSystem
  mvpSystemBySeasonId?: Record<string, MvpSystem>
}) {
  return mvpSystemBySeasonId?.[seasonId] ?? mvpSystem
}

export function getMatchParticipantIds(match: MvpMatch) {
  return Array.from(new Set([...match.teamA, ...match.teamB]))
}

export function getMatchVotes(votes: MvpVote[], matchId: string | undefined) {
  if (!matchId) {
    return []
  }

  return votes.filter((vote) => vote.matchId === matchId)
}

export function getPlayerMatchVote({
  votes,
  matchId,
  voterPlayerId,
}: {
  votes: MvpVote[]
  matchId: string | undefined
  voterPlayerId: string
}) {
  return getMatchVotes(votes, matchId).find(
    (vote) => vote.voterPlayerId === voterPlayerId
  )
}

export function getMatchVoteRows({
  votes,
  match,
}: {
  votes: MvpVote[]
  match: MvpMatch
}) {
  const participantIds = new Set(getMatchParticipantIds(match))

  return Array.from(
    getMatchVotes(votes, match.id)
      .filter(
        (vote) =>
          participantIds.has(vote.voterPlayerId) &&
          participantIds.has(vote.selectedPlayerId) &&
          vote.voterPlayerId !== vote.selectedPlayerId
      )
      .reduce((counts, vote) => {
        counts.set(vote.selectedPlayerId, (counts.get(vote.selectedPlayerId) ?? 0) + 1)
        return counts
      }, new Map<string, number>())
      .entries()
  )
    .map(([playerId, voteCount]) => ({ playerId, votes: voteCount }))
    .sort(sortVoteRows)
}

export function getMatchVotingProgress({
  votes,
  match,
}: {
  votes: MvpVote[]
  match: MvpMatch
}) {
  const participantIds = getMatchParticipantIds(match)
  const validVoterIds = new Set(
    getMatchVotes(votes, match.id)
      .filter(
        (vote) =>
          participantIds.includes(vote.voterPlayerId) &&
          participantIds.includes(vote.selectedPlayerId) &&
          vote.voterPlayerId !== vote.selectedPlayerId
      )
      .map((vote) => vote.voterPlayerId)
  )
  const voteRows = getMatchVoteRows({ votes, match })
  const hasDecisiveWinner = (voteRows[0]?.votes ?? 0) >= 3

  return {
    submitted: validVoterIds.size,
    required: participantIds.length,
    missingPlayerIds: participantIds.filter((playerId) => !validVoterIds.has(playerId)),
    resolvedEarly: hasDecisiveWinner,
    complete:
      match.status === "finished" &&
      participantIds.length > 0 &&
      (hasDecisiveWinner || validVoterIds.size === participantIds.length),
  }
}

export function getMatchMvpSelection({
  votes,
  match,
}: {
  votes: MvpVote[]
  match: MvpMatch
}): MvpResult | null {
  const progress = getMatchVotingProgress({ votes, match })

  if (!progress.complete || !match.id) {
    return null
  }

  const rows = getMatchVoteRows({ votes, match })
  const topCount = rows[0]?.votes ?? 0

  if (topCount === 0) {
    return null
  }

  const topPlayerIds = rows
    .filter((row) => row.votes === topCount)
    .map((row) => row.playerId)
    .sort((firstPlayerId, secondPlayerId) => firstPlayerId.localeCompare(secondPlayerId))

  return {
    leagueId: match.leagueId,
    seasonId: match.seasonId,
    scope: "match",
    round: match.round,
    playerId: topPlayerIds[0],
    playerIds: topPlayerIds,
    source: "votes",
    votes: topCount,
    tied: topPlayerIds.length > 1,
    matchId: match.id,
  }
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

export function getRoundVotingProgress({
  votes,
  leagueId,
  seasonId,
  round,
  matches,
}: {
  votes: MvpVote[]
  leagueId: string
  seasonId: string
  round: number
  matches: MvpMatch[]
}) {
  const roundMatches = getRoundMatches(matches, leagueId, seasonId, round)
  const progressItems = roundMatches.map((match) => getMatchVotingProgress({ votes, match }))

  return {
    submitted: progressItems.reduce((total, item) => total + item.submitted, 0),
    required: progressItems.reduce((total, item) => total + item.required, 0),
    complete:
      roundMatches.length > 0 &&
      roundMatches.every((match) => match.status === "finished") &&
      progressItems.every((item) => item.complete),
  }
}

export function getRoundMvpSelection({
  votes = [],
  leagueId,
  seasonId,
  round,
  matches,
  mvpSystem = "automatic",
}: {
  votes?: MvpVote[]
  manualSelections?: MvpManualSelection[]
  leagueId: string
  seasonId: string
  round: number
  matches: MvpMatch[]
  mvpSystem?: MvpSystem
}): MvpResult | null {
  if (mvpSystem === "none") {
    return null
  }

  if (mvpSystem === "voting") {
    if (!isRoundFinished(matches, leagueId, seasonId, round)) {
      return null
    }
    const progress = getRoundVotingProgress({
      votes,
      leagueId,
      seasonId,
      round,
      matches,
    })

    if (!progress.complete) {
      return null
    }

    const roundMatchIds = new Set(
      getRoundMatches(matches, leagueId, seasonId, round)
        .map((match) => match.id)
        .filter((matchId): matchId is string => Boolean(matchId))
    )
    const rows = Array.from(
      votes
        .filter(
          (vote) =>
            vote.leagueId === leagueId &&
            vote.seasonId === seasonId &&
            vote.matchId !== null &&
            roundMatchIds.has(vote.matchId)
        )
        .reduce((counts, vote) => {
          counts.set(vote.selectedPlayerId, (counts.get(vote.selectedPlayerId) ?? 0) + 1)
          return counts
        }, new Map<string, number>())
        .entries()
    )
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
    const singleWinnerMatch =
      topPlayerIds.length === 1
        ? getRoundMatches(matches, leagueId, seasonId, round).find((match) =>
            getMatchParticipantIds(match).includes(topPlayerIds[0])
          )
        : null

    return {
      leagueId,
      seasonId,
      scope: "round",
      round,
      playerId: topPlayerIds[0],
      playerIds: topPlayerIds,
      source: "votes",
      votes: topCount,
      tied: topPlayerIds.length > 1,
      matchId: singleWinnerMatch?.id,
    }
  }

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

  if (mvpSystem === "automatic_advanced") {
    const ratingByPlayerId = new Map(
      getAdvancedAutomaticMvpRatings({ leagueId, seasonId, round, matches }).map((row) => [
        row.playerId,
        row.rating,
      ]),
    )
    const candidateRatings = topCandidate.playerIds
      .map((playerId) => ({ playerId, rating: ratingByPlayerId.get(playerId) ?? 0 }))
      .sort((firstRow, secondRow) => {
        if (secondRow.rating !== firstRow.rating) {
          return secondRow.rating - firstRow.rating
        }
        return firstRow.playerId.localeCompare(secondRow.playerId)
      })
    const topRating = candidateRatings[0]?.rating ?? 0
    const secondRating = candidateRatings[1]?.rating ?? topRating
    const ratingGap = Math.abs(topRating - secondRating)
    const selectedPlayerIds = candidateRatings
      .filter((row) => topRating - row.rating <= ADVANCED_MVP_SHARED_RATING_EPSILON)
      .map((row) => row.playerId)

    return {
      leagueId,
      seasonId,
      scope: "round",
      round,
      playerId: selectedPlayerIds[0] ?? topCandidate.playerIds[0],
      playerIds: selectedPlayerIds.length > 0 ? selectedPlayerIds : topCandidate.playerIds,
      source: "automatic_advanced",
      votes: 1,
      gamesFor: topCandidate.gamesFor,
      gamesAgainst: topCandidate.gamesAgainst,
      gamesDiff: topCandidate.gamesDiff,
      setsFor: topCandidate.setsFor,
      setsAgainst: topCandidate.setsAgainst,
      tied: selectedPlayerIds.length > 1,
      matchId: topCandidate.matchId,
      adjustedRating: topRating,
      ratingGap,
      candidateRatings,
    }
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
  votes = [],
  leagueId,
  seasonId,
  matches,
  mvpSystem = "automatic",
}: {
  votes?: MvpVote[]
  manualSelections?: MvpManualSelection[]
  leagueId: string
  seasonId: string
  matches: MvpMatch[]
  mvpSystem?: MvpSystem
}): MvpResult | null {
  if (mvpSystem === "none") {
    return null
  }

  const roundMvpCounts = new Map<string, number>()
  const completedRounds = getCompletedRoundNumbers(matches, leagueId, seasonId)

  completedRounds.forEach((round) => {
    const roundMvp = getRoundMvpSelection({
      votes,
      leagueId,
      seasonId,
      round,
      matches,
      mvpSystem,
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
    source:
      mvpSystem === "voting"
        ? "votes"
        : mvpSystem === "automatic_advanced"
          ? "automatic_advanced"
          : "automatic",
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
      vote.matchId !== null &&
      vote.selectedPlayerId === playerId
  ).length
}

export function getPlayerMvpSummary({
  votes = [],
  leagueId,
  seasonId,
  seasonIds,
  matches,
  playerId,
  mvpSystem = "automatic",
  mvpSystemBySeasonId,
}: {
  votes?: MvpVote[]
  manualSelections?: MvpManualSelection[]
  leagueId: string
  seasonId?: string
  seasonIds?: string[]
  matches: MvpMatch[]
  playerId: string
  mvpSystem?: MvpSystem
  mvpSystemBySeasonId?: Record<string, MvpSystem>
}): PlayerMvpSummary {
  const scopedSeasonIds = seasonIds ?? (seasonId ? [seasonId] : [])

  const roundMvpRounds = scopedSeasonIds.flatMap((scopedSeasonId) => {
    const scopedMvpSystem = getSeasonMvpSystem({
      seasonId: scopedSeasonId,
      mvpSystem,
      mvpSystemBySeasonId,
    })

    return getCompletedRoundNumbers(matches, leagueId, scopedSeasonId).filter((round) => {
      const roundMvp = getRoundMvpSelection({
        votes,
        leagueId,
        seasonId: scopedSeasonId,
        round,
        matches,
        mvpSystem: scopedMvpSystem,
      })

      return roundMvp?.playerIds.includes(playerId)
    })
  })
  const seasonMvpCount = scopedSeasonIds.filter((scopedSeasonId) => {
    const scopedMvpSystem = getSeasonMvpSystem({
      seasonId: scopedSeasonId,
      mvpSystem,
      mvpSystemBySeasonId,
    })
    const seasonMvp = getSeasonMvpSelection({
      votes,
      leagueId,
      seasonId: scopedSeasonId,
      matches,
      mvpSystem: scopedMvpSystem,
    })

    return seasonMvp?.playerIds.includes(playerId)
  }).length

  return {
    roundMvpCount: roundMvpRounds.length,
    roundMvpRounds,
    seasonMvpCount,
    votesReceived: votes.filter(
      (vote) =>
        vote.leagueId === leagueId &&
        scopedSeasonIds.includes(vote.seasonId) &&
        vote.matchId !== null &&
        vote.selectedPlayerId === playerId
    ).length,
  }
}

export function getPlayerRoundMvpMatches({
  votes = [],
  leagueId,
  seasonIds,
  matches,
  playerId,
  mvpSystemBySeasonId,
}: {
  votes?: MvpVote[]
  leagueId: string
  seasonIds: string[]
  matches: MvpMatch[]
  playerId: string
  mvpSystemBySeasonId?: Record<string, MvpSystem>
}) {
  return seasonIds.flatMap((seasonId) => {
    const mvpSystem = getSeasonMvpSystem({
      seasonId,
      mvpSystemBySeasonId,
    })

    return getCompletedRoundNumbers(matches, leagueId, seasonId)
      .map((round) => {
        const roundMvp = getRoundMvpSelection({
          votes,
          leagueId,
          seasonId,
          round,
          matches,
          mvpSystem,
        })

        if (!roundMvp?.playerIds.includes(playerId)) {
          return null
        }

        const match = matches.find(
          (item) =>
            item.leagueId === leagueId &&
            item.seasonId === seasonId &&
            item.round === round &&
            getMatchParticipantIds(item).includes(playerId)
        )

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
  })
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
  votes = [],
  leagueId,
  seasonId,
  round,
  matches,
  mvpSystem = "automatic",
}: {
  votes?: MvpVote[]
  leagueId: string
  seasonId: string
  round: number
  matches: MvpMatch[]
  mvpSystem?: MvpSystem
}) {
  return (
    getRoundMvpSelection({
      votes,
      leagueId,
      seasonId,
      round,
      matches,
      mvpSystem,
    })?.playerIds ?? []
  )
}

export function getSeasonVotes(votes: MvpVote[], leagueId: string, seasonId: string) {
  return votes.filter((vote) => belongsToLeagueSeason(vote, leagueId, seasonId))
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
  return Array.from(
    votes
      .filter(
        (vote) =>
          vote.leagueId === leagueId &&
          vote.seasonId === seasonId &&
          vote.round === round &&
          vote.matchId !== null
      )
      .reduce((counts, vote) => {
        counts.set(vote.selectedPlayerId, (counts.get(vote.selectedPlayerId) ?? 0) + 1)
        return counts
      }, new Map<string, number>())
      .entries()
  )
    .map(([playerId, voteCount]) => ({ playerId, votes: voteCount }))
    .sort(sortVoteRows)
}

export function getPlayerRoundVote({
  votes,
  leagueId,
  seasonId,
  round,
  voterPlayerId,
}: {
  votes: MvpVote[]
  leagueId: string
  seasonId: string
  round: number
  voterPlayerId: string
}) {
  return votes.find(
    (vote) =>
      vote.leagueId === leagueId &&
      vote.seasonId === seasonId &&
      vote.round === round &&
      vote.voterPlayerId === voterPlayerId
  )
}
