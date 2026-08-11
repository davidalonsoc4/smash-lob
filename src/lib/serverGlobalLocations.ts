import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  getLeagueLocationIdentityKey,
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
  const legacyLocations = await loadLegacyLocations(supabase)
  const { data, error } = await supabase
    .from("padel_locations")
    .select(globalLocationSelect)
    .order("name", { ascending: true })
  if (error && !isMissingGlobalLocationsTable(error)) {
    throw new Error("global_locations_lookup_failed")
  }
  if (error && isMissingGlobalLocationsTable(error)) {
    return legacyLocations
  }
  const catalogLocations = ((data ?? []) as GlobalLocationRow[]).map(
    mapGlobalLocationRow,
  )
  const catalogKeys = new Set(
    catalogLocations.map((location) => getLeagueLocationIdentityKey(location)),
  )
  const missingLegacyLocations = legacyLocations.filter(
    (location) => !catalogKeys.has(getLeagueLocationIdentityKey(location)),
  )
  if (missingLegacyLocations.length > 0) {
    const savedLegacyLocations = await saveGlobalLocations(
      supabase,
      missingLegacyLocations,
    ).catch(() => missingLegacyLocations)
    return mergeLocations(catalogLocations, savedLegacyLocations)
  }
  return mergeLocations(catalogLocations)
}
export type ManagedGlobalLocation = LeagueLocation & { usage: { leagueCount: number; personalMatchCount: number } }
function normalizedUsageName(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es-ES").replace(/\s+/g, " ") }
async function loadManagedLocationUsage(supabase: SupabaseClient) {
  const [leaguesResult, personalMatchesResult] = await Promise.all([supabase.from("leagues").select("id,locations"), supabase.from("personal_matches").select("id,location_name").not("location_name", "is", null)])
  if (leaguesResult.error || personalMatchesResult.error) throw new Error("global_locations_usage_lookup_failed")
  const leagueUsage = new Map<string, Set<string>>(); for (const league of leaguesResult.data ?? []) for (const location of normalizeLeagueLocations(league.locations)) { const key = getLeagueLocationIdentityKey(location); const ids = leagueUsage.get(key) ?? new Set<string>(); ids.add(String(league.id)); leagueUsage.set(key, ids) }
  const personalUsage = new Map<string, number>(); for (const match of personalMatchesResult.data ?? []) if (typeof match.location_name === "string" && match.location_name.trim()) { const name = normalizedUsageName(match.location_name); personalUsage.set(name, (personalUsage.get(name) ?? 0) + 1) }
  return { leagueUsage, personalUsage }
}
export async function listManagedGlobalLocations(supabase: SupabaseClient): Promise<ManagedGlobalLocation[]> {
  const [locations, usage] = await Promise.all([listGlobalLocations(supabase), loadManagedLocationUsage(supabase)])
  return locations.map((location) => ({ ...location, usage: { leagueCount: usage.leagueUsage.get(getLeagueLocationIdentityKey(location))?.size ?? 0, personalMatchCount: usage.personalUsage.get(normalizedUsageName(location.name)) ?? 0 } }))
}
export async function deleteGlobalLocation(supabase: SupabaseClient, locationId: string) {
  const locations = await listManagedGlobalLocations(supabase); const location = locations.find((item) => item.id === locationId)
  if (!location) return { ok: false as const, reason: "not_found" as const }
  if (location.usage.leagueCount + location.usage.personalMatchCount > 0) return { ok: false as const, reason: "in_use" as const, usage: location.usage }
  const { error } = await supabase.from("padel_locations").delete().eq("id", locationId); if (error) throw new Error("global_location_delete_failed")
  return { ok: true as const, location }
}
