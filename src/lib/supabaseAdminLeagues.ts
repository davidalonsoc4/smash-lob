import { supabase } from "@/lib/supabase"
import { upsertAppUser } from "@/lib/supabaseUsers"
import { normalizeLeagueLocations, type LeagueLocation } from "@/lib/leagueLocations"

export async function updateSupabaseLeagueDetails({
  leagueId,
  name,
  description,
}: {
  leagueId: string
  name: string
  description: string
}) {
  const cleanName = name.trim()
  const cleanDescription = description.trim()

  if (!cleanName) {
    throw new Error("El nombre de la liga no puede estar vacío")
  }

  const { data, error } = await supabase
    .from("leagues")
    .update({
      name: cleanName,
      description: cleanDescription,
    })
    .eq("id", leagueId)
    .select("id,name,description,logo_url")
    .single()

  if (error) {
    throw error
  }

  return {
    leagueId: data.id,
    name: data.name,
    description: data.description ?? "",
    logoUrl: typeof data.logo_url === "string" ? data.logo_url : null,
  }
}

export async function updateSupabaseLeagueLogo({
  leagueId,
  logoUrl,
}: {
  leagueId: string
  logoUrl: string | null
}) {
  const { data, error } = await supabase
    .from("leagues")
    .update({ logo_url: logoUrl })
    .eq("id", leagueId)
    .select("id,logo_url")
    .single()

  if (error) {
    throw error
  }

  return {
    leagueId: data.id,
    logoUrl: typeof data.logo_url === "string" ? data.logo_url : null,
  }
}

export async function updateSupabaseLeagueLocations({
  leagueId,
  locations,
}: {
  leagueId: string
  locations: LeagueLocation[]
}) {
  const normalizedLocations = normalizeLeagueLocations(locations)

  const { data, error } = await supabase
    .from("leagues")
    .update({ locations: normalizedLocations })
    .eq("id", leagueId)
    .select("id,locations")
    .single()

  if (error) {
    throw error
  }

  return {
    leagueId: data.id,
    locations: normalizeLeagueLocations(data.locations),
  }
}


export async function updateSupabaseLeagueStatusColorsEnabled({
  leagueId,
  enabled,
}: {
  leagueId: string
  enabled: boolean
}) {
  const { data, error } = await supabase
    .from("leagues")
    .update({ status_colors_enabled: enabled })
    .eq("id", leagueId)
    .select("id,status_colors_enabled")
    .single()

  if (error) {
    throw error
  }

  return {
    leagueId: data.id,
    statusColorsEnabled: data.status_colors_enabled !== false,
  }
}

export async function regenerateSupabaseLeagueInviteCode({
  leagueId,
  code,
  email,
  displayName,
}: {
  leagueId: string
  code: string
  email: string
  displayName?: string | null
}) {
  const normalizedCode = code.trim().toUpperCase()
  const user = await upsertAppUser({
    email,
    displayName,
  })

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .update({ invite_code: normalizedCode })
    .eq("id", leagueId)
    .select("id,invite_code")
    .single()

  if (leagueError) {
    throw leagueError
  }

  const { error: inviteError } = await supabase.from("invites").insert({
    league_id: leagueId,
    code: normalizedCode,
    created_by_user_id: user.id,
  })

  if (inviteError) {
    console.warn("No se ha podido guardar el histórico de invitación", inviteError)
  }

  return {
    leagueId: league.id,
    inviteCode: league.invite_code,
  }
}


async function deleteLeagueLocationsIfTableExists(leagueId: string) {
  const { error } = await supabase
    .from("league_locations")
    .delete()
    .eq("league_id", leagueId)

  if (error && error.code !== "42P01") {
    throw error
  }
}

export async function deleteSupabaseLeague({
  leagueId,
  email,
  displayName,
}: {
  leagueId: string
  email: string
  displayName?: string | null
}) {
  const user = await upsertAppUser({
    email,
    displayName,
  })

  const { data: creatorMembership, error: membershipError } = await supabase
    .from("league_memberships")
    .select("id,role")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .eq("role", "creator")
    .maybeSingle()

  if (membershipError) {
    throw membershipError
  }

  if (!creatorMembership) {
    throw new Error("Solo el creador de la liga puede eliminarla")
  }

  const { data: seasons, error: seasonsReadError } = await supabase
    .from("seasons")
    .select("id")
    .eq("league_id", leagueId)

  if (seasonsReadError) {
    throw seasonsReadError
  }

  const seasonIds = (seasons ?? []).map((season) => season.id)

  const { error: clearActiveSeasonError } = await supabase
    .from("leagues")
    .update({ active_season_id: null })
    .eq("id", leagueId)

  if (clearActiveSeasonError) {
    throw clearActiveSeasonError
  }

  const deleteOperations = [
    supabase.from("matches").delete().eq("league_id", leagueId),
    supabase.from("season_settings").delete().eq("league_id", leagueId),
    supabase.from("invites").delete().eq("league_id", leagueId),
    supabase.from("league_memberships").delete().eq("league_id", leagueId),
  ]

  if (seasonIds.length > 0) {
    deleteOperations.push(
      supabase.from("season_players").delete().in("season_id", seasonIds)
    )
  }

  const deleteResults = await Promise.all(deleteOperations)

  for (const result of deleteResults) {
    if (result.error) {
      throw result.error
    }
  }

  await deleteLeagueLocationsIfTableExists(leagueId)

  const { error: playersError } = await supabase
    .from("players")
    .delete()
    .eq("league_id", leagueId)

  if (playersError) {
    throw playersError
  }

  const { error: seasonsError } = await supabase
    .from("seasons")
    .delete()
    .eq("league_id", leagueId)

  if (seasonsError) {
    throw seasonsError
  }

  const { error: leagueError } = await supabase
    .from("leagues")
    .delete()
    .eq("id", leagueId)

  if (leagueError) {
    throw leagueError
  }

  return { leagueId }
}
