import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"
import {
  defaultNotificationPreferences,
  normalizeNotificationPreferences,
} from "@/lib/notificationSettings"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"

type PreferenceRow = {
  settings: unknown
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const leagueId = validateUuid(url.searchParams.get("leagueId"))

  if (!leagueId) {
    return NextResponse.json({ error: "invalid_league" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { data, error } = await access.actor.supabase
    .from("notification_preferences")
    .select("settings")
    .eq("league_id", leagueId)
    .eq("user_email", access.actor.user.email)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      {
        preferences: defaultNotificationPreferences,
        isConfigured: false,
        error: "notification_preferences_lookup_failed",
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    preferences: normalizeNotificationPreferences((data as PreferenceRow | null)?.settings),
    isConfigured: Boolean(data),
  })
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{
    leagueId?: string
    preferences?: unknown
  }>(request)
  const leagueId = validateUuid(body?.leagueId)

  if (!leagueId) {
    return NextResponse.json({ error: "invalid_league" }, { status: 400 })
  }

  const access = await getServerLeagueActor(leagueId, { requireMember: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const preferences = normalizeNotificationPreferences(body?.preferences)
  const { data, error } = await access.actor.supabase
    .from("notification_preferences")
    .upsert(
      {
        league_id: leagueId,
        user_email: access.actor.user.email,
        settings: preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "league_id,user_email" }
    )
    .select("settings")
    .single()

  if (error) {
    return NextResponse.json(
      { error: "notification_preferences_update_failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    preferences: normalizeNotificationPreferences((data as PreferenceRow).settings),
    isConfigured: true,
  })
}
