import "server-only"

import type { ServerLeagueActor } from "@/lib/serverLeagueAccess"
import {
  getMatchMvpSelection,
  getMatchParticipantIds,
  getRoundMvpSelection,
  type MvpManualSelection,
  type MvpMatch,
  type MvpVote,
} from "@/lib/mvp"
import {
  fetchLeaguePlayerNameMap,
  recordServerSystemActivity,
} from "@/lib/serverActivityWrite"

type SupabaseClient = ServerLeagueActor["supabase"]

type SupabaseMvpVoteRow = {
  league_id: string
  season_id: string
  match_id: string | null
  round: number
  voter_player_id: string
  selected_player_id: string
  created_at: string
}

type SupabaseMvpManualSelectionRow = {
  league_id: string
  season_id: string
  scope: "round" | "season"
  round: number | null
  selected_player_id: string
  updated_at: string
}

type MatchVoteLookup = {
  id: string
  leagueId: string
  seasonId: string
  round: number
  status: MvpMatch["status"]
  teamA: string[]
  teamB: string[]
}

export type ServerMvpVoteSaveResult = {
  vote: MvpVote
  existingMatchAwardEvent: boolean
  existingRoundAwardEvent: boolean
}

type SeasonVoteMatchRow = {
  id: string
  league_id: string
  season_id: string
  round: number
  status: MvpMatch["status"]
  team_a: string[] | null
  team_b: string[] | null
}

function mapVote(row: SupabaseMvpVoteRow): MvpVote {
  return {
    leagueId: row.league_id,
    seasonId: row.season_id,
    matchId: row.match_id,
    round: row.round,
    voterPlayerId: row.voter_player_id,
    selectedPlayerId: row.selected_player_id,
    createdAt: row.created_at,
  }
}

function mapManualSelection(
  row: SupabaseMvpManualSelectionRow
): MvpManualSelection {
  return {
    leagueId: row.league_id,
    seasonId: row.season_id,
    scope: row.scope,
    round: row.round,
    selectedPlayerId: row.selected_player_id,
    updatedAt: row.updated_at,
  }
}

function toMvpMatch(match: MatchVoteLookup): MvpMatch {
  return {
    id: match.id,
    leagueId: match.leagueId,
    seasonId: match.seasonId,
    round: match.round,
    status: match.status,
    teamA: match.teamA,
    teamB: match.teamB,
    pointsA: null,
    pointsB: null,
    sets: [],
  }
}

function toPlayerIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((playerId): playerId is string => typeof playerId === "string")
    : []
}

function toVotingSeasonMatch(match: SeasonVoteMatchRow): MvpMatch {
  return {
    id: match.id,
    leagueId: match.league_id,
    seasonId: match.season_id,
    round: match.round,
    status: match.status,
    teamA: toPlayerIds(match.team_a),
    teamB: toPlayerIds(match.team_b),
    pointsA: null,
    pointsB: null,
    sets: [],
    resultCounts: true,
  }
}

async function hasVotingActivityEvent({
  supabase,
  leagueId,
  seasonId,
  matchId,
  round,
  type,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
  matchId?: string
  round: number
  type: "match_mvp_awarded" | "round_mvp_awarded"
}) {
  let query = supabase
    .from("activity_events")
    .select("id")
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .eq("type", type)
    .contains("metadata", { system: "voting" })
    .limit(1)

  query = matchId
    ? query.eq("match_id", matchId)
    : query.contains("metadata", { round })

  const { data, error } = await query

  if (error) {
    throw error
  }

  return Boolean(data && data.length > 0)
}

async function fetchSeasonVotingMatches({
  supabase,
  leagueId,
  seasonId,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
}) {
  const { data, error } = await supabase
    .from("matches")
    .select("id,league_id,season_id,round,status,team_a,team_b")
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)

  if (error) {
    throw error
  }

  return ((data ?? []) as SeasonVoteMatchRow[]).map(toVotingSeasonMatch)
}

