import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ClaimBody = {
  leagueId?: unknown
  playerId?: unknown
}

function normalizeInviteCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : ""
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23505"
  )
}

function toRole(role: unknown) {
  return role === "creator" || role === "admin" || role === "player"
    ? role
    : "player"
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const normalizedCode = normalizeInviteCode(decodeURIComponent(code ?? ""))
  const body = await parseJsonBody<ClaimBody>(request)
  const leagueId = validateUuid(body?.leagueId)
  const playerId = validateUuid(body?.playerId)

  if (!normalizedCode || !leagueId || !playerId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  const {
    supabase,
    user: { id: userId, email },
  } = authResult.actor

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id,invite_code,active_season_id")
    .eq("id", leagueId)
    .maybeSingle()

  if (leagueError) {
    return NextResponse.json({ error: "league_lookup_failed" }, { status: 500 })
  }

  if (!league) {
    return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
  }

  const activeCodeMatches = normalizeInviteCode(league.invite_code) === normalizedCode

  if (!activeCodeMatches) {
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("league_id")
      .eq("league_id", leagueId)
      .eq("code", normalizedCode)
      .is("revoked_at", null)
      .maybeSingle()

    if (inviteError) {
      return NextResponse.json(
        { error: "invite_lookup_failed" },
        { status: 500 }
      )
    }

    if (!invite) {
      return NextResponse.json({ error: "invite_not_found" }, { status: 404 })
    }
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id,league_id")
    .eq("id", playerId)
    .eq("league_id", leagueId)
    .maybeSingle()

  if (playerError) {
    return NextResponse.json({ error: "player_lookup_failed" }, { status: 500 })
  }

  if (!player) {
    return NextResponse.json({ error: "invalid_player" }, { status: 400 })
  }

  let joinableSeasonId =
    typeof league.active_season_id === "string" ? league.active_season_id : ""

  if (!joinableSeasonId) {
    const { data: latestSeason, error: latestSeasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("league_id", leagueId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestSeasonError) {
      return NextResponse.json(
        { error: "season_lookup_failed" },
        { status: 500 },
      )
    }

    joinableSeasonId = latestSeason?.id ?? ""
  }

  if (!joinableSeasonId) {
    return NextResponse.json({ error: "invalid_player" }, { status: 400 })
  }

  const [seasonPlayerResult, substituteResult] = await Promise.all([
    supabase
      .from("season_players")
      .select("id")
      .eq("season_id", joinableSeasonId)
      .eq("player_id", playerId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("season_substitutes")
      .select("id")
      .eq("season_id", joinableSeasonId)
      .eq("player_id", playerId)
      .eq("active", true)
      .maybeSingle(),
  ])

  if (seasonPlayerResult.error || substituteResult.error) {
    return NextResponse.json(
      { error: "claimable_player_lookup_failed" },
      { status: 500 },
    )
  }

  if (!seasonPlayerResult.data && !substituteResult.data) {
    return NextResponse.json({ error: "invalid_player" }, { status: 400 })
  }

  const { data: existingUserMembership, error: existingUserMembershipError } =
    await supabase
      .from("league_memberships")
      .select("id")
      .eq("user_id", userId)
      .eq("league_id", leagueId)
      .limit(1)
      .maybeSingle()

  if (existingUserMembershipError) {
    return NextResponse.json(
      { error: "user_membership_lookup_failed" },
      { status: 500 }
    )
  }

  if (existingUserMembership) {
    return NextResponse.json(
      { ok: false, error: "already-in-league" },
      { status: 409 }
    )
  }

  const { data: existingPlayerMembership, error: existingPlayerMembershipError } =
    await supabase
      .from("league_memberships")
      .select("id")
      .eq("league_id", leagueId)
      .eq("player_id", playerId)
      .limit(1)
      .maybeSingle()

  if (existingPlayerMembershipError) {
    return NextResponse.json(
      { error: "player_membership_lookup_failed" },
      { status: 500 }
    )
  }

  if (existingPlayerMembership) {
    return NextResponse.json(
      { ok: false, error: "player-already-claimed" },
      { status: 409 }
    )
  }

  const { data: membership, error: membershipError } = await supabase
    .from("league_memberships")
    .insert({
      user_id: userId,
      league_id: leagueId,
      player_id: playerId,
      role: "player",
    })
    .select("league_id,player_id,role")
    .single()

  if (membershipError) {
    if (isUniqueViolation(membershipError)) {
      const { data: conflictingUserMembership } = await supabase
        .from("league_memberships")
        .select("id")
        .eq("user_id", userId)
        .eq("league_id", leagueId)
        .limit(1)
        .maybeSingle()

      if (conflictingUserMembership) {
        return NextResponse.json(
          { ok: false, error: "already-in-league" },
          { status: 409 }
        )
      }

      const { data: conflictingPlayerMembership } = await supabase
        .from("league_memberships")
        .select("id")
        .eq("league_id", leagueId)
        .eq("player_id", playerId)
        .limit(1)
        .maybeSingle()

      if (conflictingPlayerMembership) {
        return NextResponse.json(
          { ok: false, error: "player-already-claimed" },
          { status: 409 }
        )
      }
    }

    return NextResponse.json({ error: "membership_create_failed" }, { status: 500 })
  }

  const { error: spectatorDeleteError } = await supabase
    .from("league_spectators")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", userId)

  if (spectatorDeleteError) {
    // Claim success is authoritative; spectator cleanup remains best-effort.
  }

  return NextResponse.json({
    ok: true,
    membership: {
      userId: email,
      leagueId: membership.league_id,
      playerId: membership.player_id ?? "",
      role: toRole(membership.role),
    },
  })
}
