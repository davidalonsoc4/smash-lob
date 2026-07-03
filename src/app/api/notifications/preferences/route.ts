import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import {
  defaultNotificationPreferences,
  normalizeNotificationPreferences,
} from "@/lib/notificationSettings"

export const runtime = "nodejs"

type PreferenceRow = {
  settings: unknown
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function getSessionEmail() {
  const session = await auth()
  return normalizeEmail(session?.user?.email)
}

export async function GET(request: Request) {
  const email = await getSessionEmail()
  const url = new URL(request.url)
  const leagueId = url.searchParams.get("leagueId")?.trim() ?? ""

  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!isUuid(leagueId)) {
    return NextResponse.json(
      { preferences: defaultNotificationPreferences, isConfigured: false },
      { status: 200 }
    )
  }

  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return NextResponse.json(
      { preferences: defaultNotificationPreferences, isConfigured: false },
      { status: 200 }
    )
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("settings")
    .eq("league_id", leagueId)
    .eq("user_email", email)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { preferences: defaultNotificationPreferences, isConfigured: false },
      { status: 200 }
    )
  }

  return NextResponse.json({
    preferences: normalizeNotificationPreferences((data as PreferenceRow | null)?.settings),
    isConfigured: true,
  })
}

export async function POST(request: Request) {
  const email = await getSessionEmail()
  const body = (await request.json().catch(() => null)) as {
    leagueId?: string
    preferences?: unknown
  } | null
  const leagueId = body?.leagueId?.trim() ?? ""

  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!isUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league" }, { status: 400 })
  }

  const preferences = normalizeNotificationPreferences(body?.preferences)
  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return NextResponse.json({ error: "missing_service_role" }, { status: 501 })
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        league_id: leagueId,
        user_email: email,
        settings: preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "league_id,user_email" }
    )
    .select("settings")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    preferences: normalizeNotificationPreferences((data as PreferenceRow).settings),
    isConfigured: true,
  })
}
