import { NextResponse } from "next/server"
import { getServerLeagueViewer } from "@/lib/serverLeagueAccess"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { dispatchPushForActivityEvent } from "@/lib/serverPushDispatch"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedAppUser()
  const body = (await request.json().catch(() => null)) as {
    eventId?: string
  } | null
  const eventId = validateUuid(body?.eventId)

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  if (!eventId) {
    return NextResponse.json({ error: "missing_event" }, { status: 400 })
  }

  const { data: event, error: eventError } = await authResult.actor.supabase
    .from("activity_events")
    .select("league_id")
    .eq("id", eventId)
    .maybeSingle()

  if (eventError) {
    return NextResponse.json(
      { error: "activity_event_lookup_failed" },
      { status: 500 }
    )
  }

  if (!event?.league_id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  const access = await getServerLeagueViewer(event.league_id, {
    requireAdmin: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const result = await dispatchPushForActivityEvent(eventId)

  if (!result.ok) {
    const status =
      result.reason === "missing_service_role" || result.reason === "missing_vapid"
        ? 501
        : 500

    return NextResponse.json({ error: "dispatch_failed" }, { status })
  }

  return NextResponse.json(result)
}
