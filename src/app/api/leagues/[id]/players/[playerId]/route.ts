import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdatePlayerBody = {
  displayName?: unknown
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
  { params }: { params: Promise<{ id: string; playerId: string }> },
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

  if (typeof body?.displayName !== "string") {
    return NextResponse.json(
      { error: "invalid_display_name" },
      { status: 400 },
    )
  }

  const { supabase, user, membership } = access.actor
  const isAdmin =
    user.isSuperuser ||
    membership?.role === "creator" ||
    membership?.role === "admin"

  if (!isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const displayName = cleanString(body.displayName)

  if (!displayName) {
    return NextResponse.json(
      { error: "invalid_display_name" },
      { status: 400 },
    )
  }

  const { data: existingPlayer, error: existingPlayerError } = await supabase
    .from("players")
    .select("id,display_name")
    .eq("league_id", leagueId)
    .eq("id", playerId)
    .maybeSingle()

  if (existingPlayerError || !existingPlayer) {
    return NextResponse.json({ error: "player_lookup_failed" }, { status: 500 })
  }

  const { data: player, error: playerUpdateError } = await supabase
    .from("players")
    .update({
      display_name: displayName,
      avatar_initials: getInitials(displayName),
    })
    .eq("league_id", leagueId)
    .eq("id", playerId)
    .select("id,display_name,avatar_initials")
    .single()

  if (playerUpdateError) {
    return NextResponse.json({ error: "player_update_failed" }, { status: 500 })
  }

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

  return NextResponse.json({
    playerId: player.id,
    displayName: player.display_name,
    avatarInitials: player.avatar_initials,
  })
}
