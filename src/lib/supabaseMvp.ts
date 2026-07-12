import { supabase } from "@/lib/supabase"
import type { MvpManualSelection, MvpVote } from "@/lib/mvp"

type SupabaseMvpVoteRow = {
  league_id: string
  season_id: string
  round: number
  match_id?: string | null
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

function mapVote(row: SupabaseMvpVoteRow): MvpVote {
  return {
    leagueId: row.league_id,
    seasonId: row.season_id,
    round: row.round,
    matchId: row.match_id,
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

export async function fetchSupabaseMvpData(leagueIds: string[]) {
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
        "league_id, season_id, round, voter_player_id, selected_player_id, created_at"
      )
      .in("league_id", leagueIds),
    supabase
      .from("mvp_manual_selections")
      .select("league_id, season_id, scope, round, selected_player_id, updated_at")
      .in("league_id", leagueIds),
  ])

  if (votesResult.error) {
    throw votesResult.error
  }

  if (manualSelectionsResult.error) {
    throw manualSelectionsResult.error
  }

  return {
    votes: (votesResult.data ?? []).map((row) => mapVote(row)),
    manualSelections: (manualSelectionsResult.data ?? []).map((row) =>
      mapManualSelection(row)
    ),
  }
}

export async function upsertSupabaseMvpVote(vote: MvpVote) {
  if (vote.matchId) {
    const { error: deleteError } = await supabase
      .from("mvp_votes")
      .delete()
      .eq("league_id", vote.leagueId)
      .eq("season_id", vote.seasonId)
      .eq("match_id", vote.matchId)
      .eq("voter_player_id", vote.voterPlayerId)

    if (deleteError) {
      throw deleteError
    }

    const { error: insertError } = await supabase.from("mvp_votes").insert({
      league_id: vote.leagueId,
      season_id: vote.seasonId,
      round: vote.round,
      match_id: vote.matchId,
      voter_player_id: vote.voterPlayerId,
      selected_player_id: vote.selectedPlayerId,
      created_at: vote.createdAt,
    })

    if (insertError) {
      throw insertError
    }

    return
  }

  const { error } = await supabase.from("mvp_votes").upsert(
    {
      league_id: vote.leagueId,
      season_id: vote.seasonId,
      round: vote.round,
      match_id: null,
      voter_player_id: vote.voterPlayerId,
      selected_player_id: vote.selectedPlayerId,
      created_at: vote.createdAt,
    },
    {
      onConflict: "league_id,season_id,round,voter_player_id",
    }
  )

  if (error) {
    throw error
  }
}

export async function saveSupabaseMvpManualSelection({
  leagueId,
  seasonId,
  scope,
  round,
  selectedPlayerId,
}: {
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
