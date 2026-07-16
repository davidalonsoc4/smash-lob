import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await parseJsonBody<{
    leagueId?: string
    endpoint?: string
  }>(request)
  const leagueId = validateUuid(body?.leagueId)
  const endpoint = body?.endpoint?.trim() ?? ""

  if (!leagueId) {
    return NextResponse.json({ error: "invalid_league" }, { status: 400 })
  }

  if (!endpoint) {
    return NextResponse.json({ ok: true })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { error } = await access.actor.supabase
    .from("push_subscriptions")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("league_id", leagueId)
    .eq("endpoint", endpoint)
    .eq("user_email", access.actor.user.email)

  if (error) {
    return NextResponse.json(
      { error: "push_subscription_disable_failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
