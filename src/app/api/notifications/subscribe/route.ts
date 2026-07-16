import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import { defaultNotificationPreferences } from "@/lib/notificationSettings"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"

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
  const body = await parseJsonBody<{
    leagueId?: string
    playerId?: string
    subscription?: unknown
  }>(request)
  const leagueId = validateUuid(body?.leagueId)
  const requestedPlayerId = validateUuid(body?.playerId)
  const endpoint = getEndpoint(body?.subscription)
  const keys = getKeys(body?.subscription)

  if (!leagueId) {
    return NextResponse.json({ error: "invalid_league" }, { status: 400 })
  }

  if (!endpoint || !keys.p256dh || !keys.auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (
    requestedPlayerId &&
    access.actor.membership?.playerId &&
    requestedPlayerId !== access.actor.membership.playerId
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const playerId = access.actor.membership?.playerId ?? null
  const { error } = await access.actor.supabase.from("push_subscriptions").upsert(
    {
      league_id: leagueId,
      user_email: access.actor.user.email,
      player_id: playerId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: request.headers.get("user-agent") ?? null,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "league_id,endpoint" }
  )

  if (error) {
    return NextResponse.json(
      { error: "push_subscription_upsert_failed" },
      { status: 500 }
    )
  }

  const { data: existingPreferences, error: existingPreferencesError } =
    await access.actor.supabase
      .from("notification_preferences")
      .select("id")
      .eq("league_id", leagueId)
      .eq("user_email", access.actor.user.email)
      .maybeSingle()

  if (existingPreferencesError) {
    return NextResponse.json(
      { error: "notification_preferences_lookup_failed" },
      { status: 500 }
    )
  }

  if (!existingPreferences) {
    const { error: insertPreferencesError } = await access.actor.supabase
      .from("notification_preferences")
      .insert({
        league_id: leagueId,
        user_email: access.actor.user.email,
        settings: defaultNotificationPreferences,
        updated_at: new Date().toISOString(),
      })

    if (insertPreferencesError) {
      return NextResponse.json(
        { error: "notification_preferences_create_failed" },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ ok: true })
}
