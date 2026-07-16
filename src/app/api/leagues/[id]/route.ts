import { NextResponse } from "next/server"
import { normalizeLeagueLocations } from "@/lib/leagueLocations"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import {
  isValidStoredImageUrl,
  normalizeStoredImageUrl,
} from "@/lib/serverImageValidation"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdateLeagueBody = {
  name?: unknown
  description?: unknown
  logoUrl?: unknown
  locations?: unknown
  statusColorsEnabled?: unknown
  showRankingAvatars?: unknown
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params

  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<UpdateLeagueBody>(request)
  const updatePayload: Record<string, unknown> = {}
  const hasName = Boolean(body && "name" in body)
  const hasDescription = Boolean(body && "description" in body)
  const hasLogoUrl = Boolean(body && "logoUrl" in body)
  const hasLocations = Boolean(body && "locations" in body)
  const hasInvalidLogoUrlType =
    hasLogoUrl && body?.logoUrl !== null && typeof body?.logoUrl !== "string"
  const name = hasName ? cleanString(body?.name) : undefined
  const description = hasDescription ? cleanString(body?.description) : undefined
  const rawLogoUrl =
    hasLogoUrl && body?.logoUrl !== null && typeof body?.logoUrl === "string"
      ? body.logoUrl
      : body?.logoUrl === null
        ? null
        : undefined
  const logoUrl =
    rawLogoUrl === undefined ? undefined : normalizeStoredImageUrl(rawLogoUrl)
  const locations = hasLocations ? normalizeLeagueLocations(body?.locations) : undefined
  const statusColorsEnabled =
    body && "statusColorsEnabled" in body
      ? body.statusColorsEnabled
      : undefined
  const showRankingAvatars =
    body && "showRankingAvatars" in body
      ? body.showRankingAvatars
      : undefined

  if (hasName) {
    if (typeof body?.name !== "string" || !name) {
      return NextResponse.json({ error: "invalid_name" }, { status: 400 })
    }

    updatePayload.name = name
  }

  if (hasDescription) {
    if (typeof body?.description !== "string") {
      return NextResponse.json(
        { error: "invalid_description" },
        { status: 400 }
      )
    }

    updatePayload.description = description
  }

  if (hasLogoUrl) {
    if (hasInvalidLogoUrlType || !isValidStoredImageUrl(rawLogoUrl ?? null)) {
      return NextResponse.json({ error: "invalid_logo_url" }, { status: 400 })
    }

    updatePayload.logo_url = logoUrl
  }

  if (hasLocations) {
    if (!Array.isArray(body?.locations) && typeof body?.locations !== "string") {
      return NextResponse.json({ error: "invalid_locations" }, { status: 400 })
    }

    updatePayload.locations = locations
  }

  if (statusColorsEnabled !== undefined) {
    if (typeof statusColorsEnabled !== "boolean") {
      return NextResponse.json(
        { error: "invalid_status_colors_enabled" },
        { status: 400 }
      )
    }

    updatePayload.status_colors_enabled = statusColorsEnabled
  }

  if (showRankingAvatars !== undefined) {
    if (typeof showRankingAvatars !== "boolean") {
      return NextResponse.json(
        { error: "invalid_show_ranking_avatars" },
        { status: 400 }
      )
    }

    updatePayload.show_ranking_avatars = showRankingAvatars
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const { supabase } = access.actor
  const shouldTrackActivity = hasName || hasDescription || hasLogoUrl || hasLocations

  const { data: previousLeague, error: previousLeagueError } =
    shouldTrackActivity
      ? await supabase
          .from("leagues")
          .select("name,description,logo_url,locations,active_season_id")
          .eq("id", leagueId)
          .maybeSingle()
      : { data: null, error: null }

  if (previousLeagueError) {
    return NextResponse.json({ error: "league_lookup_failed" }, { status: 500 })
  }

  try {
    const { data, error } = await supabase
      .from("leagues")
      .update(updatePayload)
      .eq("id", leagueId)
      .select(
        "id,name,description,logo_url,locations,status_colors_enabled,show_ranking_avatars,active_season_id"
      )
      .single()

    if (error) {
      throw error
    }

    if (hasName || hasDescription) {
      await recordServerActorActivity({
        supabase,
        user: access.actor.user,
        membership: access.actor.membership,
        leagueId,
        seasonId:
          typeof data.active_season_id === "string" ? data.active_season_id : null,
        type: "league_updated",
        title: "Datos de liga actualizados",
        description:
          hasName && previousLeague?.name !== data.name
            ? `La liga ha pasado a llamarse ${data.name}.`
            : "Se han actualizado los datos de la liga.",
        metadata: {
          previousName: previousLeague?.name ?? null,
          nextName: data.name,
          previousDescription: previousLeague?.description ?? "",
          nextDescription: data.description ?? "",
        },
      }).catch(() => null)
    } else if (hasLogoUrl) {
      await recordServerActorActivity({
        supabase,
        user: access.actor.user,
        membership: access.actor.membership,
        leagueId,
        seasonId:
          typeof data.active_season_id === "string" ? data.active_season_id : null,
        type: "league_logo_updated",
        title:
          typeof data.logo_url === "string"
            ? "Logo de liga actualizado"
            : "Logo de liga eliminado",
        description:
          typeof data.logo_url === "string"
            ? "Se ha actualizado el logo de la liga."
            : "Se ha eliminado el logo personalizado de la liga.",
        metadata: {
          hadPreviousLogo: Boolean(previousLeague?.logo_url),
          hasLogo: typeof data.logo_url === "string",
        },
      }).catch(() => null)
    } else if (hasLocations) {
      const nextLocations = normalizeLeagueLocations(data.locations)

      await recordServerActorActivity({
        supabase,
        user: access.actor.user,
        membership: access.actor.membership,
        leagueId,
        seasonId:
          typeof data.active_season_id === "string" ? data.active_season_id : null,
        type: "league_locations_updated",
        title: "Lugares actualizados",
        description: `La liga tiene ${nextLocations.length} lugar${nextLocations.length === 1 ? "" : "es"} habitual${nextLocations.length === 1 ? "" : "es"}.`,
        metadata: {
          previousLocations: normalizeLeagueLocations(previousLeague?.locations),
          nextLocations,
        },
      }).catch(() => null)
    }

    return NextResponse.json({
      leagueId: data.id,
      name: data.name,
      description: data.description ?? "",
      logoUrl: typeof data.logo_url === "string" ? data.logo_url : null,
      locations: normalizeLeagueLocations(data.locations),
      statusColorsEnabled: data.status_colors_enabled !== false,
      showRankingAvatars: data.show_ranking_avatars !== false,
    })
  } catch {
    return NextResponse.json({ error: "league_update_failed" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params

  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { supabase, user, membership } = access.actor
  const canDelete = user.isSuperuser || membership?.role === "creator"

  if (!canDelete) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  try {
    const { error } = await supabase.rpc("server_delete_league", {
      p_league_id: leagueId,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ leagueId })
  } catch {
    return NextResponse.json({ error: "league_delete_failed" }, { status: 500 })
  }
}
