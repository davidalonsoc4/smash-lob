import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import type { LeagueExperienceMode } from "@/data/fakeData"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = { mode?: unknown }

function parseMode(value: unknown): LeagueExperienceMode | null {
  return value === "admin" || value === "player" || value === "player_experience"
    ? value
    : null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leagueId } = await params
  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<Body>(request)
  const mode = parseMode(body?.mode)
  if (!mode) {
    return NextResponse.json({ error: "invalid_experience_mode" }, { status: 400 })
  }

  if (access.actor.user.isSuperuser && !access.actor.membership) {
    return NextResponse.json({ error: "membership_required" }, { status: 409 })
  }

  const { error } = await access.actor.supabase
    .from("league_memberships")
    .update({ experience_mode: mode })
    .eq("league_id", leagueId)
    .eq("user_id", access.actor.user.id)

  if (error) {
    return NextResponse.json({ error: "experience_mode_update_failed" }, { status: 500 })
  }

  return NextResponse.json({ mode })
}
