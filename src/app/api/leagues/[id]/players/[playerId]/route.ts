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

  const { data: existingPlayer, error: existingPlayerError } = await supabase
    .from("players")
    .select("id,display_name,avatar_initials,avatar_url")
    .eq("league_id", leagueId)
    .eq("id", playerId)
    .maybeSingle()

  if (existingPlayerError || !existingPlayer) {
    return NextResponse.json({ error: "player_lookup_failed" }, { status: 500 })
  }

  const { data: targetMembership, error: targetMembershipError } = await supabase
    .from("league_memberships")
    .select("user_id,league_avatar_url")
    .eq("league_id", leagueId)
    .eq("player_id", playerId)
    .maybeSingle()

  if (targetMembershipError) {
    return NextResponse.json({ error: "player_lookup_failed" }, { status: 500 })
  }

  const updatePayload: Record<string, unknown> = {}

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

  let requestedAvatarUrl: string | null | undefined
  let linkedAccountAvatarUrl: string | null = null
  let leagueAvatarUrl =
    typeof targetMembership?.league_avatar_url === "string"
      ? targetMembership.league_avatar_url
      : null

  if (targetMembership?.user_id) {
    const { data: linkedUser, error: linkedUserError } = await supabase
      .from("app_users")
      .select("avatar_url")
      .eq("id", targetMembership.user_id)
      .maybeSingle()

    if (linkedUserError) {
      return NextResponse.json({ error: "avatar_lookup_failed" }, { status: 500 })
    }

    linkedAccountAvatarUrl =
      typeof linkedUser?.avatar_url === "string" ? linkedUser.avatar_url : null
  }

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

    requestedAvatarUrl = normalizeStoredImageUrl(rawAvatarUrl)

    if (
      !isAdmin &&
      targetMembership?.user_id &&
      targetMembership.user_id !== user.id
    ) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    if (targetMembership?.user_id) {
      const { error: membershipAvatarError } = await supabase
        .from("league_memberships")
        .update({ league_avatar_url: requestedAvatarUrl })
        .eq("league_id", leagueId)
        .eq("player_id", playerId)
        .eq("user_id", targetMembership.user_id)

      if (membershipAvatarError) {
        return NextResponse.json({ error: "avatar_update_failed" }, { status: 500 })
      }

      leagueAvatarUrl = requestedAvatarUrl
    } else {
      updatePayload.avatar_url = requestedAvatarUrl
    }
  }

  let player = existingPlayer

  if (Object.keys(updatePayload).length > 0) {
    const { data: updatedPlayer, error: playerUpdateError } = await supabase
      .from("players")
      .update(updatePayload)
      .eq("league_id", leagueId)
      .eq("id", playerId)
      .select("id,display_name,avatar_initials,avatar_url")
      .single()

    if (playerUpdateError) {
      return NextResponse.json({ error: "player_update_failed" }, { status: 500 })
    }

    player = updatedPlayer
  }

  const effectiveAvatarUrl =
    leagueAvatarUrl ??
    linkedAccountAvatarUrl ??
    (typeof player.avatar_url === "string" ? player.avatar_url : null)

  if (hasDisplayName) {
    await recordServerActorActivity({
      supabase,
      user,
      membership,
      leagueId,
      type: "player_name_updated",
      title: "Nombre de jugador actualizado",
      description: `${existingPlayer.display_name} ahora se llama ${player.display_name}.`,
      metadata: {
        targetPlayerId: player.id,
        previousDisplayName: existingPlayer.display_name,
        nextDisplayName: player.display_name,
      },
    }).catch(() => null)
  } else if (hasAvatarUrl) {
    const isLinkedPlayer = Boolean(targetMembership?.user_id)

    await recordServerActorActivity({
      supabase,
      user,
      membership,
      leagueId,
      type: "player_avatar_updated",
      title: requestedAvatarUrl
        ? isLinkedPlayer
          ? "Avatar de liga actualizado"
          : "Imagen de jugador actualizada"
        : isLinkedPlayer
          ? "Avatar de liga eliminado"
          : "Imagen de jugador eliminada",
      description: requestedAvatarUrl
        ? isLinkedPlayer
          ? `${player.display_name} ha actualizado su avatar en esta liga.`
          : `${player.display_name} ha actualizado su imagen.`
        : isLinkedPlayer
          ? `${player.display_name} ha recuperado la imagen predeterminada de su cuenta en esta liga.`
          : `${player.display_name} ha recuperado el avatar predeterminado.`,
      metadata: {
        targetPlayerId: player.id,
        targetPlayerName: player.display_name,
        previousHasAvatar: Boolean(
          targetMembership?.league_avatar_url ??
            linkedAccountAvatarUrl ??
            existingPlayer.avatar_url
        ),
        hasLeagueAvatar: Boolean(leagueAvatarUrl),
        hasAvatar: Boolean(effectiveAvatarUrl),
      },
    }).catch(() => null)
  }

  return NextResponse.json({
    playerId: player.id,
    displayName: player.display_name,
    avatarInitials: player.avatar_initials,
    avatarUrl: effectiveAvatarUrl,
    leagueAvatarUrl,
    userId: targetMembership?.user_id ?? null,
  })
}
