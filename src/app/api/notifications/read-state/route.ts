import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = { eventId?: unknown; eventIds?: unknown[] }

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  const { data, error } = await authResult.actor.supabase
    .from("notification_reads")
    .select("event_id,read_at")
    .eq("user_id", authResult.actor.user.id)

  if (error) return NextResponse.json({ error: "notification_read_state_failed" }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  const body = await parseJsonBody<Body>(request)
  const ids = [
    ...(typeof body?.eventId === "string" ? [body.eventId] : []),
    ...(Array.isArray(body?.eventIds) ? body.eventIds.filter((id): id is string => typeof id === "string") : []),
  ].filter((id, index, all) => validateUuid(id) && all.indexOf(id) === index)

  if (ids.length === 0 || ids.length > 250) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const rows = ids.map((eventId) => ({ user_id: authResult.actor.user.id, event_id: eventId }))
  const { error } = await authResult.actor.supabase
    .from("notification_reads")
    .upsert(rows, { onConflict: "user_id,event_id" })

  if (error) return NextResponse.json({ error: "notification_read_state_failed" }, { status: 500 })
  return NextResponse.json({ ok: true, count: ids.length })
}
