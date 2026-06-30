export type MvpScope = "round" | "season"
export type MvpSelectionSource = "manual" | "votes"

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
  leagueId: string
  seasonId: string
  round: number
  status: string
  teamA: string[]
  teamB: string[]
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
  source: MvpSelectionSource
  votes: number
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

function belongsToLeagueSeason(item: MvpLookup, leagueId: string, seasonId: string) {
  return item.leagueId === leagueId && item.seasonId === seasonId
}

function getManualSelection({
  manualSelections,
  leagueId,
  seasonId,
  scope,
  round,
}: {
  manualSelections: MvpManualSelection[]
  leagueId: string
  seasonId: string
  scope: MvpScope
  round: number | null
}) {
  return manualSelections.find(
    (selection) =>
      selection.leagueId === leagueId &&
      selection.seasonId === seasonId &&
      selection.scope === scope &&
      selection.round === round
  )
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

export function getFinishedRoundNumbers(matches: MvpMatch[]) {
  return Array.from(
    new Set(
      matches
        .filter((match) => match.status === "finished")
        .map((match) => match.round)
    )
  ).sort((firstRound, secondRound) => firstRound - secondRound)
}

export function getLatestFinishedRound(matches: MvpMatch[]) {
  return getFinishedRoundNumbers(matches).at(-1) ?? null
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
  const votesByPlayerId = new Map<string, number>()

  votes
    .filter(
      (vote) =>
        vote.leagueId === leagueId &&
        vote.seasonId === seasonId &&
        vote.round === round
    )
    .forEach((vote) => {
      votesByPlayerId.set(
        vote.selectedPlayerId,
        (votesByPlayerId.get(vote.selectedPlayerId) ?? 0) + 1
      )
    })

  return Array.from(votesByPlayerId.entries())
    .map(([playerId, voteCount]) => ({
      playerId,
      votes: voteCount,
    }))
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

export function getRoundMvpSelection({
  votes,
  manualSelections,
  leagueId,
  seasonId,
  round,
}: {
  votes: MvpVote[]
  manualSelections: MvpManualSelection[]
  leagueId: string
  seasonId: string
  round: number
}): MvpResult | null {
  const manualSelection = getManualSelection({
    manualSelections,
    leagueId,
    seasonId,
    scope: "round",
    round,
  })

  if (manualSelection) {
    const voteRows = getRoundVoteRows({ votes, leagueId, seasonId, round })
    const manualPlayerVotes =
      voteRows.find((row) => row.playerId === manualSelection.selectedPlayerId)
        ?.votes ?? 0

    return {
      leagueId,
      seasonId,
      scope: "round",
      round,
      playerId: manualSelection.selectedPlayerId,
      source: "manual",
      votes: manualPlayerVotes,
    }
  }

  const topVoteRow = getRoundVoteRows({ votes, leagueId, seasonId, round })[0]

  if (!topVoteRow) {
    return null
  }

  return {
    leagueId,
    seasonId,
    scope: "round",
    round,
    playerId: topVoteRow.playerId,
    source: "votes",
    votes: topVoteRow.votes,
  }
}

export function getSeasonMvpSelection({
  votes,
  manualSelections,
  leagueId,
  seasonId,
  matches,
}: {
  votes: MvpVote[]
  manualSelections: MvpManualSelection[]
  leagueId: string
  seasonId: string
  matches: MvpMatch[]
}): MvpResult | null {
  const manualSelection = getManualSelection({
    manualSelections,
    leagueId,
    seasonId,
    scope: "season",
    round: null,
  })

  if (manualSelection) {
    const votesReceived = getPlayerVotesReceived({
      votes,
      leagueId,
      seasonId,
      playerId: manualSelection.selectedPlayerId,
    })

    return {
      leagueId,
      seasonId,
      scope: "season",
      round: null,
      playerId: manualSelection.selectedPlayerId,
      source: "manual",
      votes: votesReceived,
    }
  }

  const roundMvpCounts = new Map<string, number>()
  const finishedRounds = getFinishedRoundNumbers(matches)

  finishedRounds.forEach((round) => {
    const roundMvp = getRoundMvpSelection({
      votes,
      manualSelections,
      leagueId,
      seasonId,
      round,
    })

    if (!roundMvp) {
      return
    }

    roundMvpCounts.set(
      roundMvp.playerId,
      (roundMvpCounts.get(roundMvp.playerId) ?? 0) + 1
    )
  })

  const topRoundMvpRow = Array.from(roundMvpCounts.entries())
    .map(([playerId, voteCount]) => ({ playerId, votes: voteCount }))
    .sort(sortVoteRows)[0]

  if (!topRoundMvpRow) {
    return null
  }

  return {
    leagueId,
    seasonId,
    scope: "season",
    round: null,
    playerId: topRoundMvpRow.playerId,
    source: "votes",
    votes: topRoundMvpRow.votes,
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
  votes,
  manualSelections,
  leagueId,
  seasonId,
  matches,
  playerId,
}: {
  votes: MvpVote[]
  manualSelections: MvpManualSelection[]
  leagueId: string
  seasonId: string
  matches: MvpMatch[]
  playerId: string
}): PlayerMvpSummary {
  const roundMvpRounds = getFinishedRoundNumbers(matches).filter((round) => {
    const roundMvp = getRoundMvpSelection({
      votes,
      manualSelections,
      leagueId,
      seasonId,
      round,
    })

    return roundMvp?.playerId === playerId
  })
  const seasonMvp = getSeasonMvpSelection({
    votes,
    manualSelections,
    leagueId,
    seasonId,
    matches,
  })

  return {
    roundMvpCount: roundMvpRounds.length,
    roundMvpRounds,
    seasonMvpCount: seasonMvp?.playerId === playerId ? 1 : 0,
    votesReceived: getPlayerVotesReceived({
      votes,
      leagueId,
      seasonId,
      playerId,
    }),
  }
}

export function getPlayerById(players: MvpPlayer[], playerId: string | null) {
  if (!playerId) {
    return null
  }

  return players.find((player) => player.id === playerId) ?? null
}

export function getSeasonVotes(votes: MvpVote[], leagueId: string, seasonId: string) {
  return votes.filter((vote) => belongsToLeagueSeason(vote, leagueId, seasonId))
}
