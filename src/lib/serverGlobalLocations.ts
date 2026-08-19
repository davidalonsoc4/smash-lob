import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isMissingPersonalLocationColumnsError } from "@/lib/serverPersonalLocationSchema"
import {
  createScheduledLeagueLocationValue,
  getLeagueLocationIdentityKey,
  getScheduleLocationDisplayText,
  normalizeLeagueLocation,
  normalizeLeagueLocations,
  sortLeagueLocationsByOptionLabel,
  type LeagueLocation,
} from "@/lib/leagueLocations"
type GlobalLocationRow = {
  id: string
  canonical_key: string
  name: string
  town: string | null
  address: string | null
  court_count: number | null
  google_place_id: string | null
  google_place_name: string | null
  google_maps_url: string | null
  latitude: number | null
  longitude: number | null
}
type SupabaseErrorLike = {
  code?: string | null
  message?: string | null
}
const globalLocationSelect =
  "id,canonical_key,name,town,address,court_count,google_place_id,google_place_name,google_maps_url,latitude,longitude"
function isMissingGlobalLocationsTable(error: SupabaseErrorLike | null | undefined) {
  if (!error) return false
  const code = error.code ?? ""
  const message = error.message?.toLowerCase() ?? ""
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    (message.includes("padel_locations") &&
      (message.includes("does not exist") || message.includes("schema cache")))
  )
}
function mapGlobalLocationRow(row: GlobalLocationRow): LeagueLocation {
  return {
    id: row.id,
    name: row.name,
    town: row.town,
    address: row.address,
    detail: null,
    courtCount: row.court_count,
    selectedCourt: null,
    googlePlaceId: row.google_place_id,
    googlePlaceName: row.google_place_name,
    googleMapsUrl: row.google_maps_url,
    latitude: row.latitude,
    longitude: row.longitude,
  }
}
function toGlobalLocationRow(location: LeagueLocation) {
  return {
    canonical_key: getLeagueLocationIdentityKey(location),
    name: location.name,
    town: location.town ?? null,
    address: location.address ?? null,
    court_count: location.courtCount ?? null,
    google_place_id: location.googlePlaceId ?? null,
    google_place_name: location.googlePlaceName ?? null,
    google_maps_url: location.googleMapsUrl ?? null,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
  }
}
function mergeLocations(...groups: LeagueLocation[][]) {
  const locationsByKey = new Map<string, LeagueLocation>()
  for (const group of groups) {
    for (const location of group) {
      const key = getLeagueLocationIdentityKey(location)
      const existing = locationsByKey.get(key)
      locationsByKey.set(key, existing ? { ...location, id: existing.id } : location)
    }
  }
  return sortLeagueLocationsByOptionLabel(Array.from(locationsByKey.values()))
}
async function loadLegacyLocations(supabase: SupabaseClient) {
  const [leaguesResult, personalMatchesResult] = await Promise.all([
    supabase.from("leagues").select("locations"),
    supabase
      .from("personal_matches")
      .select("location_name")
      .not("location_name", "is", null),
  ])
  if (leaguesResult.error || personalMatchesResult.error) {
    throw new Error("global_locations_legacy_lookup_failed")
  }
  const leagueLocations = mergeLocations(
    ...(leaguesResult.data ?? []).map((league) =>
      normalizeLeagueLocations(league.locations),
    ),
  )
  const personalLocations = normalizeLeagueLocations(
    (personalMatchesResult.data ?? []).flatMap((match) =>
      typeof match.location_name === "string" && match.location_name.trim()
        ? [match.location_name]
        : [],
    ),
  )
  return mergeLocations(leagueLocations, personalLocations)
}
export async function saveGlobalLocations(
  supabase: SupabaseClient,
  values: unknown,
) {
  const locations = normalizeLeagueLocations(values)
  if (locations.length === 0) {
    return [] as LeagueLocation[]
  }
  const payload = locations.map(toGlobalLocationRow)
  const { data, error } = await supabase
    .from("padel_locations")
    .upsert(payload, { onConflict: "canonical_key" })
    .select(globalLocationSelect)
  if (error) {
    if (isMissingGlobalLocationsTable(error)) {
      return locations
    }
    throw new Error("global_locations_save_failed")
  }
  return sortLeagueLocationsByOptionLabel(
    ((data ?? []) as GlobalLocationRow[]).map(mapGlobalLocationRow),
  )
}
export async function saveGlobalLocation(
  supabase: SupabaseClient,
  value: unknown,
) {
  const location = normalizeLeagueLocation(value)
  if (!location) {
    throw new Error("invalid_global_location")
  }
  const saved = await saveGlobalLocations(supabase, [location])
  return saved[0] ?? location
}
export async function listGlobalLocations(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("padel_locations")
    .select(globalLocationSelect)
    .order("name", { ascending: true })

  if (error && !isMissingGlobalLocationsTable(error)) {
    throw new Error("global_locations_lookup_failed")
  }

  // Compatibility only for databases that have not received the catalog migration yet.
  // Once padel_locations exists it is the single source of truth and is never rebuilt
  // from league or match text.
  if (error && isMissingGlobalLocationsTable(error)) {
    return loadLegacyLocations(supabase)
  }

  return sortLeagueLocationsByOptionLabel(
    ((data ?? []) as GlobalLocationRow[]).map(mapGlobalLocationRow),
  )
}