async function recordVotingAwardActivityIfNeeded({
  supabase,
  match,
  votes,
  existingMatchAwardEvent,
  existingRoundAwardEvent,
}: {
  supabase: SupabaseClient
  match: MatchVoteLookup
  votes: MvpVote[]
  existingMatchAwardEvent: boolean
  existingRoundAwardEvent: boolean
}) {
  const seasonMatches = await fetchSeasonVotingMatches({
    supabase,
    leagueId: match.leagueId,
    seasonId: match.seasonId,
  })
  const targetMatch = seasonMatches.find((item) => item.id === match.id)

  if (!targetMatch) {
    return
  }

  const matchMvp = getMatchMvpSelection({
    votes,
    match: targetMatch,
  })
  const roundMvp = getRoundMvpSelection({
    votes,
    leagueId: match.leagueId,
    seasonId: match.seasonId,
    round: match.round,
    matches: seasonMatches,
    mvpSystem: "voting",
  })
  const playerNameMap = await fetchLeaguePlayerNameMap({
    supabase,
    leagueId: match.leagueId,
    playerIds: Array.from(
      new Set([...(matchMvp?.playerIds ?? []), ...(roundMvp?.playerIds ?? [])])
    ),
  })

  if (matchMvp && !existingMatchAwardEvent) {
    const winnerNames = matchMvp.playerIds.map(
      (playerId) => playerNameMap.get(playerId) ?? "Jugador"
    )
    const participantIds = getMatchParticipantIds(targetMatch)

    await recordServerSystemActivity({
      supabase,
      leagueId: match.leagueId,
      seasonId: match.seasonId,
      matchId: match.id,
      type: "match_mvp_awarded",
      title: "MVP del partido decidido",
      description: `${winnerNames.join(" / ")} ${winnerNames.length > 1 ? "son" : "es"} el MVP del partido de la Jornada ${match.round}.`,
      metadata: {
        round: match.round,
        playerIds: matchMvp.playerIds,
        playerNames: winnerNames,
        participantIds,
        targetPlayerIds: participantIds,
        votes: matchMvp.votes,
        tied: matchMvp.tied ?? false,
        resolvedWithThreeVotes: matchMvp.votes >= 3,
        system: "voting",
      },
    })
  }

  if (roundMvp && !existingRoundAwardEvent) {
    const winnerNames = roundMvp.playerIds.map(
      (playerId) => playerNameMap.get(playerId) ?? "Jugador"
    )
    const targetPlayerIds = Array.from(
      new Set(
        seasonMatches
          .filter((item) => item.round === match.round)
          .flatMap(getMatchParticipantIds)
      )
    )

    await recordServerSystemActivity({
      supabase,
      leagueId: match.leagueId,
      seasonId: match.seasonId,
      matchId: roundMvp.matchId ?? match.id,
      type: "round_mvp_awarded",
      title: `MVP de Jornada ${match.round} decidido`,
      description: `${winnerNames.join(" / ")} ${winnerNames.length > 1 ? "son" : "es"} el MVP de la Jornada ${match.round}.`,
      metadata: {
        round: match.round,
        playerIds: roundMvp.playerIds,
        playerNames: winnerNames,
        targetPlayerIds,
        votes: roundMvp.votes,
        tied: roundMvp.tied ?? false,
        system: "voting",
      },
    })
  }
}

export async function fetchServerMvpData({
  supabase,
  leagueIds,
}: {
  supabase: SupabaseClient
  leagueIds: string[]
}) {
  if (leagueIds.length === 0) {
    return {
      votes: [],
      manualSelections: [],
    }
  }

  const [votesResult, manualSelectionsResult] = await Promise.all([
    supabase
      .from("mvp_votes")
      .select(
        "league_id,season_id,match_id,round,voter_player_id,selected_player_id,created_at"
      )
      .in("league_id", leagueIds),
    supabase
      .from("mvp_manual_selections")
      .select(
        "league_id,season_id,scope,round,selected_player_id,updated_at"
      )
      .in("league_id", leagueIds),
  ])

  if (votesResult.error) {
    throw votesResult.error
  }

  if (manualSelectionsResult.error) {
    throw manualSelectionsResult.error
  }

  return {
    votes: (votesResult.data ?? []).map((row) =>
      mapVote(row as SupabaseMvpVoteRow)
    ),
    manualSelections: (manualSelectionsResult.data ?? []).map((row) =>
      mapManualSelection(row as SupabaseMvpManualSelectionRow)
    ),
  }
}

export async function fetchServerMatchMvpVotes({
  supabase,
  matchId,
}: {
  supabase: SupabaseClient
  matchId: string
}) {
  const { data, error } = await supabase
    .from("mvp_votes")
    .select(
      "league_id,season_id,match_id,round,voter_player_id,selected_player_id,created_at"
    )
    .eq("match_id", matchId)

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapVote(row as SupabaseMvpVoteRow))
}

