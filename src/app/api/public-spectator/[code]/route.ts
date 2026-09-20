import { NextResponse } from "next/server"
import { applyPrivateNoStore } from "@/lib/serverResponse"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { validateInviteCode, validateUuid } from "@/lib/serverRequest"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { mapSupabaseMatch } from "@/lib/supabaseMatches"
import { getPreseasonAccessPhase } from "@/lib/preseasonSecrets"
import { getEffectiveRevealedThroughRound } from "@/lib/progressiveCalendar"
import { buildPublicSpectatorRanking, sanitizePublicSpectatorMatch } from "@/lib/publicSpectator"
import type { PlayerProfile, SeasonPlayer } from "@/data/fakeData"
import { DEFAULT_SPECTATOR_INVITE_APPEARANCE } from "@/lib/spectatorTheme"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const empty = (status: number, error: string) =>
  applyPrivateNoStore(NextResponse.json({ error }, { status }))

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "public_spectator_view",
    limit: 60,
    windowMs: 60_000,
  })
  if (rateLimited) return applyPrivateNoStore(rateLimited)

  const { code: rawCode } = await params
  const code = validateInviteCode(decodeURIComponent(rawCode ?? ""))
  if (!code) return empty(400, "invalid_code")

  const supabase = createSupabaseServiceClient()
  if (!supabase) return empty(501, "service_unavailable")

  const { data: invite, error: inviteError } = await supabase
    .from("spectator_invites")
    .select("league_id")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle()

  if (inviteError) return empty(500, "spectator_view_unavailable")
  if (!invite) return empty(404, "invite_not_found")

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id,name,description,logo_url,accent_color,active_season_id")
    .eq("id", invite.league_id)
    .maybeSingle()
  if (leagueError) return empty(500, "spectator_view_unavailable")
  if (!league) return empty(404, "invite_not_found")

  const { data: seasons, error: seasonsError } = await supabase
    .from("seasons")
    .select("id,name,status,total_rounds,completed_rounds,created_at")
    .eq("league_id", league.id)
    .order("created_at", { ascending: false })
  if (seasonsError) return empty(500, "spectator_view_unavailable")

  const requestedSeasonId = validateUuid(new URL(request.url).searchParams.get("seasonId"))
  const availableSeasons = (seasons ?? []).map((item) => ({
    id: String(item.id),
    name: String(item.name ?? "Temporada"),
    status: item.status === "finished" || item.status === "upcoming" ? item.status : "active",
  }))

  const season =
    (requestedSeasonId ? (seasons ?? []).find((item) => item.id === requestedSeasonId) : null) ??
    (seasons ?? []).find((item) => item.id === league.active_season_id) ??
    (seasons ?? []).find((item) => item.status === "active") ??
    (seasons ?? [])[0] ??
    null

  if (!season) {
    return applyPrivateNoStore(NextResponse.json({
      league: { name: league.name, description: league.description ?? "", logoUrl: league.logo_url ?? null, accentColor: league.accent_color ?? null },
      appearance: DEFAULT_SPECTATOR_INVITE_APPEARANCE,
      season: null,
      seasons: availableSeasons,
      ranking: [],
      matches: [],
      visibility: "empty",
    }))
  }

  const [{ data: settings, error: settingsError }, { data: rawMatches, error: matchesError }, { data: roster, error: rosterError }] = await Promise.all([
    supabase
      .from("season_settings")
      .select("season_starts_at,scheduled_start_at,preseason_secret_days_before,calendar_visibility_mode,revealed_through_round,opening_round_enabled,opening_round_at,round_window_mode,round_window_days")
      .eq("season_id", season.id)
      .maybeSingle(),
    supabase
      .from("matches")
      .select("id,league_id,season_id,round,status,team_a,team_b,points_a,points_b,sets,scheduled_at,location,ranking_counts")
      .eq("season_id", season.id)
      .order("round", { ascending: true }),
    supabase
      .from("season_players")
      .select("player_id,status,joined_from_round,replaced_from_round")
      .eq("season_id", season.id),
  ])

  if (settingsError || matchesError || rosterError) return empty(500, "spectator_view_unavailable")

  const rosterRows = roster ?? []
  const playerIds = Array.from(new Set(rosterRows.map((item) => item.player_id).filter((id): id is string => typeof id === "string")))
  const { data: playerRows, error: playersError } = playerIds.length
    ? await supabase.from("players").select("id,display_name").in("id", playerIds)
    : { data: [], error: null }
  if (playersError) return empty(500, "spectator_view_unavailable")

  const profiles: PlayerProfile[] = (playerRows ?? []).map((player) => ({
    id: String(player.id),
    leagueId: String(league.id),
    slug: String(player.id),
    displayName: typeof player.display_name === "string" ? player.display_name : "Jugador",
    avatarInitials: "",
  }))
  const playerNameById = new Map(profiles.map((player) => [player.id, player.displayName]))
  const seasonPlayers: SeasonPlayer[] = rosterRows.map((item) => ({
    seasonId: String(season.id),
    playerId: String(item.player_id),
    status: item.status === "withdrawn" ? "withdrawn" : "active",
    joinedFromRound: typeof item.joined_from_round === "number" ? item.joined_from_round : null,
    replacedFromRound: typeof item.replaced_from_round === "number" ? item.replaced_from_round : null,
  }))
  const allMatches = (rawMatches ?? []).map((row) => mapSupabaseMatch(row as Record<string, unknown>))
  const phase = getPreseasonAccessPhase({
    status: season.status === "active" || season.status === "finished" ? season.status : "upcoming",
    scheduledStartAt: typeof settings?.scheduled_start_at === "string" ? settings.scheduled_start_at : null,
    secretDaysBefore: typeof settings?.preseason_secret_days_before === "number" ? settings.preseason_secret_days_before : null,
  })
  const calendarIsProgressive = settings?.calendar_visibility_mode === "progressive"
  const effectiveRevealedRound = getEffectiveRevealedThroughRound({
    seasonStatus: season.status === "active" || season.status === "finished" ? season.status : "upcoming",
    totalRounds: Number(season.total_rounds) || 0,
    settings: {
      openingRoundEnabled: Boolean(settings?.opening_round_enabled),
      openingRoundAt: typeof settings?.opening_round_at === "string" ? settings.opening_round_at : null,
      roundWindowMode: settings?.round_window_mode === "fixed-days" ? "fixed-days" : "none",
      seasonStartsAt: typeof settings?.season_starts_at === "string" ? settings.season_starts_at : null,
      roundWindowDays: typeof settings?.round_window_days === "number" ? settings.round_window_days : null,
      calendarVisibilityMode: calendarIsProgressive ? "progressive" : "full",
      revealedThroughRound: Number(settings?.revealed_through_round) || 0,
    },
    matches: allMatches,
  })
  const seasonNotStarted = season.status === "upcoming" && phase !== "active"
  const locked = phase === "locked" || (seasonNotStarted && phase !== "secrets")
  const revealNames = season.status === "finished" || phase === "active"
  const safeMatches = locked ? [] : allMatches.map((match) => {
    const isProgressiveHidden = calendarIsProgressive && match.round > effectiveRevealedRound
    const revealMatchDetails = revealNames && !isProgressiveHidden
    const isOpeningPreview = phase === "secrets" && match.round === 1
    return sanitizePublicSpectatorMatch({
      match,
      playerNameById,
      revealParticipants: revealMatchDetails,
      revealSchedule: revealMatchDetails || isOpeningPreview,
    })
  })
  const rankingMatches = revealNames
    ? allMatches.filter((match) => !calendarIsProgressive || match.round <= effectiveRevealedRound)
    : []
  const ranking = buildPublicSpectatorRanking({
    seasonId: String(season.id),
    players: profiles,
    seasonPlayers,
    matches: rankingMatches,
  })

  return applyPrivateNoStore(NextResponse.json({
    league: { name: league.name, description: league.description ?? "", logoUrl: league.logo_url ?? null, accentColor: league.accent_color ?? null },
    appearance: DEFAULT_SPECTATOR_INVITE_APPEARANCE,
    season: { name: season.name, status: season.status, totalRounds: Number(season.total_rounds) || 0, completedRounds: Number(season.completed_rounds) || 0 },
    seasonId: String(season.id),
    seasons: availableSeasons,
    ranking,
    matches: safeMatches,
    visibility: locked ? "locked" : phase === "secrets" ? "secrets" : calendarIsProgressive ? "progressive" : "full",
  }))
}
