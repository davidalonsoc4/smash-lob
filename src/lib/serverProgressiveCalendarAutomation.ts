import type { SupabaseClient } from "@supabase/supabase-js"
import { getOfficiallyStartedThroughRound } from "@/lib/progressiveCalendar"
import { recordServerSystemActivity } from "@/lib/serverActivityWrite"

type ProgressiveSettingRow = {
  league_id: string
  season_id: string
  revealed_through_round: number | null
  round_window_mode: string | null
  season_starts_at: string | null
  round_window_days: number | null
  opening_round_enabled: boolean | null
  opening_round_at: string | null
}

type SeasonRow = {
  id: string
  status: string | null
  total_rounds: number | null
}

export async function runProgressiveCalendarRevealAutomation({
  supabase,
  now = new Date(),
}: {
  supabase: SupabaseClient
  now?: Date
}) {
  const { data: settingsRows, error: settingsError } = await supabase
    .from("season_settings")
    .select(
      "league_id,season_id,revealed_through_round,round_window_mode,season_starts_at,round_window_days,opening_round_enabled,opening_round_at",
    )
    .eq("calendar_visibility_mode", "progressive")
    .limit(1000)

  if (settingsError) throw settingsError
  const settings = (settingsRows ?? []) as ProgressiveSettingRow[]
  if (!settings.length) return { created: 0 }

  const seasonIds = settings.map((setting) => setting.season_id)
  const { data: seasonRows, error: seasonsError } = await supabase
    .from("seasons")
    .select("id,status,total_rounds")
    .in("id", seasonIds)

  if (seasonsError) throw seasonsError
  const seasonById = new Map(
    ((seasonRows ?? []) as SeasonRow[]).map((season) => [season.id, season]),
  )

  let created = 0
  for (const setting of settings) {
    const season = seasonById.get(setting.season_id)
    if (season?.status !== "active") continue
    const totalRounds = Number(season.total_rounds) || 0
    if (totalRounds < 1) continue

    const revealedByDate = getOfficiallyStartedThroughRound({
      totalRounds,
      settings: {
        roundWindowMode:
          setting.round_window_mode === "fixed-days" ? "fixed-days" : "none",
        seasonStartsAt: setting.season_starts_at,
        roundWindowDays: setting.round_window_days,
        openingRoundEnabled: setting.opening_round_enabled === true,
        openingRoundAt: setting.opening_round_at,
      },
      now,
    })
    const storedReveal = Math.max(0, Number(setting.revealed_through_round) || 0)
    if (revealedByDate <= storedReveal) continue

    const { data: updatedSetting, error: updateError } = await supabase
      .from("season_settings")
      .update({ revealed_through_round: revealedByDate })
      .eq("season_id", setting.season_id)
      .lt("revealed_through_round", revealedByDate)
      .select("season_id")
      .maybeSingle()
    if (updateError || !updatedSetting) continue

    for (let round = storedReveal + 1; round <= revealedByDate; round += 1) {
      await recordServerSystemActivity({
        supabase,
        leagueId: setting.league_id,
        seasonId: setting.season_id,
        type: "round_pairings_revealed",
        title: `Jornada ${round} desbloqueada`,
        description: `La Jornada ${round} ha llegado a su fecha oficial de inicio. Ya puedes consultar los emparejamientos y empezar a organizar el partido.`,
        metadata: { round, reason: "official_start" },
      }).catch(() => null)
      created += 1
    }
  }

  return { created }
}
