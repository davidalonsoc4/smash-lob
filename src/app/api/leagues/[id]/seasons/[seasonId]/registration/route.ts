import { NextResponse } from "next/server"
import { getServerLeagueActor, type ServerLeagueActor } from "@/lib/serverLeagueAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import {
  joinSelfRegistrationSeason,
  removeSelfRegistrationPlayer,
} from "@/lib/serverSelfRegistration"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type DeleteBody = {
  playerId?: unknown
}

function getRpcErrorStatus(message: string) {
  if (message.includes("profile_incomplete")) return 409
  if (message.includes("roster_full") || message.includes("registration_closed")) return 409
  if (message.includes("forbidden")) return 403
  if (message.includes("not_found")) return 404
  return 500
}

async function getAdminTargetPlayerIds(
  actor: ServerLeagueActor,
  leagueId: string,
) {
  const { data } = await actor.supabase
    .from("league_memberships")
    .select("player_id,role")
    .eq("league_id", leagueId)
    .in("role", ["creator", "admin"])

  return (data ?? [])
    .map((item) => item.player_id)
    .filter((item): item is string => typeof item === "string")
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; seasonId: string }> },
) {
  const { id: leagueId, seasonId } = await params

  if (!validateUuid(leagueId) || !validateUuid(seasonId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const result = await joinSelfRegistrationSeason({
      actor: access.actor,
      leagueId,
      seasonId,
    })
    const targetPlayerIds = await getAdminTargetPlayerIds(access.actor, leagueId)

    await recordServerActorActivity({
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: result.membership,
      leagueId,
      seasonId,
      type: "season_player_joined",
      title: result.rosterComplete ? "Plantilla completa" : "Nuevo jugador inscrito",
      description: result.rosterComplete
        ? `${access.actor.user.displayName ?? access.actor.user.email} ha ocupado la última plaza. Ya puedes comenzar la temporada.`
        : `${access.actor.user.displayName ?? access.actor.user.email} se ha unido a la temporada.`,
      metadata: {
        playerId: result.playerId,
        registeredCount: result.registeredCount,
        playerCapacity: result.playerCapacity,
        rosterComplete: result.rosterComplete,
        targetPlayerIds,
      },
    }).catch(() => null)

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "self_registration_join_failed"
    return NextResponse.json(
      { error: message },
      { status: getRpcErrorStatus(message) },
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonId: string }> },
) {
  const { id: leagueId, seasonId } = await params

  if (!validateUuid(leagueId) || !validateUuid(seasonId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<DeleteBody>(request)
  const requestedPlayerId = validateUuid(body?.playerId)
  const playerId = requestedPlayerId ?? access.actor.membership?.playerId ?? null

  if (!playerId) {
    return NextResponse.json({ error: "invalid_player" }, { status: 400 })
  }

  try {
    const result = await removeSelfRegistrationPlayer({
      actor: access.actor,
      leagueId,
      seasonId,
      playerId,
    })

    const targetPlayerIds = await getAdminTargetPlayerIds(access.actor, leagueId)

    await recordServerActorActivity({
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: access.actor.membership,
      leagueId,
      seasonId,
      type: "season_player_left",
      title: "Plaza liberada",
      description: "Un jugador ha abandonado la plantilla antes del inicio.",
      metadata: {
        playerId,
        registeredCount: result.registeredCount,
        playerCapacity: result.playerCapacity,
        targetPlayerIds,
      },
    }).catch(() => null)

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "self_registration_remove_failed"
    return NextResponse.json(
      { error: message },
      { status: getRpcErrorStatus(message) },
    )
  }
}
