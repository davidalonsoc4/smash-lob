import { NextResponse } from "next/server"
import { getServerLeagueActor, type ServerLeagueActor } from "@/lib/serverLeagueAccess"
import { requireMutableSeasonForActor } from "@/lib/serverSeasonAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import {
  joinSelfRegistrationSeason,
  removeSelfRegistrationPlayer,
} from "@/lib/serverSelfRegistration"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { assertSeasonWaitlistEligible, joinSeasonWaitlist } from "@/lib/serverSeasonWaitlist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type DeleteBody = {
  playerId?: unknown
}

function getRpcErrorStatus(message: string) {
  if (message.includes("profile_incomplete")) return 409
  if (message.includes("roster_full") || message.includes("registration_closed")) return 409
  if (message.includes("protected_league_manager")) return 409
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

  const mutable = await requireMutableSeasonForActor(access.actor, seasonId, leagueId)
  if (!mutable.ok) return NextResponse.json({ error: mutable.error }, { status: mutable.status })

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
        ? `${access.actor.user.displayName ?? access.actor.user.email} ha ocupado la última plaza. La plantilla ya está completa y el calendario programado puede prepararse.`
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
    if (message.includes("roster_full")) {
      try {
        await assertSeasonWaitlistEligible({ supabase: access.actor.supabase, leagueId, seasonId, userId: access.actor.user.id })
        const entry = await joinSeasonWaitlist({
          supabase: access.actor.supabase,
          leagueId,
          seasonId,
          userId: access.actor.user.id,
        })
        return NextResponse.json({ ok: true, waitlisted: true, entry }, { status: 202 })
      } catch (waitlistError) {
        const code = waitlistError instanceof Error ? waitlistError.message : "waitlist_join_failed"
        return NextResponse.json({ error: code }, { status: code === "waitlist_not_full" || code === "already_registered" || code === "waitlist_not_available" ? 409 : 500 })
      }
    }
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

  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const mutable = await requireMutableSeasonForActor(access.actor, seasonId, leagueId)
  if (!mutable.ok) return NextResponse.json({ error: mutable.error }, { status: mutable.status })

  const body = await parseJsonBody<DeleteBody>(request)
  const playerId = validateUuid(body?.playerId)

  if (!playerId) {
    return NextResponse.json({ error: "invalid_player" }, { status: 400 })
  }

  const { data: targetMembership, error: targetMembershipError } =
    await access.actor.supabase
      .from("league_memberships")
      .select("role")
      .eq("league_id", leagueId)
      .eq("player_id", playerId)
      .maybeSingle()

  if (targetMembershipError) {
    return NextResponse.json(
      { error: "player_membership_lookup_failed" },
      { status: 500 },
    )
  }

  if (
    targetMembership?.role === "creator" ||
    targetMembership?.role === "admin"
  ) {
    return NextResponse.json(
      { error: "protected_league_manager" },
      { status: 409 },
    )
  }

  try {
    const result = await removeSelfRegistrationPlayer({
      actor: access.actor,
      leagueId,
      seasonId,
      playerId,
    })

    const { data: seasonState } = await access.actor.supabase
      .from("seasons")
      .select("status")
      .eq("id", seasonId)
      .eq("league_id", leagueId)
      .maybeSingle()
    const { data: registrationState } = await access.actor.supabase
      .from("season_settings")
      .select("registration_open")
      .eq("season_id", seasonId)
      .maybeSingle()
    const canPromote = seasonState?.status === "upcoming" && registrationState?.registration_open === true
    const { data: nextWaiting } = canPromote
      ? await access.actor.supabase
          .from("season_waitlist")
          .select("id,user_id")
          .eq("league_id", leagueId)
          .eq("season_id", seasonId)
          .eq("status", "waiting")
          .order("position", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle()
      : { data: null }
    if (nextWaiting?.id) {
      const { data: promotedEntry, error: promotionError } = await access.actor.supabase.from("season_waitlist").update({
        status: "promoted",
        promoted_at: new Date().toISOString(),
        confirmation_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      }).eq("id", nextWaiting.id).eq("status", "waiting").select("id,user_id").maybeSingle()

      if (promotionError) throw new Error("waitlist_promotion_failed")
      if (promotedEntry) await recordServerActorActivity({
        supabase: access.actor.supabase,
        user: access.actor.user,
        membership: access.actor.membership,
        leagueId,
        seasonId,
        type: "season_player_joined",
        title: "Tu plaza está disponible",
        description: "Se ha liberado una plaza. Confirma tu incorporación en las próximas 48 horas.",
        metadata: {
          waitlistPromotion: true,
          targetUserIds: [nextWaiting.user_id],
          confirmationExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        },
      }).catch(() => null)
    }

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
