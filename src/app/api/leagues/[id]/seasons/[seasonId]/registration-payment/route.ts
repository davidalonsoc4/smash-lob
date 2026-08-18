import { NextResponse } from "next/server"
import {
  ensureSeasonRegistrationPlayers,
  normalizeSeasonRegistrationFee,
  setSeasonRegistrationPaymentPaidStatus,
} from "@/lib/seasonRegistration"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { requireMutableSeasonForActor } from "@/lib/serverSeasonAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = {
  playerId?: unknown
  isPaid?: unknown
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonId: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "season_registration_payment_update",
    limit: 30,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const { id: leagueId, seasonId } = await params
  const body = await parseJsonBody<Body>(request)
  const playerId = typeof body?.playerId === "string" ? body.playerId : ""
  const isPaid = body?.isPaid

  if (
    !validateUuid(leagueId) ||
    !validateUuid(seasonId) ||
    !validateUuid(playerId) ||
    typeof isPaid !== "boolean"
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { actor } = access
  const hasAdminRole =
    actor.user.isSuperuser ||
    actor.membership?.role === "creator" ||
    actor.membership?.role === "admin"

  if (!hasAdminRole && actor.membership?.playerId !== playerId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const mutable = await requireMutableSeasonForActor(actor, seasonId, leagueId)
  if (!mutable.ok) {
    return NextResponse.json({ error: mutable.error }, { status: mutable.status })
  }

  const [{ data: seasonPlayers, error: seasonPlayersError }, settingsResult] =
    await Promise.all([
      actor.supabase
        .from("season_players")
        .select("player_id")
        .eq("season_id", seasonId),
      actor.supabase
        .from("season_settings")
        .select("registration_fee")
        .eq("league_id", leagueId)
        .eq("season_id", seasonId)
        .maybeSingle(),
    ])

  if (seasonPlayersError || settingsResult.error) {
    return NextResponse.json(
      { error: "season_registration_payment_lookup_failed" },
      { status: 500 },
    )
  }

  const playerIds = (seasonPlayers ?? [])
    .map((row) => row.player_id)
    .filter((value): value is string => typeof value === "string")

  if (!playerIds.includes(playerId)) {
    return NextResponse.json({ error: "season_player_not_found" }, { status: 404 })
  }

  const currentRegistrationFee = ensureSeasonRegistrationPlayers({
    registrationFee: normalizeSeasonRegistrationFee(
      settingsResult.data?.registration_fee,
    ),
    playerIds,
  })

  if (!currentRegistrationFee.enabled || currentRegistrationFee.amount <= 0) {
    return NextResponse.json(
      { error: "registration_not_enabled" },
      { status: 409 },
    )
  }

  const registrationFee = setSeasonRegistrationPaymentPaidStatus({
    registrationFee: currentRegistrationFee,
    playerId,
    isPaid,
  })

  const { data: updatedSettings, error: updateError } = await actor.supabase
    .from("season_settings")
    .update({ registration_fee: registrationFee })
    .eq("league_id", leagueId)
    .eq("season_id", seasonId)
    .select("registration_fee")
    .maybeSingle()

  if (updateError || !updatedSettings) {
    return NextResponse.json(
      { error: "season_registration_payment_update_failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({
    registrationFee: normalizeSeasonRegistrationFee(
      updatedSettings.registration_fee,
    ),
  })
}
