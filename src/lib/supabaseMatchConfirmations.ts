import { supabase } from "@/lib/supabase"

export type MatchResultConfirmationStatus = "confirmed" | "disputed"

export type MatchResultConfirmation = {
  matchId: string
  playerId: string
  status: MatchResultConfirmationStatus
  updatedAt: string
}

type SupabaseMatchResultConfirmationRow = {
  match_id: string
  player_id: string
  status: MatchResultConfirmationStatus
  updated_at: string
}

function mapConfirmation(
  row: SupabaseMatchResultConfirmationRow
): MatchResultConfirmation {
  return {
    matchId: row.match_id,
    playerId: row.player_id,
    status: row.status,
    updatedAt: row.updated_at,
  }
}

export async function fetchSupabaseMatchResultConfirmations(matchIds: string[]) {
  if (matchIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from("match_result_confirmations")
    .select("match_id,player_id,status,updated_at")
    .in("match_id", matchIds)

  if (error) {
    throw error
  }

  return (data ?? []).map((row) =>
    mapConfirmation(row as SupabaseMatchResultConfirmationRow)
  )
}

export async function upsertSupabaseMatchResultConfirmation(
  confirmation: MatchResultConfirmation
) {
  const { error } = await supabase.from("match_result_confirmations").upsert(
    {
      match_id: confirmation.matchId,
      player_id: confirmation.playerId,
      status: confirmation.status,
      updated_at: confirmation.updatedAt,
    },
    {
      onConflict: "match_id,player_id",
    }
  )

  if (error) {
    throw error
  }
}

export async function clearSupabaseMatchResultConfirmations(matchId: string) {
  const { error } = await supabase
    .from("match_result_confirmations")
    .delete()
    .eq("match_id", matchId)

  if (error) {
    throw error
  }
}
