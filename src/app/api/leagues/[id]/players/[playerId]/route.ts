import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import {
  isValidStoredImageUrl,
  normalizeStoredImageUrl,
} from "@/lib/serverImageValidation"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdatePlayerBody = {
  displayName?: unknown
  avatarUrl?: unknown
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "JG"
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: leagueId, playerId } = await params

  if (!validateUuid(leagueId) || !validateUuid(playerId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<UpdatePlayerBody>(request)
  const hasDisplayName = Boolean(body && "displayName" in body)
  const hasAvatarUrl = Boolean(body && "avatarUrl" in body)

  if (!hasDisplayName && !hasAvatarUrl) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const { supabase, user, membership } = access.actor
  const isAdmin =
    user.isSuperuser ||
    membership?.role === "creator" ||
    membership?.role === "admin"
  const isSelfPlayer = membership?.playerId === playerId

  if (hasDisplayName && !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  if (hasAvatarUrl && !isAdmin && !isSelfPlayer) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const updatePayload: Record<string, unknown> = {}
  const { data: existingPlayer, error: existingPlayerError } = await supabase
    .from("players")
    .select("display_name,avatar_url")
    .eq("league_id", leagueId)
    .eq("id", playerId)
    .maybeSingle()

  if (existingPlayerError || !existingPlayer) {
    return NextResponse.json({ error: "player_lookup_failed" }, { status: 500 })
  }

  if (hasDisplayName) {
    if (typeof body?.displayName !== "string") {
      return NextResponse.json(
        { error: "invalid_display_name" },
        { status: 400 }
      )
    }

    const displayName = cleanString(body.displayName)

    if (!displayName) {
      return NextResponse.json(
        { error: "invalid_display_name" },
        { status: 400 }
      )
    }

    updatePayload.display_name = displayName
    updatePayload.avatar_initials = getInitials(displayName)
  }

  const { data: targetMembership, error: targetMembershipError } = await supabase
    .from("league_memberships")
    .select("user_id")
    .eq("league_id", leagueId)
    .eq("player_id", playerId)
    .maybeSingle()

  if (targetMembershipError) {
    return NextResponse.json({ error: "player_lookup_failed" }, { status: 500 })
  }

  let responseAvatarUrl: string | null | undefined

  if (hasAvatarUrl) {
    const rawAvatarUrl =
      body?.avatarUrl === null
        ? null
        : typeof body?.avatarUrl === "string"
          ? body.avatarUrl
          : undefined
    const hasInvalidAvatarUrlType =
      body?.avatarUrl !== null && typeof body?.avatarUrl !== "string"

    if (hasInvalidAvatarUrlType || !isValidStoredImageUrl(rawAvatarUrl ?? null)) {
      return NextResponse.json({ error: "invalid_avatar_url" }, { status: 400 })
    }

    const avatarUrl = normalizeStoredImageUrl(rawAvatarUrl)

    if (
      !isAdmin &&
      targetMembership?.user_id &&
      targetMembership.user_id !== user.id
    ) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    if (targetMembership?.user_id) {
      const { error: userError } = await supabase
        .from("app_users")
        .update({ avatar_url: avatarUrl })
        .eq("id", targetMembership.user_id)

      if (userError) {
        return NextResponse.json({ error: "avatar_update_failed" }, { status: 500 })
      }
    }

    updatePayload.avatar_url = targetMembership?.user_id ? null : avatarUrl
    responseAvatarUrl = avatarUrl
  }

  const { data, error } = await supabase
    .from("players")
    .update(updatePayload)
    .eq("league_id", leagueId)
    .eq("id", playerId)
    .select("id,display_name,avatar_initials,avatar_url")
    .single()

  if (error) {
    return NextResponse.json({ error: "player_update_failed" }, { status: 500 })
  }

  if (hasDisplayName) {
    await recordServerActorActivity({
      supabase,
      user,
      membership,
      leagueId,
      type: "player_name_updated",
      title: "Nombre de jugador actualizado",
      description: `${existingPlayer.display_name} ahora se llama ${data.display_name}.`,
      metadata: {
        targetPlayerId: data.id,
        previousDisplayName: existingPlayer.display_name,
        nextDisplayName: data.display_name,
      },
    }).catch(() => null)
  } else if (hasAvatarUrl) {
    const finalAvatarUrl =
      responseAvatarUrl !== undefined
        ? responseAvatarUrl
        : typeof data.avatar_url === "string"
          ? data.avatar_url
          : null

    await recordServerActorActivity({
      supabase,
      user,
      membership,
      leagueId,
      type: "player_avatar_updated",
      title: finalAvatarUrl
        ? "Imagen de perfil actualizada"
        : "Imagen de perfil eliminada",
      description: finalAvatarUrl
        ? `${data.display_name} ha actualizado su imagen de perfil.`
        : `${data.display_name} ha eliminado su imagen de perfil.`,
      metadata: {
        targetPlayerId: data.id,
        targetPlayerName: data.display_name,
        previousHasAvatar: Boolean(existingPlayer.avatar_url),
        hasAvatar: Boolean(finalAvatarUrl),
      },
    }).catch(() => null)
  }

  return NextResponse.json({
    playerId: data.id,
    displayName: data.display_name,
    avatarInitials: data.avatar_initials,
    avatarUrl:
      responseAvatarUrl !== undefined
        ? responseAvatarUrl
        : typeof data.avatar_url === "string"
          ? data.avatar_url
          : null,
    userId: targetMembership?.user_id ?? null,
  })
}
