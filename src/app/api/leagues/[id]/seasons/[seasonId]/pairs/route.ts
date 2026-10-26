import { NextResponse } from "next/server"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const { id, seasonId } = await params
  if (!validateUuid(id) || !validateUuid(seasonId)) return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  const access = await getServerSeasonAdmin(id, seasonId, { requireMutable: true })
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const body = await parseJsonBody<{ roster?: unknown; pairs?: unknown }>(request)
  const roster = body?.roster
  const pairs = body?.pairs
  if (!roster || typeof roster !== "object" || Array.isArray(roster) || Object.keys(roster).length > 32 ||
    !Object.entries(roster).every(([key, value]) => validateUuid(key) && (value === null || Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 16)) ||
    !Array.isArray(pairs) || pairs.length > 16 || !pairs.every(pair => Array.isArray(pair) && pair.length === 2 && pair.every(player => typeof player === "string" && validateUuid(player) && Object.hasOwn(roster, player))) ||
    new Set(pairs.flat()).size !== pairs.length * 2) return NextResponse.json({ error: "invalid_fixed_pairs" }, { status: 400 })
  const { data, error } = await access.actor.supabase.rpc("server_set_registration_pairs", {
    p_actor_user_id: access.actor.user.id, p_league_id: id, p_season_id: seasonId, p_roster: roster, p_pairs: pairs,
  })
  if (error) {
    const code = ["roster_changed", "registration_closed", "self_registration_not_enabled", "played_calendar_immutable", "invalid_fixed_pairs", "forbidden"].find(code => error.message.includes(code))
    return NextResponse.json({ error: code ?? "save_pairs_failed" }, { status: code === "forbidden" ? 403 : code ? 409 : 500 })
  }
  return NextResponse.json({ ok: true, calendarInvalidated: data === true })
}
