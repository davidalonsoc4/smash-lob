import { NextResponse } from "next/server"
import type { SeasonRoundSettings } from "@/context/SeasonSettingsProvider"
import { getEffectiveRevealedThroughRound } from "@/lib/progressiveCalendar"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { mapSupabaseMatch, matchSelect } from "@/lib/supabaseMatches"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RevealRoundBody = {
  round?: unknown
}

function parseRound(value: unknown) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function mapSettings({
  leagueId,
  seasonId,
  row,
}: {
  leagueId: string
  seasonId: string
  row: Record<string, unknown>
}): SeasonRoundSettings {
  return {
    leagueId,
    seasonId,
    roundWindowMode: row.round_window_mode === "fixed-days" ? "fixed-days" : "none",
    seasonStartsAt: typeof row.season_starts_at === "string" ? row.season_starts_at : null,
    scheduledStartAt: typeof row.scheduled_start_at === "string" ? row.scheduled_start_at : null,
    preseasonSecretDaysBefore:
      typeof row.preseason_secret_days_before === "number" ? row.preseason_secret_days_before : null,
    calendarVisibilityMode: row.calendar_visibility_mode === "progressive" ? "progressive" : "full",
    revealedThroughRound:
      typeof row.revealed_through_round === "number" ? row.revealed_through_round : 0,
    openingRoundEnabled: row.opening_round_enabled === true,
    openingRoundAt: typeof row.opening_round_at === "string" ? row.opening_round_at : null,
    roundWindowDays: typeof row.round_window_days === "number" ? row.round_window_days : null,
    requiresThreeSets: row.requires_three_sets !== false,
    mvpSystem:
      row.mvp_system === "none" ||
      row.mvp_system === "automatic_advanced" ||
      row.mvp_system === "voting"
        ? row.mvp_system
        : "automatic",
    resultConfirmationMode:
      row.result_confirmation_mode === "required" || row.result_confirmation_mode === "none"
        ? row.result_confirmation_mode
        : "optional",
    manualActiveRound:
      typeof row.manual_active_round === "number" ? row.manual_active_round : null,
    manualCompletedRounds: Array.isArray(row.manual_completed_rounds)
      ? row.manual_completed_rounds.map(Number).filter((round) => Number.isInteger(round) && round > 0)
      : [],
    registrationFee: {
      enabled: false,
      amount: 0,
      purpose: "",
      payments: [],
      expenses: [],
    },
    rosterMode: "fixed",
    playerCapacity: null,
    registrationOpen: false,
    rosterCompletedAt: null,
    scheduleMode: "single",
    calendarMode: "balanced",
    allowPlayerIncidents: true,
    allowPlayerSubstitutions: true,
    availabilityRecommendationsEnabled: false,
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonId: string }> },
) {
  const { id: leagueId, seasonId } = await params
  if (!validateUuid(leagueId) || !validateUuid(seasonId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerSeasonAdmin(leagueId, seasonId, { requireMutable: true })
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<RevealRoundBody>(request)
  const targetRound = parseRound(body?.round)
  if (!targetRound || targetRound > access.season.totalRounds) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const [{ data: settingsRow, error: settingsError }, { data: matchRows, error: matchesError }] =
    await Promise.all([
      access.actor.supabase
        .from("season_settings")
        .select(
          "round_window_mode,season_starts_at,scheduled_start_at,preseason_secret_days_before,calendar_visibility_mode,revealed_through_round,opening_round_enabled,opening_round_at,round_window_days,requires_three_sets,mvp_system,result_confirmation_mode,manual_active_round,manual_completed_rounds",
        )
        .eq("season_id", seasonId)
        .maybeSingle(),
      access.actor.supabase.from("matches").select(matchSelect).eq("season_id", seasonId),
    ])

  if (settingsError || !settingsRow) {
    return NextResponse.json({ error: "season_settings_lookup_failed" }, { status: 500 })
  }
  if (matchesError) {
    return NextResponse.json({ error: "season_matches_lookup_failed" }, { status: 500 })
  }
  if (settingsRow.calendar_visibility_mode !== "progressive") {
    return NextResponse.json({ error: "calendar_not_progressive" }, { status: 409 })
  }

  const settings = mapSettings({
    leagueId,
    seasonId,
    row: settingsRow as Record<string, unknown>,
  })
  const matches = (matchRows ?? []).map((row) => mapSupabaseMatch(row as Record<string, unknown>))
  const currentlyRevealed = getEffectiveRevealedThroughRound({
    seasonStatus: access.season.status,
    totalRounds: access.season.totalRounds,
    settings,
    matches,
  })

  if (targetRound <= currentlyRevealed) {
    return NextResponse.json({ ok: true, revealedThroughRound: currentlyRevealed })
  }
  if (targetRound !== currentlyRevealed + 1) {
    return NextResponse.json({ error: "round_reveal_must_be_next" }, { status: 409 })
  }

  const nextStored = Math.max(settings.revealedThroughRound ?? 0, targetRound)
  const { data: updatedSetting, error: updateError } = await access.actor.supabase
    .from("season_settings")
    .update({ revealed_through_round: nextStored })
    .eq("season_id", seasonId)
    .lt("revealed_through_round", nextStored)
    .select("season_id")
    .maybeSingle()

  if (updateError) {
    return NextResponse.json({ error: "round_reveal_failed" }, { status: 500 })
  }

  if (updatedSetting) await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId,
    seasonId,
    type: "round_pairings_revealed",
    title: `Jornada ${targetRound} desbloqueada`,
    description: `Ya puedes consultar los emparejamientos de la Jornada ${targetRound} y empezar a organizar el partido.`,
    metadata: { round: targetRound, reason: "manual" },
  }).catch(() => null)

  return NextResponse.json({ ok: true, revealedThroughRound: nextStored })
}