export async function isServerMatchMvpClosed({
  supabase,
  match,
}: {
  supabase: SupabaseClient
  match: MatchVoteLookup
}) {
  const votes = await fetchServerMatchMvpVotes({
    supabase,
    matchId: match.id,
  })

  return Boolean(
    getMatchMvpSelection({
      votes,
      match: toMvpMatch(match),
    })
  )
}

export async function saveServerMatchMvpVote({
  supabase,
  match,
  voterPlayerId,
  selectedPlayerId,
}: {
  supabase: SupabaseClient
  match: MatchVoteLookup
  voterPlayerId: string
  selectedPlayerId: string
}) {
  const createdAt = new Date().toISOString()
  const payload = {
    league_id: match.leagueId,
    season_id: match.seasonId,
    match_id: match.id,
    round: match.round,
    voter_player_id: voterPlayerId,
    selected_player_id: selectedPlayerId,
    created_at: createdAt,
  }
  const selectColumns =
    "league_id,season_id,match_id,round,voter_player_id,selected_player_id,created_at"

  const { data: updatedRows, error: updateError } = await supabase
    .from("mvp_votes")
    .update(payload)
    .eq("league_id", match.leagueId)
    .eq("season_id", match.seasonId)
    .eq("match_id", match.id)
    .eq("voter_player_id", voterPlayerId)
    .select(selectColumns)

  if (updateError) {
    throw updateError
  }

  let voteRow = (updatedRows ?? [])[0] as SupabaseMvpVoteRow | undefined

  if (!voteRow) {
    const { data: insertedRow, error: insertError } = await supabase
      .from("mvp_votes")
      .insert(payload)
      .select(selectColumns)
      .single()

    if (insertError) {
      throw insertError
    }

    voteRow = insertedRow as SupabaseMvpVoteRow
  }

  const [existingMatchAwardEvent, existingRoundAwardEvent] = await Promise.all([
    hasVotingActivityEvent({
      supabase,
      leagueId: match.leagueId,
      seasonId: match.seasonId,
      matchId: match.id,
      round: match.round,
      type: "match_mvp_awarded",
    }),
    hasVotingActivityEvent({
      supabase,
      leagueId: match.leagueId,
      seasonId: match.seasonId,
      round: match.round,
      type: "round_mvp_awarded",
    }),
  ])

  const seasonVotes = await fetchServerMvpData({
    supabase,
    leagueIds: [match.leagueId],
  })

  await recordVotingAwardActivityIfNeeded({
    supabase,
    match,
    votes: seasonVotes.votes.filter(
      (vote) =>
        vote.leagueId === match.leagueId && vote.seasonId === match.seasonId
    ),
    existingMatchAwardEvent,
    existingRoundAwardEvent,
  })

  return {
    vote: mapVote(voteRow),
    existingMatchAwardEvent,
    existingRoundAwardEvent,
  } satisfies ServerMvpVoteSaveResult
}

export async function deleteServerMatchMvpVotes({
  supabase,
  matchId,
}: {
  supabase: SupabaseClient
  matchId: string
}) {
  const { error } = await supabase
    .from("mvp_votes")
    .delete()
    .eq("match_id", matchId)

  if (error) {
    throw error
  }
}

export async function getServerSeasonPlayerIds({
  supabase,
  seasonId,
}: {
  supabase: SupabaseClient
  seasonId: string
}) {
  const { data, error } = await supabase
    .from("season_players")
    .select("player_id")
    .eq("season_id", seasonId)

  if (error) {
    throw error
  }

  return (data ?? [])
    .map((row) => row.player_id)
    .filter((playerId): playerId is string => typeof playerId === "string")
}

export async function saveServerMvpManualSelection({
  supabase,
  leagueId,
  seasonId,
  scope,
  round,
  selectedPlayerId,
}: {
  supabase: SupabaseClient
  leagueId: string
  seasonId: string
  scope: "round" | "season"
  round: number | null
  selectedPlayerId: string | null
}) {
  if (!selectedPlayerId) {
    let query = supabase
      .from("mvp_manual_selections")
      .delete()
      .eq("league_id", leagueId)
      .eq("season_id", seasonId)
      .eq("scope", scope)

    query = round === null ? query.is("round", null) : query.eq("round", round)

    const { error } = await query

    if (error) {
      throw error
    }

    return
  }

  const { error } = await supabase.from("mvp_manual_selections").upsert(
    {
      league_id: leagueId,
      season_id: seasonId,
      scope,
      round,
      selected_player_id: selectedPlayerId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "league_id,season_id,scope,round_key",
    }
  )

  if (error) {
    throw error
  }
}