export type ManagedGlobalLocationUsageItem = {
  source: "league" | "friendly"
  matchId: string
  leagueId: string | null
  leagueName: string | null
  seasonId: string | null
  seasonName: string | null
  round: number | null
  scheduledAt: string | null
  status: string
  players: string[]
  isFuture: boolean
  href: string
}

export type ManagedGlobalLocation = LeagueLocation & {
  usage: {
    leagueCount: number
    personalMatchCount: number
    matchCount: number
    items: ManagedGlobalLocationUsageItem[]
  }
}

function normalizedUsageName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-ES")
    .replace(/\s+/g, " ")
}

function locationMatchesStoredValue(location: LeagueLocation, value: unknown) {
  if (typeof value !== "string" || !value.trim()) return false
  const parsed = normalizeLeagueLocation(value)
  if (parsed && value.trim().startsWith("{")) {
    return getLeagueLocationIdentityKey(parsed) === getLeagueLocationIdentityKey(location)
  }
  const clean = normalizedUsageName(value)
  const candidates = [
    location.name,
    location.town ? `${location.town} - ${location.name}` : null,
  ]
    .filter((item): item is string => Boolean(item))
    .map(normalizedUsageName)
  return candidates.includes(clean)
}

async function loadManagedLocationUsage(supabase: SupabaseClient) {
  const [
    leaguesResult,
    personalMatchesResult,
    personalParticipantsResult,
    leagueMatchesResult,
    seasonsResult,
    playersResult,
  ] = await Promise.all([
    supabase.from("leagues").select("id,name,locations"),
    supabase
      .from("personal_matches")
      .select("id,played_at,status,location_id,location_name,location_snapshot"),
    supabase
      .from("personal_match_participants")
      .select("match_id,display_name"),
    supabase
      .from("matches")
      .select("id,league_id,season_id,round,status,scheduled_at,location,team_a,team_b"),
    supabase.from("seasons").select("id,name"),
    supabase.from("players").select("id,display_name"),
  ])

  let personalMatches = personalMatchesResult.data ?? []
  if (isMissingPersonalLocationColumnsError(personalMatchesResult.error)) {
    const fallbackPersonalMatches = await supabase
      .from("personal_matches")
      .select("id,played_at,status,location_name")
    if (fallbackPersonalMatches.error) {
      throw new Error("global_locations_usage_lookup_failed")
    }
    personalMatches = (fallbackPersonalMatches.data ?? []).map((match) => ({
      ...match,
      location_id: null,
      location_snapshot: null,
    }))
  } else if (personalMatchesResult.error) {
    throw new Error("global_locations_usage_lookup_failed")
  }

  if (
    leaguesResult.error ||
    personalParticipantsResult.error ||
    leagueMatchesResult.error ||
    seasonsResult.error ||
    playersResult.error
  ) {
    throw new Error("global_locations_usage_lookup_failed")
  }

  const leagues = leaguesResult.data ?? []
  const leagueById = new Map(leagues.map((league) => [String(league.id), league]))
  const seasonNameById = new Map(
    (seasonsResult.data ?? []).map((season) => [String(season.id), String(season.name)]),
  )
  const playerNameById = new Map(
    (playersResult.data ?? []).map((player) => [String(player.id), String(player.display_name)]),
  )
  const personalNamesByMatchId = new Map<string, string[]>()
  for (const row of personalParticipantsResult.data ?? []) {
    const matchId = String(row.match_id)
    const current = personalNamesByMatchId.get(matchId) ?? []
    if (typeof row.display_name === "string" && row.display_name.trim()) {
      current.push(row.display_name.trim())
    }
    personalNamesByMatchId.set(matchId, current)
  }

  return { leagues, leagueById, seasonNameById, playerNameById, personalNamesByMatchId,
    personalMatches, leagueMatches: leagueMatchesResult.data ?? [] }
}

