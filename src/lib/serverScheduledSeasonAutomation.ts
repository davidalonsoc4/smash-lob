import "server-only"

import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { activateDueScheduledSeasonsFromAutomation } from "@/lib/serverScheduledSeason"

type SupabaseServiceClient = NonNullable<ReturnType<typeof createSupabaseServiceClient>>

type DueSeasonSetting = {
  league_id: string
  season_id: string
  scheduled_start_at: string | null
  seasons: { status?: string | null } | { status?: string | null }[] | null
}

type RoundOneMatch = {
  season_id: string
  scheduled_at: string | null
}

function getJoinedSeasonStatus(value: DueSeasonSetting["seasons"]) {
  const season = Array.isArray(value) ? value[0] : value
  return season?.status ?? null
}

async function hasSeasonStartedEvent(
  supabase: SupabaseServiceClient,
  leagueId: string,
  seasonId: string,
) {
  const { data, error } = await supabase
    .from("activity_events")
    .select("id")
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .eq("type", "season_started")
    .limit(1)
  if (error) throw error
  return Boolean(data?.length)
}

export async function runScheduledSeasonStartAutomation({
  supabase,
  now,
}: {
  supabase: SupabaseServiceClient
  now: Date
}) {
  await activateDueScheduledSeasonsFromAutomation({ supabase, now })

  const { data, error } = await supabase
    .from("season_settings")
    .select("league_id,season_id,scheduled_start_at,seasons!inner(status)")
    .not("scheduled_start_at", "is", null)
    .lte("scheduled_start_at", now.toISOString())
    .limit(250)
  if (error) throw error

  const activeSettings = ((data ?? []) as DueSeasonSetting[]).filter(
    (setting) => getJoinedSeasonStatus(setting.seasons) === "active" && setting.scheduled_start_at,
  )
  const seasonIds = activeSettings.map((setting) => setting.season_id)
  const combinedRoundOneSeasonIds = new Set<string>()

  if (seasonIds.length > 0) {
    const { data: roundOneRows, error: roundOneError } = await supabase
      .from("matches")
      .select("season_id,scheduled_at")
      .in("season_id", seasonIds)
      .eq("round", 1)
      .not("scheduled_at", "is", null)
      .limit(1000)
    if (roundOneError) throw roundOneError

    const earliestBySeason = new Map<string, number>()
    for (const row of (roundOneRows ?? []) as RoundOneMatch[]) {
      if (!row.scheduled_at) continue
      const time = Date.parse(row.scheduled_at)
      if (!Number.isFinite(time)) continue
      const current = earliestBySeason.get(row.season_id)
      if (current === undefined || time < current) earliestBySeason.set(row.season_id, time)
    }

    for (const setting of activeSettings) {
      if (!setting.scheduled_start_at) continue
      const seasonStart = Date.parse(setting.scheduled_start_at)
      const roundStart = earliestBySeason.get(setting.season_id)
      if (
        Number.isFinite(seasonStart) &&
        roundStart !== undefined &&
        Math.abs(roundStart - seasonStart) <= 60_000
      ) {
        combinedRoundOneSeasonIds.add(setting.season_id)
      }
    }
  }

  const eventIds: string[] = []
  for (const setting of activeSettings) {
    if (await hasSeasonStartedEvent(supabase, setting.league_id, setting.season_id)) continue
    const combinedRoundOne = combinedRoundOneSeasonIds.has(setting.season_id)
    const { data: event, error: eventError } = await supabase
      .from("activity_events")
      .insert({
        league_id: setting.league_id,
        season_id: setting.season_id,
        match_id: null,
        actor_user_id: null,
        actor_email: "system@smash-lob.local",
        actor_display_name: "Smash & Lob",
        type: "season_started",
        title: "¡Empieza la temporada!",
        description: combinedRoundOne
          ? "La temporada ya está en marcha y la Jornada 1 ha comenzado."
          : "La temporada ya está activa. Entra en Smash & Lob para ver todos los emparejamientos.",
        metadata: {
          scheduledStartAt: setting.scheduled_start_at,
          automatic: true,
          combinedRound: combinedRoundOne ? 1 : null,
        },
      })
      .select("id")
      .single()
    if (eventError) throw eventError
    eventIds.push(String(event.id))
  }

  return { eventIds, combinedRoundOneSeasonIds }
}
