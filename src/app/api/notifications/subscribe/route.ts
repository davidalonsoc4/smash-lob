import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"

export const runtime = "nodejs"

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function getEndpoint(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return ""
  }

  const subscription = value as Record<string, unknown>
  return typeof subscription.endpoint === "string" ? subscription.endpoint : ""
}

function getKeys(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return { p256dh: "", auth: "" }
  }

  const subscription = value as Record<string, unknown>
  const keys = subscription.keys

  if (typeof keys !== "object" || keys === null) {
    return { p256dh: "", auth: "" }
  }

  const typedKeys = keys as Record<string, unknown>

  return {
    p256dh: typeof typedKeys.p256dh === "string" ? typedKeys.p256dh : "",
    auth: typeof typedKeys.auth === "string" ? typedKeys.auth : "",
  }
}

export async function POST(request: Request) {
  const session = await auth()
  const email = normalizeEmail(session?.user?.email)
  const body = (await request.json().catch(() => null)) as {
    leagueId?: string
    playerId?: string
    subscription?: unknown
  } | null
  const leagueId = body?.leagueId?.trim() ?? ""
  const rawPlayerId = body?.playerId?.trim() ?? ""
  const playerId = isUuid(rawPlayerId) ? rawPlayerId : null
  const endpoint = getEndpoint(body?.subscription)
  const keys = getKeys(body?.subscription)

  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!isUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league" }, { status: 400 })
  }

  if (!endpoint || !keys.p256dh || !keys.auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return NextResponse.json({ error: "missing_service_role" }, { status: 501 })
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      league_id: leagueId,
      user_email: email,
      player_id: playerId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: request.headers.get("user-agent") ?? null,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