export async function listManagedGlobalLocations(
  supabase: SupabaseClient,
): Promise<ManagedGlobalLocation[]> {
  const [locations, usageData] = await Promise.all([
    listGlobalLocations(supabase),
    loadManagedLocationUsage(supabase),
  ])
  const now = Date.now()

  return locations.map((location) => {
    const configuredLeagueIds = new Set<string>()
    for (const league of usageData.leagues) {
      if (
        normalizeLeagueLocations(league.locations).some(
          (candidate) =>
            getLeagueLocationIdentityKey(candidate) ===
            getLeagueLocationIdentityKey(location),
        )
      ) {
        configuredLeagueIds.add(String(league.id))
      }
    }

    const items: ManagedGlobalLocationUsageItem[] = []
    let personalMatchCount = 0

    for (const match of usageData.personalMatches) {
      const snapshot = normalizeLeagueLocation(match.location_snapshot)
      const matchesById = match.location_id === location.id
      const matchesBySnapshot = snapshot
        ? getLeagueLocationIdentityKey(snapshot) === getLeagueLocationIdentityKey(location)
        : false
      const matchesLegacy = !match.location_id && !snapshot
        ? locationMatchesStoredValue(location, match.location_name)
        : false
      if (!matchesById && !matchesBySnapshot && !matchesLegacy) continue

      personalMatchCount += 1
      const scheduledAt = typeof match.played_at === "string" ? match.played_at : null
      const status = typeof match.status === "string" ? match.status : "scheduled"
      items.push({
        source: "friendly",
        matchId: String(match.id),
        leagueId: null,
        leagueName: null,
        seasonId: null,
        seasonName: null,
        round: null,
        scheduledAt,
        status,
        players: usageData.personalNamesByMatchId.get(String(match.id)) ?? [],
        isFuture: status !== "finished" && Boolean(scheduledAt && Date.parse(scheduledAt) >= now),
        href: `/personal-matches/${String(match.id)}`,
      })
    }

    for (const match of usageData.leagueMatches) {
      if (!locationMatchesStoredValue(location, match.location)) continue
      const leagueId = typeof match.league_id === "string" ? match.league_id : null
      const seasonId = typeof match.season_id === "string" ? match.season_id : null
      const scheduledAt = typeof match.scheduled_at === "string" ? match.scheduled_at : null
      const status = typeof match.status === "string" ? match.status : "scheduling"
      const playerIds = [
        ...(Array.isArray(match.team_a) ? match.team_a : []),
        ...(Array.isArray(match.team_b) ? match.team_b : []),
      ].filter((item): item is string => typeof item === "string")
      const league = leagueId ? usageData.leagueById.get(leagueId) : null
      items.push({
        source: "league",
        matchId: String(match.id),
        leagueId,
        leagueName: typeof league?.name === "string" ? league.name : null,
        seasonId,
        seasonName: seasonId ? usageData.seasonNameById.get(seasonId) ?? null : null,
        round: typeof match.round === "number" ? match.round : null,
        scheduledAt,
        status,
        players: playerIds.map((playerId) => usageData.playerNameById.get(playerId) ?? "Jugador"),
        isFuture: status !== "finished" && (!scheduledAt || Date.parse(scheduledAt) >= now),
        href: `/match/${String(match.id)}`,
      })
    }

    items.sort((left, right) => {
      if (left.isFuture !== right.isFuture) return left.isFuture ? -1 : 1
      return (Date.parse(right.scheduledAt ?? "") || 0) - (Date.parse(left.scheduledAt ?? "") || 0)
    })

    return {
      ...location,
      usage: {
        leagueCount: configuredLeagueIds.size,
        personalMatchCount,
        matchCount: items.length,
        items,
      },
    }
  })
}

export async function deleteGlobalLocation(
  supabase: SupabaseClient,
  locationId: string,
) {
  const locations = await listManagedGlobalLocations(supabase)
  const location = locations.find((item) => item.id === locationId)
  if (!location) return { ok: false as const, reason: "not_found" as const }

  // Remove the location from every league's configurable list. Match snapshots are
  // intentionally left untouched so historical records retain their location.
  const leaguesResult = await supabase.from("leagues").select("id,locations")
  if (leaguesResult.error) throw new Error("global_location_delete_league_lookup_failed")
  for (const league of leaguesResult.data ?? []) {
    const currentLocations = normalizeLeagueLocations(league.locations)
    const nextLocations = currentLocations.filter(
      (candidate) =>
        getLeagueLocationIdentityKey(candidate) !== getLeagueLocationIdentityKey(location),
    )
    if (nextLocations.length === currentLocations.length) continue
    const { error: updateError } = await supabase
      .from("leagues")
      .update({ locations: nextLocations })
      .eq("id", league.id)
    if (updateError) throw new Error("global_location_delete_league_update_failed")
  }

  const { error } = await supabase
    .from("padel_locations")
    .delete()
    .eq("id", locationId)
  if (error) throw new Error("global_location_delete_failed")
  return { ok: true as const, location }
}

export async function changeManagedLocationUsage(
  supabase: SupabaseClient,
  input: { source: "league" | "friendly"; matchId: string; locationId: string },
) {
  const locations = await listGlobalLocations(supabase)
  const location = locations.find((item) => item.id === input.locationId)
  if (!location) return { ok: false as const, reason: "location_not_found" as const }

  if (input.source === "league") {
    const { data, error } = await supabase
      .from("matches")
      .select("id,status,scheduled_at")
      .eq("id", input.matchId)
      .maybeSingle()
    if (error) throw new Error("global_location_usage_lookup_failed")
    if (!data) return { ok: false as const, reason: "not_found" as const }
    if (
      data.status === "finished" ||
      (typeof data.scheduled_at === "string" && Date.parse(data.scheduled_at) < Date.now())
    ) {
      return { ok: false as const, reason: "finished" as const }
    }
    const update = await supabase
      .from("matches")
      .update({ location: createScheduledLeagueLocationValue(location, null) })
      .eq("id", input.matchId)
    if (update.error) throw new Error("global_location_usage_change_failed")
    return { ok: true as const }
  }

  const { data, error } = await supabase
    .from("personal_matches")
    .select("id,status,played_at")
    .eq("id", input.matchId)
    .maybeSingle()
  if (error) throw new Error("global_location_usage_lookup_failed")
  if (!data) return { ok: false as const, reason: "not_found" as const }
  if (
    data.status === "finished" ||
    (typeof data.played_at === "string" && Date.parse(data.played_at) < Date.now())
  ) {
    return { ok: false as const, reason: "finished" as const }
  }
  const snapshot = { ...location, selectedCourt: null, detail: null }
  const locationName = getScheduleLocationDisplayText(snapshot)
  const update = await supabase
    .from("personal_matches")
    .update({
      location_id: location.id,
      location_court: null,
      location_snapshot: snapshot,
      location_name: locationName,
    })
    .eq("id", input.matchId)
  if (update.error && isMissingPersonalLocationColumnsError(update.error)) {
    const legacyUpdate = await supabase
      .from("personal_matches")
      .update({ location_name: locationName })
      .eq("id", input.matchId)
    if (legacyUpdate.error) throw new Error("global_location_usage_change_failed")
    return { ok: true as const }
  }
  if (update.error) throw new Error("global_location_usage_change_failed")
  return { ok: true as const }
}

export async function clearManagedLocationUsage(
  supabase: SupabaseClient,
  input: { source: "league" | "friendly"; matchId: string },
) {
  if (input.source === "league") {
    const { data, error } = await supabase
      .from("matches")
      .select("id,status,scheduled_at")
      .eq("id", input.matchId)
      .maybeSingle()
    if (error) throw new Error("global_location_usage_lookup_failed")
    if (!data) return { ok: false as const, reason: "not_found" as const }
    if (
      data.status === "finished" ||
      (typeof data.scheduled_at === "string" && Date.parse(data.scheduled_at) < Date.now())
    ) {
      return { ok: false as const, reason: "finished" as const }
    }
    const update = await supabase.from("matches").update({ location: null }).eq("id", input.matchId)
    if (update.error) throw new Error("global_location_usage_clear_failed")
    return { ok: true as const }
  }

  const { data, error } = await supabase
    .from("personal_matches")
    .select("id,status,played_at")
    .eq("id", input.matchId)
    .maybeSingle()
  if (error) throw new Error("global_location_usage_lookup_failed")
  if (!data) return { ok: false as const, reason: "not_found" as const }
  if (
    data.status === "finished" ||
    (typeof data.played_at === "string" && Date.parse(data.played_at) < Date.now())
  ) {
    return { ok: false as const, reason: "finished" as const }
  }
  const update = await supabase
    .from("personal_matches")
    .update({
      location_id: null,
      location_court: null,
      location_snapshot: null,
      location_name: null,
    })
    .eq("id", input.matchId)
  if (update.error && isMissingPersonalLocationColumnsError(update.error)) {
    const legacyUpdate = await supabase
      .from("personal_matches")
      .update({ location_name: null })
      .eq("id", input.matchId)
    if (legacyUpdate.error) throw new Error("global_location_usage_clear_failed")
    return { ok: true as const }
  }
  if (update.error) throw new Error("global_location_usage_clear_failed")
  return { ok: true as const }
}
